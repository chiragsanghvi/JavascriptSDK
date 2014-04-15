(function(global) {

    "use strict";

    global.Appacitive.logs = [];

    global.Appacitive.logs.exceptions = []; 

    global.Appacitive.logs.errors = []; 

    var quicklog = function(logs, pathName) {

    	if (logs.length > 25) {

			if (_type.isObject(global.Appacitive.log) && _type.isString(global.Appacitive.log[pathName])) {    	

				var domain = require('domain').create();

			    domain.run(function() {

			    	try {
				    	var log = '';

						logs.forEach(function(l) {
							log += JSON.stringify(l, undefined, 2) + '\n';
						});

						global.Appacitive.logs.length = 0;

						var logpath = global.Appacitive.log[pathName];
						var fs = require('fs');
						log = log.replace(/\r\n|\r/g, '\n'); // hack
						var fd = fs.openSync(logpath, 'a');
						var buf = new Buffer(log);
						fs.writeSync(fd, log);
						fs.closeSync(fd);
					} catch(e) {
						console.log(e);
					}
				});

			    domain.on("error", function() {
			    	domain.dispose();
			    });
			} else {
				logs.splice(0, 1);
			}
		}
	};

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
	    		url: decodeURIComponent(request.url),
	    		responseTime : request.timeTakenInMilliseconds,
	    		headers: {},
	    		request: null,
	    		response: response.responseText
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
	    		this.errors.push(log);
	    		quicklog(this.errors, 'errorPath');
		    }

		    this.push(log);

		    quicklog(this, 'logPath');
	    }
	};    

	var getLogs = function(log, method) {
		var logs = [];
		log.forEach(function(l) { if (l.method == method) logs.push(l); });
		return logs;
	};

	global.Appacitive.logs.getErrorLogs = function() {
		var logs = [];
		this.forEach(function(l) { if (l.type == 'error') logs.push(l); });
		return logs;
	};

	global.Appacitive.logs.logException = function(error) {  
		this.exceptions.push(error);
		quicklog(this.exceptions, 'exceptionPath');
	};

	global.Appacitive.logs.getPutLogs = function() { return getLogs(this, 'PUT'); };

	global.Appacitive.logs.getGetLogs = function() { return getLogs(this, 'GET'); };

	global.Appacitive.logs.getPostLogs = function() { return getLogs(this, 'POST'); };

	global.Appacitive.logs.getDeleteLogs = function() { return getLogs(this, 'DELETE'); };

})(global);