BASE=http://localhost:3001
POST="curl -s -w \nHTTP_%{http_code}\n -X POST $BASE/submissions -H Content-Type:application/json"
KEY=retry-key-$(date +%s)
PKEY=parallel-key-$(date +%s)
BODY='{"widgetId":"demo-widget","data":{"email":"idem@example.com","message":"retried submission"}}'
PBODY='{"widgetId":"demo-widget","data":{"email":"parallel@example.com","message":"parallel retries"}}'
NBODY='{"widgetId":"demo-widget","data":{"email":"nokey@example.com","message":"no key"}}'

echo "### 1 first request with key $KEY"
$POST -H "Idempotency-Key: $KEY" -d "$BODY"
echo

echo "### 2 same key again (a retry)"
$POST -H "Idempotency-Key: $KEY" -d "$BODY"
echo

echo "### 3 same key a third time"
$POST -H "Idempotency-Key: $KEY" -d "$BODY"
echo

echo "### 4 a different key is a new submission"
$POST -H "Idempotency-Key: $KEY-second" -d "$BODY"
echo

echo "### 5 no key at all still works"
$POST -d "$NBODY"
echo

sleep 11

echo "### 6 invalid key"
$POST -H "Idempotency-Key: bad key!" -d "$BODY"
echo

echo "### 7 four parallel requests with the same new key"
for i in 1 2 3 4; do
  $POST -H "Idempotency-Key: $PKEY" -d "$PBODY" &
done
wait
echo

sleep 2

echo "### 8 rows stored per email (retried 3 times and 2 keys, no key, 4 parallel)"
docker compose exec -T db psql -U widget -d widgets -P pager=off -c "select data->>'email' as email, count(*) as rows from submissions where data->>'email' in ('idem@example.com','nokey@example.com','parallel@example.com') group by 1 order by 1;"
echo

echo "### 9 emails sent by the background job (one per stored row, none for retries)"
docker compose logs app --tail 60 | grep "EMAIL sent"