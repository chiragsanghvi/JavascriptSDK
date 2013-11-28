(function(global) {

    "use strict";

    global.Appacitive.logs = [];

    global.Appacitive.logs.errors = [];

	global.Appacitive.logs.logRequest = function(request, response, status, type) {
		if (global.Appacitive.log) {
			response = response || {};
			status = status || {};
			var body = JSON.parse(request.data);
	    	var log = {
	    		status: type,
	    		referenceId: status.referenceid,
	    		date: new Date().toISOString(),
	    		method: body['m'],
	    		url: request.url,
	    		responseTime : request.timeTakenInMilliseconds,
	    		headers: {},
	    		request: null,
	    		response: response
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
	    		console.dir(log);
	    		this.errors.push(log);
		    }
		    this.push(log);
	    }
	};    

})(global);