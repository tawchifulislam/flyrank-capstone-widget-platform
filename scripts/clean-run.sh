BASE=http://localhost:3001

echo "### 1 remove containers and the database volume (clean machine)"
docker compose down -v
echo

echo "### 2 build and start with one command"
docker compose build --quiet
docker compose up -d
echo

echo "### 3 wait for the health endpoint"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/health)
  if [ "$code" = "200" ]; then
    break
  fi
  sleep 2
done
curl -s -w "\nHTTP %{http_code}\n" $BASE/health
echo

echo "### 4 containers and app log (migrations ran on start)"
docker compose ps
docker compose logs app --tail 12
echo

echo "### 5 seed step"
docker compose exec -T app npm run seed
echo

echo "### 6 demo widget config"
curl -s -w "\nHTTP %{http_code}\n" $BASE/widgets/demo-widget/config
echo

echo "### 7 a visitor submits to the demo widget"
curl -s -w "\nHTTP %{http_code}\n" -X POST $BASE/submissions -H "Content-Type: application/json" -d '{"widgetId":"demo-widget","data":{"email":"demo-visitor@example.com","message":"hello from a clean run"}}'
echo

echo "### 8 the demo owner logs in and reads the dashboard"
TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo-password-123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/dashboard/submissions" -H "Authorization: Bearer $TOKEN"