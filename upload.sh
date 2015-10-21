#!/bin/bash

# Accepts a version string and prints it incremented by one.
# Usage: increment_version <version> [<position>] [<leftmost>]
function increment_version() {
   local usage=" USAGE: $FUNCNAME [-l] [-t] <version> [<position>] [<leftmost>]
           -l : remove leading zeros
           -t : drop trailing zeros
    <version> : The version string.
   <position> : Optional. The position (starting with one) of the number 
                within <version> to increment.  If the position does not 
                exist, it will be created.  Defaults to last position.
   <leftmost> : The leftmost position that can be incremented.  If does not
                exist, position will be created.  This right-padding will
                occur even to right of <position>, unless passed the -t flag."

   # Get flags.
   local flag_remove_leading_zeros=0
   local flag_drop_trailing_zeros=0
   while [ "${1:0:1}" == "-" ]; do
      if [ "$1" == "--" ]; then shift; break
      elif [ "$1" == "-l" ]; then flag_remove_leading_zeros=1
      elif [ "$1" == "-t" ]; then flag_drop_trailing_zeros=1
      else echo -e "Invalid flag: ${1}\n$usage"; return 1; fi
      shift; done

   # Get arguments.
   if [ ${#@} -lt 1 ]; then echo "$usage"; return 1; fi
   local v="${1}"             # version string
   local targetPos=${2-last}  # target position
   local minPos=${3-${2-0}}   # minimum position

   # Split version string into array using its periods. 
   local IFSbak; IFSbak=IFS; IFS='.' # IFS restored at end of func to                     
   read -ra v <<< "$v"               #  avoid breaking other scripts.

   # Determine target position.
   if [ "${targetPos}" == "last" ]; then 
      if [ "${minPos}" == "last" ]; then minPos=0; fi
      targetPos=$((${#v[@]}>${minPos}?${#v[@]}:$minPos)); fi
   if [[ ! ${targetPos} -gt 0 ]]; then
      echo -e "Invalid position: '$targetPos'\n$usage"; return 1; fi
   (( targetPos--  )) || true # offset to match array index

   # Make sure minPosition exists.
   while [ ${#v[@]} -lt ${minPos} ]; do v+=("0"); done;

   # Increment target position.
   v[$targetPos]=`printf %0${#v[$targetPos]}d $((${v[$targetPos]}+1))`;

   # Remove leading zeros, if -l flag passed.
   if [ $flag_remove_leading_zeros == 1 ]; then
      for (( pos=0; $pos<${#v[@]}; pos++ )); do
         v[$pos]=$((${v[$pos]}*1)); done; fi

   # If targetPosition was not at end of array, reset following positions to
   #   zero (or remove them if -t flag was passed).
   if [[ ${flag_drop_trailing_zeros} -eq "1" ]]; then
        for (( p=$((${#v[@]}-1)); $p>$targetPos; p-- )); do unset v[$p]; done
   else for (( p=$((${#v[@]}-1)); $p>$targetPos; p-- )); do v[$p]=0; done; fi

   echo "${v[*]}"
   IFS=IFSbak
   return 0
}

echo "Please enter previous version no in the form of x.x.x: "
read version
minifiedFile="appacitive-js-sdk-v$version.min.js"
minSearchText='./appacitive-js-sdk-v'
minResult="${minifiedFile/$minSearchText/}"
minExt='.min.js'

oldVersion="${minResult/.min.js/}"
echo 'old version' $oldVersion

ver=$(increment_version $oldVersion)
echo 'new version' $ver

newFile="$ver.js"
newMinifiedFile="$ver.min.js"

thedate=$(date)
type=""
format="String.Format"

cat lib/copyright.txt lib/init.js lib/http.js lib/httpModule.js lib/utils/utils.js lib/extend.js lib/utils/logger.js lib/utils/urlFactory.js lib/promise.js lib/EventManager.js  lib/events.js  lib/config.js lib/request.js  lib/error.js lib/session.js lib/filter.js lib/queries.js  lib/baseObject.js lib/guid.js  lib/acl.js  lib/object.js lib/connection.js lib/Users.js lib/collection.js lib/batch.js  lib/facebook.js lib/email.js lib/push.js lib/file.js lib/date.js lib/localstorage.js lib/cookie.js lib/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > AppacitiveSDK.js

echo "Done combining AppacitiveSDK.js"

cat lib/copyright.txt lib/init.js lib/node/http.js lib/httpModule.js lib/utils/utils.js lib/extend.js lib/utils/logger.js lib/utils/urlFactory.js lib/promise.js lib/EventManager.js  lib/events.js  lib/config.js lib/request.js  lib/error.js lib/session.js lib/filter.js lib/queries.js  lib/baseObject.js lib/guid.js  lib/acl.js  lib/object.js lib/connection.js lib/Users.js lib/collection.js lib/batch.js  lib/node/facebook.js lib/email.js lib/push.js lib/file.js lib/date.js lib/localstorage.js lib/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > node.js

echo "Done combining Node AppacitiveSDK node.js"

cat lib/copyright.txt lib/React-Native/init.js lib/http.js lib/httpModule.js lib/utils/utils.js lib/extend.js lib/utils/logger.js lib/utils/urlFactory.js lib/promise.js lib/EventManager.js  lib/events.js  lib/config.js lib/request.js  lib/error.js lib/session.js lib/filter.js lib/queries.js  lib/baseObject.js lib/guid.js  lib/acl.js  lib/object.js lib/connection.js lib/Users.js lib/collection.js lib/batch.js  lib/node/facebook.js lib/email.js lib/push.js lib/file.js lib/date.js lib/React-Native/localStorage.js lib/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > react-native.js

echo "Done combining React-Native AppacitiveSDK react-native.js"

cat lib/copyright.txt lib/init.js lib/Titanium/Http.js lib/httpModule.js lib/utils/utils.js lib/extend.js lib/utils/logger.js lib/utils/urlFactory.js lib/promise.js lib/EventManager.js  lib/events.js  lib/config.js lib/request.js lib/error.js lib/session.js lib/filter.js lib/queries.js  lib/baseObject.js lib/guid.js  lib/acl.js  lib/object.js lib/connection.js lib/Users.js lib/collection.js lib/batch.js lib/Titanium/Ti.Facebook.js lib/email.js lib/push.js lib/file.js lib/date.js lib/Titanium/Ti.Localstorage.js lib/cookie.js lib/Titanium/Ti.Export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g;s/\String.format/$format/g;" > Ti.AppacitiveSDK.js

echo "Done combining Ti.AppacitiveSDK.js"

echo "================Minifying AppacitiveSDK.js============="

in=AppacitiveSDK.js
out=SDK.min.js

java -jar compiler/compiler.jar --js $in --js_output_file $out

cat lib/copyright.txt SDK.min.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > AppacitiveSDK.min.js

rm $out;

echo "============Minified AppacitiveSDK.min.js=============="

echo "Do you want to upload it to S3: (y/n) ?"
read choice

if [ "$choice" == "y" ] 

then

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

rm ${newFile}.gz
rm ${newMinifiedFile}.gz

echo "==============Files uploaded to S3 successfully==========="

fi

echo "=============Done combining SDK's=========="
