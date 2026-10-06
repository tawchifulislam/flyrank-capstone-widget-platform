BASE=http://localhost:3001
WID=9XaNF0jKmUQA
OTHER=KE_dFrE5YI0Y
BODY="{\"widgetId\":\"$WID\",\"data\":{\"email\":\"burst@example.com\",\"message\":\"burst\"}}"
COUNT="docker compose exec -T db psql -U widget -d widgets -t -A -c"

echo "### 1 burst of 12 rapid submissions (status codes in order)"
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code} " -X POST $BASE/submissions -H "Content-Type: application/json" -d "$BODY"
done
echo
echo

echo "### 2 a rejected request in detail"
curl -s -i -X POST $BASE/submissions -H "Content-Type: application/json" -H "Origin: http://localhost:5500" -d "$BODY"
echo
echo

echo "### 3 right after the burst: another widget and the health endpoint still work"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$OTHER\",\"data\":{\"email\":\"other@example.com\",\"message\":\"other widget\"}}"
curl -s -w "\nHTTP %{http_code}\n" $BASE/health
echo

echo "### 4 after the window passes the same widget accepts submissions again"
sleep 11
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"normal@example.com\",\"message\":\"normal request\"}}"
echo

echo "### 5 honeypot filled like a bot"
echo "rows before:"
$COUNT "select count(*) from submissions;"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"bot@example.com\",\"message\":\"buy now\"},\"honeypot\":\"I am a bot\"}"
echo "rows after:"
$COUNT "select count(*) from submissions;"
echo

echo "### 6 stored emails from the burst, the other widget, and the bot"
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select data->>'email' as email, count(*) from submissions group by 1 order by 1;"