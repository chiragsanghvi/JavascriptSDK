echo "=======================Combining======================="

cat src/utils/getterSetter.js src/utils/http/httpModule.js src/utils/http/urlFactory.js src/EventManager.js src/config.js src/session.js src/filter.js src/queries.js src/baseObject.js src/guid.js src/articleCollection.js src/connectionCollection.js src/article.js src/connection.js src/Users.js src/email.js src/facebook.js src/push.js src/file.js src/date.js src/localstorage.js src/cookie.js src/export.js > AppacitiveSDK.js

echo "Done combining AppacitiveSDK.js"

echo "================Minifying AppacitiveSDK.js============="

in=AppacitiveSDK.js
out=AppacitiveSDK.min.js

curl -s \
  -d compilation_level=SIMPLE_OPTIMIZATIONS \
  -d output_format=text \
  -d output_info=compiled_code \
  --data-urlencode "js_code@${in}" \
  http://closure-compiler.appspot.com/compile \
  >> $out

echo "============Minified AppacitiveSDK.min.js=============="