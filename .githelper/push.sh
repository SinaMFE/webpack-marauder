set -e
echo "请输入commit message: "
read MESSAGE

echo "Releasing $MESSAGE ..."
  MESSAGE=$MESSAGE

# commit
git add -A
git commit -m "$MESSAGE"
# publish
git push
