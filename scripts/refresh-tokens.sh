BASE=http://localhost:3001

login() {
  curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"password123\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

A=$(login a@test.com)
B=$(login b@test.com)

sed -i '/^TOKEN_A=/d;/^TOKEN_B=/d' .env
printf '\nTOKEN_A=%s\nTOKEN_B=%s\n' "$A" "$B" >> .env
echo "tokens refreshed: ${#A} ${#B}"