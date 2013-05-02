// monolithic file

var global = {};

(function () {

	"use strict";

	// create the global object

	if (typeof window == 'undefined') {
		global = process;
	} else {
		global = window;
	}

	var _initialize = function () {
		var t;
		if (!global.Appacitive) {
			global.Appacitive = {
				runtime: {
					isNode: typeof process != typeof t,
					isBrowser: typeof window != typeof t
				}
			};
		}
	};
	_initialize();

	// httpRequest class, encapsulates the request 
	// without bothering about how it is going to be fired.
	/**
	 * @constructor
	 */
	var HttpRequest = function () {
		this.url = '';
		this.data = {};
		this.async = true;
		this.headers = [];
		this.method = 'GET';
	};

	// httpBuffer class, stores a queue of the requests
	// and fires them. Global level pre and post processing 
	// goes here. 
	// requires httpTransport class that is able to actually 
	// send the request and receive the response
	/**
	 * @constructor
	 */
	var HttpBuffer = function (httpTransport) {

		// validate the httpTransport passed
		// and assign the callback
		if (!httpTransport || !httpTransport.send || typeof httpTransport.send != 'function') {
			throw new Error('No applicable httpTransport class found');
		} else {
			httpTransport.onResponse = this.onResponse;
		}

		// internal handle to the http requests
		var _queue = [];

		// handle to the list of pre-processing functions
		var _preProcessors = {}, _preCount = 0;

		// handle to the list of post-processing functions
		var _postProcessors = {}, _postCount = 0;

		// public method to add a processor
		this.addProcessor = function (processor) {
			if (!processor) return;
			processor.pre = processor.pre || function () {};
			processor.post = processor.post || function () {};

			addPreprocessor(processor.pre);
			addPostprocessor(processor.post);
		};

		// stores a preprocessor
		// returns a numeric id that can be used to remove this processor
		var addPreprocessor = function (preprocessor) {
			_preCount += 1;
			_preProcessors[_preCount] = preprocessor;
			return _preCount;
		};

		// removes a preprocessor
		// returns true if it exists and has been removed successfully
		// else false
		var removePreprocessor = function (id) {
			if (_preProcessors[id]) {
				delete(_preProcessors[id]);
				return true;
			} else {
				return false;
			}
		};

		// stores a postprocessor
		// returns a numeric id that can be used to remove this processor
		var addPostprocessor = function (postprocessor) {
			_postCount += 1;
			_postProcessors[_postCount] = postprocessor;
			return _postCount;
		};

		// removes a postprocessor
		// returns true if it exists and has been removed successfully
		// else false
		var removePostprocessor = function (id) {
			if (_postProcessors[id]) {
				delete(_postProcessors[id]);
				return true;
			} else {
				return false;
			}
		};

		// enqueues a request in the queue
		// returns true is succesfully added
		this.enqueueRequest = function (request) {
			_queue.push(request);
		};

		// notifies the queue that there are requests pending
		// this will start firing the requests via the method 
		// passed while initalizing
		this.notify = function () {
			if (_queue.length === 0) return;

			// for convienience, extract the postprocessing object into an array
			var _callbacks = [];
			for (var processor in _postProcessors) {
				if (_postProcessors.hasOwnProperty(processor)) {
					_callbacks.push(_postProcessors[processor]);
				}
			}

			while (_queue.length > 0) {
				var toFire = _queue.shift();

				// execute the preprocessors
				// if they return anything, pass it along
				// to be able to access it in the post processing callbacks
				var _state = [];
				for (var processor in _preProcessors) {
					if (_preProcessors.hasOwnProperty(processor)) {
						_state.push(_preProcessors[processor](toFire));
					}
				}

				// send the requests
				// and the callbacks and the 
				// results returned from the preprocessors
				httpTransport.send(toFire, _callbacks, _state);
			}
		};

		// callback to be invoked when a request has completed
		this.onResponse = function (responseData) {
			console.dir(responseData);
		};

	};


	// base httpTransport class
	/**
	 * @constructor
	 */
	var HttpTransport = function () {
		var _notImplemented = function () {
			throw new Error('Not Implemented Exception');
		}
		var _notProvided = function () {
			throw new Error('Delegate not provided');
		}

		// implements this
		this.send = _notImplemented;
		this.inOnline = _notImplemented;

		// needs these callbacks to be set
		this.onResponse = function (response, request) {
			_notImplemented()
		};
		this.onError = function (request) {
			_notImplemented()
		};
	}

	// jquery based http transport class
	/**
	 * @constructor
	 */
	var JQueryHttpTransport = function () {

		var _super = new HttpTransport();

		_super.type = 'jQuery based http provider';

		_super.send = function (request, callbacks, states) {
			if (typeof request.beforeSend == 'function') {
				request.beforeSend(request);
			}

			switch (request.method.toLowerCase()) {
				case 'get':
					_get(request, callbacks, states);
					break;
				case 'post':
					_post(request, callbacks, states);
					break;
				case 'put':
					_put(request, callbacks, states);
					break;
				case 'delete':
					_delete(request, callbacks, states);
					break;
				default:
					throw new Error('Unrecognized http method: ' + request.method);
			}
		};

		_super.isOnline = function () {
			return window.navigator.onLine || true;
		};

		var _executeCallbacks = function (response, callbacks, states) {
			if (callbacks.length != states.length) {
				throw new Error('Callback length and state length mismatch!');
			}

			for (var x = 0; x < callbacks.length; x += 1) {
				callbacks[x].apply({}, [response, states[x]]);
			}
		};

		var that = _super;

		$ = $ || {};
		$.ajax = $.ajax || {};

		var _get = function (request, callbacks, states) {
			$.ajax({
				url: request.url,
				type: 'GET',
				async: request.async,
				beforeSend: function (xhr) {
					for (var x = 0; x < request.headers.length; x += 1) {
						xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);
					}
				},
				success: function (data) {
					// Hack to make things work in FF
					try {
						data = JSON.parse(data);
					} catch (e) {}

					// execute the callbacks first
					_executeCallbacks(data, callbacks, states);

					that.onResponse(data, request);
				},
				error: function () {
					that.onError(request);
				}
			});
		};

		var _post = function (request, callbacks, states) {
			$.ajax({
				url: request.url,
				type: 'POST',
				async: request.async,
				contentType: "application/json",
				data: JSON.stringify(request.data),
				beforeSend: function (xhr) {
					for (var x = 0; x < request.headers.length; x += 1) {
						xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);
					}
				},
				success: function (data) {
					// Hack to make things work in FF
					try {
						data = JSON.parse(data);
					} catch (e) {}

					// execute the callbacks first
					_executeCallbacks(data, callbacks, states);

					that.onResponse(data, request);
				},
				error: function () {
					that.onError(request);
				}
			});
		};

		var _put = function (request, callbacks, states) {
			$.ajax({
				url: request.url,
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(request.data),
				async: request.async,
				beforeSend: function (xhr) {
					for (var x = 0; x < request.headers.length; x += 1) {
						xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);
					}
				},
				success: function (data) {
					// Hack to make things work in FF
					try {
						data = JSON.parse(data);
					} catch (e) {}

					// execute the callbacks first
					_executeCallbacks(data, callbacks, states);

					that.onResponse(data, request);
				},
				error: function () {
					that.onError(request);
				}
			});
		};

		var _delete = function (request, callbacks, states) {
			$.ajax({
				url: request.url,
				type: 'DELETE',
				async: request.async,
				beforeSend: function (xhr) {
					for (var x = 0; x < request.headers.length; x += 1) {
						xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);
					}
				},
				success: function (data) {
					// Hack to make things work in FF
					try {
						data = JSON.parse(data);
					} catch (e) {}

					// execute the callbacks first
					_executeCallbacks(data, callbacks, states);

					that.onResponse(data, request);
				},
				error: function () {
					that.onError(request);
				}
			});
		};

		return _super;
	};

	var NodeHttpTransport = function () {

		var _super = new HttpTransport();

		_super.type = 'Http provider for nodejs';

		_super.send = function (request, callbacks, states) {
			if (typeof request.beforeSend == 'function') {
				request.beforeSend(request);
			}

			sendHttp(request, callbacks, states);
		};

		_super.isOnline = function () {
			return true;
		};

		var _executeCallbacks = function (response, callbacks, states) {
			if (callbacks.length != states.length) {
				throw new Error('Callback length and state length mismatch!');
			}

			for (var x = 0; x < callbacks.length; x += 1) {
				callbacks[x].apply({}, [response, states[x]]);
			}
		};

		var that = _super;

		var o = {
		    host: 'localhost',
		    port: 80,
		    path: '',
		    data: "{}",
		    method: 'GET',
		    headers: {
		        'Content-Type': 'application/json',
		        'accept': 'application/json'
        	}
    	};

		var http = require('http');
 
        var sendHttp = function(options, callbacks, states) {
            
            var reqUrl = require('url').parse(options.url);
 
            options = options || {};
            for (var key in options) {
                if (key == 'headers') {
 
                    for(var i = 0 ; i < options.headers.length; i = i + 1) {
                        o.headers[options.headers[i].key] = options.headers[i].value;
                         }
                } else {
                    o[key] = options[key];
                }
            }
            o.host = reqUrl.host;
            o.port = reqUrl.port || 80;
            o.path = reqUrl.path;
            o.method = options.method.toUpperCase();
            
            if (typeof o.data != 'string') o.data = JSON.stringify(o.data);
            o.headers['Content-Length'] = o.data.length;
            o.headers['Content-Type'] = 'application/json';
            
            var x = http.request(o, function (res) {
                
                var receivedData = '';
 
                res.setEncoding('utf8');
 
                res.on('data', function (data) {
                    receivedData += data;
                });
 
                res.on('end', function() {
 
                    if(res.headers["content-type"] == "application/json" && res.statusCode == "200" ){
                
                        if (receivedData[0] != "{") receivedData = receivedData.substr(1, receivedData.length - 1);
                        
                        res.json = JSON.parse(receivedData);
 
                        // execute the callbacks first
                        _executeCallbacks(res.json, callbacks, states);
 
                        that.onResponse(res.json, options);
                    } else {
                        res.text = receivedData;
                        that.onError(options,res);
                    };
 
                });
            });
 
            x.write(o.data);
            x.on('error',function(e){
                res.text = receivedData;
                that.onError(options,res);
            });
            x.end();
        };

		return _super;
	};

	// http functionality provider
	/**
	 * @constructor
	 */
	var HttpProvider = function () {

		// actual http provider
		var _inner = global.Appacitive.runtime.isBrowser ? new JQueryHttpTransport() : new NodeHttpTransport();

		// the http buffer
		var _buffer = new HttpBuffer(_inner);

		// used to pause/unpause the provider
		var _paused = false;

		// allow pausing/unpausing
		this.pause = function () {
			_paused = true;
		}
		this.unpause = function () {
			_paused = false;
		}

		// allow adding processors to the buffer
		this.addProcessor = function (processor) {
			var _processorError = new Error('Must provide a processor object with either a "pre" function or a "post" function.');
			if (!processor) throw _processorError;
			if (!processor.pre && !processor.post) throw _processorError;

			_buffer.addProcessor(processor);
		}

		// the method used to send the requests
		this.send = function (request) {
			_buffer.enqueueRequest(request);

			// notify the queue if the actual transport 
			// is ready to send the requests
			if (_inner.isOnline() && _paused == false) {
				_buffer.notify();
			}
		}

		// method used to clear the queue
		this.flush = function (force) {
			if (!force) {
				if (_inner.isOnline()) {
					_buffer.notify();
				}
			} else {
				_buffer.notify();
			}
		}

		// the error handler
		this.onError = function (request) {
			if (request.onError) {
				if (request.context) {
					request.onError.apply(request.context, []);
				} else {
					request.onError();
				}
			}
		}
		_inner.onError = this.onError;

		// the success handler
		this.onResponse = function (response, request) {
			if (request.onSuccess) {
				if (request.context) {
					request.onSuccess.apply(request.context, [response]);
				} else {
					request.onSuccess(response);
				}
			}
		}
		_inner.onResponse = this.onResponse;
	}

	// create the http provider and the request
	global.Appacitive.http = new HttpProvider();
	global.Appacitive.HttpRequest = HttpRequest;

	/* PLUGIN: Http Utilities */

	// optional plugin
	(function (global) {

		if (!global.Appacitive) return;
		if (!global.Appacitive.http) return;

		global.Appacitive.http.addProcessor({
			pre: function (req) {
				return new Date().getTime()
			},
			post: function (response, state) {
				var timeSpent = new Date().getTime() - state;
				response._timeTakenInMilliseconds = timeSpent;
			}
		});

	})(global);

	// compulsory plugin
	// handles session and shits
	(function (global) {

		if (!global.Appacitive) return;
		if (!global.Appacitive.http) return;

		global.Appacitive.http.addProcessor({
			pre: function (request) {
				return request;
			},
			post: function (response, request) {
				if(false) {
					var _valid = global.Appacitive.session.isSessionValid(response);
					if (!_valid) {
						if (global.Appacitive.session.get() != null) {
							global.Appacitive.session.resetSession();
							global.Appacitive.session.onSessionCreated = function () {
								global.Appacitive.http.unpause();
								global.Appacitive.http.flush();
								global.Appacitive.session.onSessionCreated = function () {};
							}
							global.Appacitive.session.recreate();
							global.Appacitive.http.pause();
						}
						global.Appacitive.http.send(request);
					}
				}
			}
		});

	})(global);

	/* Http Utilities */

})();

////// unit test
var t = 0;
while (t-- > 0) {
	var req1 = new Appacitive.HttpRequest();
	req1.url = 'https://apis.appacitive.com/sessionservice.svc/getGraph?rawData=true&from=-1hours&target=stats.pgossamer.account{0}.application1918338163933441.deployment10938369762787624.success';
	req1.method = 'get';
	req1.headers = [{
		key: 'appacitive-session',
		value: 'BxqkdySwptR0C5iaJfWXd2+6bkWYtEmMYuPC77odDXE='
	}, {
		key: 'appacitive-environment',
		value: 'sandbox'
	}];
	req1.onSuccess = function (response) {
		console.dir(response);
	}
	req1.onError = function () {
		console.log('error occured');
	}
	Appacitive.http.send(req1);
}