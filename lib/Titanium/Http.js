(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;

    var _XMLHttpRequest = Titanium.Network.createHTTPClient();;

    // base xmlhttprequest class
    /**
     * @constructor
     */
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
        if (global.navigator && (global.navigator.userAgent.indexOf('MSIE 8') != -1) && urlDomain !== window.location.host.toLowerCase()) {
            request.data = data;
            var xdr = new _XDomainRequest(request);
            return xdr;
        } else {
            var xhr = new _XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if ((this.status >= 200 && this.status < 300) || this.status == 304) {
                        var response = this.responseText;

                        var contentType = this.getResponseHeader('content-type') || this.getResponseHeader('Content-Type') || '';

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
                                return promise.reject(this, new Appacitive.Error(Appacitive.Error.InvalidJson, 'Error while parsing received json ' + response));
                            }
                        }
                        promise.fulfill(response, this);
                    } else {
                        promise.reject(this, new Appacitive.Error(Appacitive.Error.ConnectionFailed, this.responseText, "Unknown"));
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
