(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;

    // base xmlhttprequest class
    /**
     * @constructor
     */

    var _XDomainRequest = function(request) {
        var promise = Appacitive.Promise.buildPromise({
            success: request.onSuccess,
            error: request.onError
        });
        var xdr = new XDomainRequest();
        xdr.onload = function() {
            var response = xdr.responseText;
            var contentType = xdr.contentType || '';
            if (contentType.toLowerCase() == 'application/json' || contentType.toLowerCase() == 'application/javascript' || contentType.toLowerCase() == 'application/json; charset=utf-8' || contentType.toLowerCase() == 'application/json; charset=utf-8;') {
                try {
                    var jData = response;
                    if (!Appacitive.runtime.isBrowser) {
                        if (jData[0] != "{") {
                            jData = jData.substr(1, jData.length - 1);
                        }
                    }
                    response = JSON.parse(jData);
                } catch (e) {
                    return promise.reject(xdr, new Appacitive.Error(Appacitive.Error.InvalidJson, 'Error while parsing received json ' + response));
                }
            }
            promise.fulfill(response, this);
        };
        xdr.onerror = xdr.ontimeout = function() {
            // Let's fake a real error message.
            xdr.responseData = "IE's XDomainRequest does not supply error info."
            xdr.status = Appacitive.Error.XDomainRequest;
            promise.reject(xdr, new Appacitive.Error(Appacitive.Error.XDomainRequest, xdr.responseData, "Unknown"));
        };
        xdr.onprogress = function() {};
        if (request.url.indexOf('?') === -1)
            request.url = request.url + '?ua=ie';
        else
            request.url = request.url + '&ua=ie';

        xdr.open(request.method, request.url, request.sync ? false : true);
        xdr.send(request.data);
        return promise;
    };

    var _xmlHttpRequest = (Appacitive.runtime.isBrowser) ? XMLHttpRequest : require('xmlhttprequest-with-globalagent').XMLHttpRequest;

    Appacitive._Http = function(request) {

        if (!request.url) throw new Error("Please specify request url");
        if (!request.method) request.method = 'GET';
        if (!request.headers) request.headers = [];
        var data = {};

        if (!request.onSuccess || !(typeof request.onSuccess == 'function')) request.onSuccess = function() {};
        if (!request.onError || !(typeof request.onError == 'function')) request.onError = function() {};


        var promise = Appacitive.Promise.buildPromise({
            success: request.onSuccess,
            error: request.onError
        });

        var doNotStringify = true;
        request.headers.forEach(function(r) {
            if (r.key.toLowerCase() == 'content-type') {
                doNotStringify = true;
                if (r.value.toLowerCase() == 'application/json' || r.value.toLowerCase() == "application/javascript" || r.value.toLowerCase() == 'application/json; charset=utf-8' || r.value.toLowerCase() == 'application/json; charset=utf-8;') {
                    doNotStringify = false;
                }
            }
        });


        if (doNotStringify) data = request.data;
        else {
            if (request.data) {
                data = request.data;
                if (typeof request.data == 'object') {
                    try {
                        data = JSON.stringify(data);
                    } catch (e) {}
                }
            }
        }


        var urlDomain = request.url.split('/')[2] || '';
        if (global.navigator && (_type.isObject(global.navigator.userAgent) && _type.isFunction(global.navigator.userAgent.indexOf) && global.navigator.userAgent.indexOf('MSIE 9') != -1) && (global.location && global.location.host && urlDomain !== global.location.host.toLowerCase())) {
            request.data = data;
            var xdr = new _XDomainRequest(request);
            return xdr;
        } else {
            var xhr = new _xmlHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                        var response = xhr.responseText;

                        var contentType = xhr.getResponseHeader('content-type') || xhr.getResponseHeader('Content-Type') || '';

                        if (contentType.toLowerCase() == 'application/json' || contentType.toLowerCase() == 'application/javascript' || contentType.toLowerCase() == 'application/json; charset=utf-8' || contentType.toLowerCase() == 'application/json; charset=utf-8;') {
                            try {
                                var jData = response;
                                if (!Appacitive.runtime.isBrowser) {
                                    if (jData[0] != "{") {
                                        jData = jData.substr(1, jData.length - 1);
                                    }
                                }
                                response = JSON.parse(jData);
                            } catch (e) {
                                return promise.reject(xhr, new Appacitive.Error(Appacitive.Error.InvalidJson, 'Error while parsing received json ' + response));
                            }
                        }
                        promise.fulfill(response, xhr);
                    } else {
                        promise.reject(xhr, new Appacitive.Error(Appacitive.Error.ConnectionFailed, xhr.responseText, "Unknown"));
                    }
                }
            };

            xhr.open(request.method, request.url, request.sync ? false : true);

            for (var x = 0; x < request.headers.length; x += 1)
                xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);

            if (!Appacitive.runtime.isBrowser)
                xhr.setRequestHeader('User-Agent', 'Appacitive-NodeJSSDK');

            xhr.send(data);

            return promise;
        }
    };


})(global);
