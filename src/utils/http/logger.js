(function(global) {

    "use strict";

    global.Appacitive.logs = [];

    global.Appacitive.logs.errors = [];

    global.Appacitive.logs.exceptions = []; 

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

	var getLogs = function(log, method) {
		var logs = [];
		log.forEach(function(l) { if (l.method == method) logs.push(l); });
		return logs;
	};

	global.Appacitive.logs.getPutLogs = function() { return getLogs(this, 'PUT'); };

	global.Appacitive.logs.getGetLogs = function() { return getLogs(this, 'GET'); };

	global.Appacitive.logs.getPostLogs = function() { return getLogs(this, 'POST'); };

	global.Appacitive.logs.getDeleteLogs = function() { return getLogs(this, 'DELETE'); };

})(global);