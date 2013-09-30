echo "=======================Combining======================="

ver="0.995"
thedate=$(date)
type=""

cat src/copyright.txt src/utils/getterSetter.js src/utils/http/Ti-httpModule.js src/utils/http/urlFactory.js src/EventManager.js src/config.js src/session.js src/filter.js src/queries.js src/baseObject.js src/guid.js src/articleCollection.js src/connectionCollection.js src/article.js src/connection.js src/Users.js src/email.js src/Ti-facebook.js src/push.js src/file.js src/date.js src/Ti-localstorage.js src/cookie.js src/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > Ti-AppacitiveSDK.js

echo "Done combining Ti-AppacitiveSDK.js"