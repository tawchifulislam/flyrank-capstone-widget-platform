BASE=http://localhost:3001
WID=9XaNF0jKmUQA

echo "### 1 provider A up: enriched by A"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"geo-a@example.com\",\"message\":\"provider A answers\"}}"
echo

echo "### 2 provider A down: enriched by B"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -H "X-Mock-Geo-Down: a" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"geo-b@example.com\",\"message\":\"provider A down\"}}"
echo

echo "### 3 providers A and B down: stored without geo"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -H "X-Mock-Geo-Down: a,b" -d "{\"widgetId\":\"$WID\",\"data\":{\"email\":\"geo-none@example.com\",\"message\":\"all providers down\"}}"
echo

echo "### 4 stored rows"
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select id, data->>'email' as email, country, city from submissions where data->>'email' like 'geo-%' order by id;"