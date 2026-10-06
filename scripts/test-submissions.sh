BASE=http://localhost:3001
WID=9XaNF0jKmUQA
BIG=$(head -c 20000 /dev/zero | tr '\0' 'a')

echo "### 1 preflight"
curl -s -i -X OPTIONS $BASE/submissions -H "Origin: http://localhost:5500" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
echo

echo "### 2 valid submission from another origin"
curl -s -i -X POST $BASE/submissions -H "Content-Type: application/json" -H "Origin: http://localhost:5500" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"visitor@example.com\",\"message\":\"Hello from another origin\"}}"
echo

echo "### 3 invalid email"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"not-an-email\"}}"
echo

echo "### 4 unknown field"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"a@b.com\",\"message\":\"x\",\"extra\":\"y\"}}"
echo

echo "### 5 unknown widget"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d '{"widgetId":"unknown","data":{}}'
echo

echo "### 6 malformed json"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d '{"bad json'
echo

echo "### 7 oversized payload"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"a@b.com\",\"message\":\"$BIG\"}}"
echo

echo "### 8 stored rows"
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select id, widget_id, owner_id, data, ip from submissions;"