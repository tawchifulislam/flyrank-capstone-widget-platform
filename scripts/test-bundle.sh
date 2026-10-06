BASE=http://localhost:3001
WID=9XaNF0jKmUQA

echo "### 1 loader (the stable embed URL), short cache"
curl -s -i "$BASE/widget.js?id=$WID" | head -n 12
echo

echo "### 2 bundle URL named inside the loader"
BUNDLE=$(curl -s "$BASE/widget.js?id=$WID" | grep -o '/assets/widget\.[a-f0-9]*\.js')
echo $BUNDLE
echo

echo "### 3 versioned bundle, long immutable cache"
curl -s -i "$BASE$BUNDLE" | head -n 12
echo

echo "### 4 wrong version hash"
curl -s -i "$BASE/assets/widget.0000000000.js"
echo

echo "### 5 embed snippet of the widget (from the config of widget CRUD)"
echo "<script src=\"$BASE/widget.js?id=$WID\"></script>"