BASE=http://localhost:3001
WID=9XaNF0jKmUQA

echo "### 1 normal submission, email side effect works"
curl -s -w "\nHTTP %{http_code} in %{time_total}s\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"side-ok@example.com\",\"message\":\"email works\"}}"
echo

echo "### 2 email side effect forced to fail, submission must still succeed"
curl -s -w "\nHTTP %{http_code} in %{time_total}s\n" -X POST $BASE/submissions -H "Content-Type: application/json" -H "X-Mock-Email-Fail: true" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"side-fail@example.com\",\"message\":\"email fails\"}}"
echo

sleep 2

echo "### 3 stored rows"
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select id, data->>'email' as email from submissions where data->>'email' like 'side-%' order by id;"