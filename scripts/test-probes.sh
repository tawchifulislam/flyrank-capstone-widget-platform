BASE=http://localhost:3001
WID=demo-widget
TS=$(date +%s)
PASS=0
FAIL=0

check() {
  if [ "$2" = "$3" ]; then
    echo "PASS $1"
    PASS=$((PASS + 1))
  else
    echo "FAIL $1 (expected $3, got $2)"
    FAIL=$((FAIL + 1))
  fi
}

check_min() {
  if [ "$2" -ge "$3" ]; then
    echo "PASS $1 ($2)"
    PASS=$((PASS + 1))
  else
    echo "FAIL $1 (expected at least $3, got $2)"
    FAIL=$((FAIL + 1))
  fi
}

body() {
  echo "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"$1\",\"message\":\"probe $1\"}$2}"
}

submit() {
  curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/submissions -H "Content-Type: application/json" "${@:2}" -d "$1"
}

TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo-password-123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

list() {
  curl -s "$BASE/api/dashboard/submissions?limit=100" -H "Authorization: Bearer $TOKEN"
}

total() {
  list | grep -o '"total":[0-9]*' | head -n 1 | cut -d: -f2
}

echo "PROBE 1: valid submission from another origin is stored and visible in the dashboard"
E1=probe1-$TS@example.com
check "probe 1 returns 201" "$(submit "$(body $E1)" -H "Origin: http://localhost:5500")" 201
check "probe 1 submission is visible in the dashboard" "$(list | grep -c "\"email\":\"$E1\"")" 1
echo

echo "PROBE 2: malformed and oversized payloads give clean 4xx JSON errors, never 500"
RESP=$(curl -s -w "|%{http_code}" -X POST $BASE/submissions -H "Content-Type: application/json" -d '{"bad json')
check "probe 2 malformed json returns 400" "${RESP##*|}" 400
check "probe 2 malformed json error is JSON" "$(echo "${RESP%|*}" | grep -c '"error"')" 1
BIG=$(head -c 20000 /dev/zero | tr '\0' 'a')
RESP=$(curl -s -w "|%{http_code}" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"a@b.com\",\"message\":\"$BIG\"}}")
check "probe 2 oversized payload returns 413" "${RESP##*|}" 413
check "probe 2 oversized error is JSON" "$(echo "${RESP%|*}" | grep -c '"error"')" 1
echo

echo "PROBE 3: a burst returns 429 and the service keeps answering normal traffic"
sleep 11
CODES=""
for i in $(seq 1 12); do
  CODES="$CODES $(submit "$(body probe3-$TS-$i@example.com)")"
done
LIMITED=$(echo "$CODES" | grep -o 429 | wc -l | tr -d ' ')
check_min "probe 3 burst returns 429" "$LIMITED" 1
check "probe 3 health endpoint still answers during the burst window" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/health)" 200
sleep 11
check "probe 3 a normal request after the window returns 201" "$(submit "$(body probe3-normal-$TS@example.com)")" 201
echo

echo "PROBE 4: provider A down gives provider B enrichment, both down still stores the submission"
sleep 11
E4A=probe4a-$TS@example.com
check "probe 4 provider A down returns 201" "$(submit "$(body $E4A)" -H "X-Mock-Geo-Down: a")" 201
check "probe 4 row is enriched by provider B" "$(list | grep -o "\"email\":\"$E4A\",\"message\":\"[^\"]*\"},\"country\":\"[^\"]*\"" | grep -o 'Mockland B' | head -n 1)" "Mockland B"
E4B=probe4b-$TS@example.com
check "probe 4 both providers down returns 201" "$(submit "$(body $E4B)" -H "X-Mock-Geo-Down: a,b")" 201
check "probe 4 row is stored without geo" "$(list | grep -c "\"email\":\"$E4B\",\"message\":\"[^\"]*\"},\"country\":null")" 1
echo

echo "PROBE 5: a failing email side effect does not stop the submission"
E5=probe5-$TS@example.com
check "probe 5 returns 201" "$(submit "$(body $E5)" -H "X-Mock-Email-Fail: true")" 201
check "probe 5 submission is stored" "$(list | grep -c "\"email\":\"$E5\"")" 1
echo

echo "PROBE 6: a filled honeypot is dropped"
BEFORE=$(total)
check "probe 6 returns 201 without telling the bot" "$(submit "$(body probe6-$TS@example.com ',"honeypot":"I am a bot"')")" 201
AFTER=$(total)
check "probe 6 nothing was stored" "$AFTER" "$BEFORE"
echo

echo "passed $PASS, failed $FAIL"
if [ "$FAIL" -ne 0 ]; then
  exit 1
fi