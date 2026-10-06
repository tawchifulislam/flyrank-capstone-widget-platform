BASE=http://localhost:3001
WID=9XaNF0jKmUQA

echo "### 1 config request from another origin"
curl -s -i $BASE/widgets/$WID/config -H "Origin: http://localhost:5500"
echo
echo

echo "### 2 payload size in bytes"
curl -s $BASE/widgets/$WID/config | wc -c
echo

echo "### 3 repeat request with the ETag, the server answers 304 with no body"
ETAG=$(curl -s -i $BASE/widgets/$WID/config | grep -i '^etag:' | cut -d' ' -f2- | tr -d '\r')
echo "etag used: $ETAG"
curl -s -i $BASE/widgets/$WID/config -H "If-None-Match: $ETAG"
echo
echo

echo "### 4 unknown widget"
curl -s -i $BASE/widgets/unknown/config
echo