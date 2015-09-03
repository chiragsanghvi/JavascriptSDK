#!/bin/bash

echo "=======================Combining======================="

function increment_version()
{
  declare -a part=( ${1//\./ } )
  declare    new
  declare -i carry=1

  for (( CNTR=${#part[@]}-1; CNTR>=0; CNTR-=1 )); do
    len=${#part[CNTR]}
    new=$((part[CNTR]+carry))
    [ ${#new} -gt $len ] && carry=1 || carry=0
    [ $CNTR -gt 0 ] && part[CNTR]=${new: -len} || part[CNTR]=${new}
  done
  new="${part[*]}"
  echo "${new// /.}"
} 

echo "Please enter version no: "
read version
minifiedFile="appacitive-js-sdk-v$version.min.js"
minSearchText='./appacitive-js-sdk-v'
minResult="${minifiedFile/$minSearchText/}"
minExt='.min.js'

oldVersion="${minResult/.min.js/}"
echo 'old version' $oldVersion

ver=$(increment_version $oldVersion)
echo 'new version' $ver

newFile="appacitive-js-sdk-v$ver.js"
newMinifiedFile="appacitive-js-sdk-v$ver.min.js"

thedate=$(date)
type=""
format="String.Format"

cat src/copyright.txt src/utils/getterSetter.js src/utils/http/httpModule.js src/utils/http/logger.js src/utils/http/urlFactory.js src/promise.js src/EventManager.js  src/events.js  src/config.js src/request.js src/extend.js src/error.js src/session.js src/filter.js src/queries.js  src/baseObject.js src/guid.js  src/acl.js  src/object.js src/connection.js src/Users.js src/collection.js src/batch.js  src/facebook.js src/email.js src/push.js src/file.js src/date.js src/localstorage.js src/cookie.js src/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > AppacitiveSDK.js

echo "Done combining AppacitiveSDK.js"

cat src/copyright.txt src/utils/getterSetter.js src/Titanium/Ti.HttpModule.js src/utils/http/logger.js src/utils/http/urlFactory.js src/promise.js src/EventManager.js  src/events.js  src/config.js src/request.js src/extend.js src/error.js src/session.js src/filter.js src/queries.js  src/baseObject.js src/guid.js  src/acl.js  src/object.js src/connection.js src/Users.js src/collection.js src/batch.js src/Titanium/Ti.Facebook.js src/email.js src/push.js src/file.js src/date.js src/Titanium/Ti.Localstorage.js src/Titanium/Ti.Cookie.js src/Titanium/Ti.Export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g;s/\String.format/$format/g;" > Ti.AppacitiveSDK.js

echo "Done combining Ti.AppacitiveSDK.js"

echo "================Minifying AppacitiveSDK.js============="

in=AppacitiveSDK.js
out=SDK.min.js

java -jar compiler/compiler.jar --js $in --js_output_file $out

cat src/copyright.txt SDK.min.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > AppacitiveSDK.min.js

rm $out;

echo "============Minified AppacitiveSDK.min.js=============="

echo "===============Compressing files======================="

gzip -c -9 AppacitiveSDK.js > ${newFile}.gz

echo "Compressed Appacitive.js"

gzip -c -9 AppacitiveSDK.min.js > ${newMinifiedFile}.gz

echo "Compressed Appacitive.min.js"

echo "================Files Compressed======================="

oneday=86400

echo "==================Uploading files to S3================"

s3cmd -P --add-header="Cache-Control:public, max-age=$oneday" --add-header="Content-Encoding:gzip" --mime-type="application/javascript" put ${newFile}.gz s3://appacitive-cdn/sdk/js/$newFile
s3cmd -P --add-header="Cache-Control:public, max-age=$oneday" --add-header="Content-Encoding:gzip" --mime-type="application/javascript" put ${newMinifiedFile}.gz s3://appacitive-cdn/sdk/js/$newMinifiedFile

echo "==============Files uploaded to S3 successfully==========="