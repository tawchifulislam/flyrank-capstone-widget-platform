BASE=http://localhost:3001
WID_A=9XaNF0jKmUQA
WID_B=KE_dFrE5YI0Y
TOKEN_A=$(grep '^TOKEN_A=' .env | cut -d= -f2-)
TOKEN_B=$(grep '^TOKEN_B=' .env | cut -d= -f2-)

echo "### 1 no token"
curl -s -w "\nHTTP %{http_code}\n" $BASE/api/dashboard/submissions
echo

echo "### 2 owner A, latest 3 submissions"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions?limit=3" -H "Authorization: Bearer $TOKEN_A"
echo

echo "### 3 owner A, filtered by own widget, second page of 2"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions?widgetId=$WID_A&limit=2&offset=2" -H "Authorization: Bearer $TOKEN_A"
echo

echo "### 4 owner B asks for owner A's widget"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions?widgetId=$WID_A" -H "Authorization: Bearer $TOKEN_B"
echo

echo "### 5 owner A asks for owner B's widget"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions?widgetId=$WID_B" -H "Authorization: Bearer $TOKEN_A"
echo

echo "### 6 owner B sees no submissions yet although owner A has many"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions" -H "Authorization: Bearer $TOKEN_B"
echo

echo "### 7 a visitor submits to owner B's widget"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d "{\"widgetId\":\"$WID_B\",\"data\":{\"email\":\"b-visitor@example.com\",\"message\":\"for owner B\"}}"
echo

echo "### 8 owner B now sees exactly that one submission"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions" -H "Authorization: Bearer $TOKEN_B"
echo

echo "### 9 invalid query"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions?limit=500" -H "Authorization: Bearer $TOKEN_A"
echo

echo "### 10 stats for owner A, last 30 days"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/stats?days=30" -H "Authorization: Bearer $TOKEN_A"
echo

echo "### 11 stats for owner B, last 30 days"
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/stats?days=30" -H "Authorization: Bearer $TOKEN_B"