(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;

    Appacitive.logs = {};

    var invoke = function(callback, log) {
    	setTimeout(function() {
	    	try { callback.call({}, log); } catch(e) {}
	    }, 0);
	};

	Appacitive.logs.logRequest = function(request, response, status, type) {
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
    		response: response,
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
    		if (Appacitive.runtime.isBrowser) console.dir(log);

		    if (_type.isFunction(Appacitive.logs.apiErrorLog)) {
		    	invoke(Appacitive.logs.apiErrorLog, log);
		    }
	    }

	    if (_type.isFunction(Appacitive.logs.apiLog)) {
	    	invoke(Appacitive.logs.apiLog, log);
	    }
	};    

	Appacitive.logs.logException = function(error) {  
		if (_type.isFunction(Appacitive.logs.exceptionLog)) {
			invoke(Appacitive.logs.exceptionLog, error);
		}
	};

})(global);