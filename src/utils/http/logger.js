(function(global) {

    "use strict";

    global.Appacitive.logs = {};

    var invoke = function(callback, log) {
    	setTimeout(function() {
	    	try { callback.call({}, log); } catch(e) {}
	    }, 0);
	};

	global.Appacitive.logs.logRequest = function(request, response, status, type) {
		response = response || {};
		status = status || {};
		var body = {};
		try {
			body = JSON.parse(request.data) ;
			if (!_type.isObject(body)) body = {};
		} catch(e) {}

    	var log = {
    		status: type,
    		referenceId: status.referenceid,
    		date: new Date().toISOString(),
    		method: body['m'],
    		url: decodeURIComponent(request.url),
    		responseTime : request.timeTakenInMilliseconds,
    		headers: {},
    		request: null,
    		response: response.responseText,
    		description: request.description
		};

		if (request.headers) {
			request.headers.forEach(function(h) {
				log.headers[h.key] = h.value;
			});
		}

		if (request.prevHeaders) {
			request.prevHeaders.forEach(function(h) {
				log.headers[h.key] = h.value;
			});
		}

		if (log.method !== 'GET') {
	    	log.request = body['b'];
	    }

    	if (type == 'error') {
    		if (global.Appacitive.runtime.isBrowser) console.dir(log);

		    if (_type.isFunction(global.Appacitive.logs.apiErrorLog)) {
		    	invoke(global.Appacitive.logs.apiErrorLog, log);
		    }
	    }

	    if (_type.isFunction(global.Appacitive.logs.apiLog)) {
	    	invoke(global.Appacitive.logs.apiLog, log);
	    }
	};    

	global.Appacitive.logs.logException = function(error) {  
		if (_type.isFunction(global.Appacitive.logs.exceptionLog)) {
			invoke(global.Appacitive.logs.exceptionLog, error);
		}
	};

})(global);