echo "=======================Combining======================="

ver="0.995"
thedate=$(date)
type=""

cat src/copyright.txt src/utils/getterSetter.js src/utils/http/httpModule.js src/utils/http/urlFactory.js src/EventManager.js src/config.js src/session.js src/filter.js src/queries.js src/baseObject.js src/guid.js src/articleCollection.js src/connectionCollection.js src/article.js src/connection.js src/Users.js src/email.js src/facebook.js src/push.js src/file.js src/date.js src/localstorage.js src/cookie.js src/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > AppacitiveSDK.js

echo "Done combining AppacitiveSDK.js"

cat src/copyright.txt src/utils/getterSetter.js src/Titanium/Ti.HttpModule.js src/utils/http/urlFactory.js src/EventManager.js src/config.js src/session.js src/filter.js src/queries.js src/baseObject.js src/guid.js src/articleCollection.js src/connectionCollection.js src/article.js src/connection.js src/Users.js src/email.js src/Titanium/Ti.Facebook.js src/push.js src/file.js src/date.js src/Titanium/Ti.Localstorage.js src/Titanium/Ti.Cookie.js src/Titanium/Ti.Export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > Ti.AppacitiveSDK.js

echo "Done combining Ti.AppacitiveSDK.js"

echo "================Minifying AppacitiveSDK.js============="

in=AppacitiveSDK.js
out=AppacitiveSDK.min.js

java -jar /usr/local/lib/compiler.jar --js $in --js_output_file $out

echo "============Minified AppacitiveSDK.min.js=============="