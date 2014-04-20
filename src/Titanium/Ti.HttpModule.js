// monolithic file

var global = {};

(function () {

	"use strict";

	// create the global object

	if (typeof window === 'undefined') {
		global = this;
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
		if (!httpTransport || !httpTransport.send || !_type.isFunction(httpTransport.send)) {
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


		this.changeRequestForCors = function(request) {
			var body = {
				m : request.method.toUpperCase()
			};
			request.headers.forEach(function(h) {
				body[h.key] = h.value;
			});
			request.headers = [];
			request.headers.push({ key:'Content-Type', value: 'text/plain' });
			request.method = 'POST';

			if (request.data) body.b = request.data;
			delete request.data;
			
			if (global.Appacitive.config.debug) {
				if (request.url.indexOf('?') === -1) request.url = request.url + '?debug=true';
				else request.url = request.url + '&debug=true';
			}

			try { request.data = JSON.stringify(body); } catch(e) {}
			return request;
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

				this.changeRequestForCors(toFire);

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
	var _HttpTransport = function () {
		var _notImplemented = function () {
			throw new Error('Not Implemented Exception');
		};
		var _notProvided = function () {
			throw new Error('Delegate not provided');
		};

		// implements this
		this.send = _notImplemented;
		this.inOnline = _notImplemented;

		// needs these callbacks to be set
		this.onResponse = function (response, request) {
			_notImplemented();
		};
		this.onError = function (request) {
			_notImplemented();
		};
	};

	// base xmlhttprequest class
	/**
	  * @constructor
	  */

	var _XMLHttp = function(request) {

		if (!request.url) throw new Error("Please specify request url");
		if (!request.method) request.method = 'GET' ;
		if (!request.headers) request.headers = [];
		var data = {};
		
		var promise = global.Appacitive.Promise.buildPromise({ success: request.onSuccess, error: request.onError });

		var doNotStringify = true;
		request.headers.forEach(function(r){
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
					try { data = JSON.stringify(data); } catch(e) {}
				}
			}
		}

	    if (global.navigator && (global.navigator.userAgent.indexOf('MSIE 8') != -1 || global.navigator.userAgent.indexOf('MSIE 9') != -1)) {
	    	request.data = data;
			var xdr = new _XDomainRequest(request);
			return xdr;
	    } else {
		    var xhr = Titanium.Network.createHTTPClient();
		    xhr.onreadystatechange = function() {
		    	if (this.readyState == 4) {
			    	if ((this.status >= 200 && this.status < 300) || this.status == 304) {
						var response = this.responseText;
						try {
							var contentType = this.getResponseHeader('content-type') || this.getResponseHeader('Content-Type');
							if (contentType.toLowerCase() == 'application/json' ||  contentType.toLowerCase() == 'application/javascript' || contentType.toLowerCase() == 'application/json; charset=utf-8' || contentType.toLowerCase() == 'application/json; charset=utf-8;') { 
								var jData = response;
								if (jData[0] != "{") {
									jData = jData.substr(1, jData.length - 1);
								}
								response = JSON.parse(jData);
							}
						} catch(e) {}
			            promise.fulfill(response, this);
			        } else {
			        	promise.reject(this);
			        }
		    	}
		    };
		    xhr.open(request.method, request.url, true);
		    for (var x = 0; x < request.headers.length; x += 1)
				xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);
			if (!global.Appacitive.runtime.isBrowser)
				xhr.setRequestHeader('User-Agent', 'Appacitive-NodeJSSDK'); 
		    xhr.send(data);
		    return xhr;
		}
	};


	// httpRequest class, encapsulates the request 
	// without bothering about how it is going to be fired.
	/**
	 * @constructor
	 */
	var HttpRequest = function (o) {
		o = o || {};
		this.url = o.url || '';
		this.data = o.data || {};
		this.headers = o.headers || [];
		this.method = o.method || 'GET';
		this.onSuccess = o.onSuccess || function(){};
		this.onError = o.onError || function(){};

		this.send = function(doNotStringify) {
			return new _XMLHttp(this, doNotStringify);
		};
	};

	// browser based http transport class
	/**
	 * @constructor
	 */
	var BasicHttpTransport = function () {

		var _super = new _HttpTransport();

		_super.isOnline = function () { return true; };

		var _executeCallbacks = function (response, callbacks, states) {
			if (callbacks.length != states.length) {
				throw new Error('Callback length and state length mismatch!');
			}
			for (var x = 0; x < callbacks.length; x += 1) {
				callbacks[x].apply({}, [response, states[x]]);
			}
		};

		var that = _super;

		var _trigger = function(request, callbacks, states) {
			new  _XMLHttp({
				method: request.method,
				url: request.url,
				headers: request.headers,
				data: request.data,
				onSuccess: function(data, xhr) {
					if (!data) {
					 	that.onError(request, { responseText: JSON.stringify({ code:'400', message: 'Invalid request' }) });
						return;
					}
					try { data = JSON.parse(data);} catch(e) {}
					// execute the callbacks first
					_executeCallbacks(data, callbacks, states);

					if ((data.code >= '200' && data.code <= '300') || (data.status && data.status.code >= '200' && data.status.code <= '300')) {
						that.onResponse(request, data);
					} else {
						data = data || {};
						data = data.status || data;
						data.message = data.message || 'Bad Request';
						data.code = data.code || '400';
						that.onError(request, { responseText: JSON.stringify(data) });
					}
				},
				onError: function(xhr) {
					var data = {};
					data.message = xhr.responseText || 'Bad Request';
					data.code = xhr.status || '400';
					
					that.onError(request, { responseText: JSON.stringify(data) });
				}
			});
		};

		_super.send = function (request, callbacks, states) {
			if (!global.Appacitive.Session.initialized) throw new Error("Initialize Appacitive SDK");
			if (_type.isFunction(request.beforeSend)) {
				request.beforeSend(request);
			}
			_trigger(request, callbacks, states);
		};

		return _super;
	};

	// http functionality provider
	/**
	 * @constructor
	 */
	var HttpProvider = function () {

		// actual http provider
		//var _inner = global.Appacitive.runtime.isBrowser ? new JQueryHttpTransport() : new NodeHttpTransport();
		var _inner = new BasicHttpTransport();

		// the http buffer
		var _buffer = new HttpBuffer(_inner);

		// used to pause/unpause the provider
		var _paused = false;

		// allow pausing/unpausing
		this.pause = function () {
			_paused = true;
		};

		this.unpause = function () {
			_paused = false;
		};

		// allow adding processors to the buffer
		this.addProcessor = function (processor) {
			var _processorError = new Error('Must provide a processor object with either a "pre" function or a "post" function.');
			if (!processor) throw _processorError;
			if (!processor.pre && !processor.post) throw _processorError;

			_buffer.addProcessor(processor);
		};

		// the method used to send the requests
		this.send = function (request) {
			
			request.promise = (global.Appacitive.Promise.is(request.promise)) ? request.promise : new global.Appacitive.Promise.buildPromise({ error: request.onError });

			_buffer.enqueueRequest(request);

			// notify the queue if the actual transport 
			// is ready to send the requests
			if (_inner.isOnline() && _paused === false) {
				_buffer.notify();
			}
			
			return request.promise;
		};

		// method used to clear the queue
		this.flush = function (force) {
			if (!force) {
				if (_inner.isOnline()) {
					_buffer.notify();
				}
			} else {
				_buffer.notify();
			}
		};

		// the error handler
		this.onError = function (request, response) {
			var error;
			if (response && response.responseText) {
			    try {
			        error = JSON.parse(response.responseText);
			    } catch (e) { }
			} else {
			    response = { responseText: '' };
			}

		    error = error || { code: response.status, message: response.responseText, referenceid: response.headers["TransactionId"] };
		    global.Appacitive.logs.logRequest(request, error, error, 'error');
		    request.promise.reject(error, request.entity);
		};
		_inner.onError = this.onError;

		// the success handler
		this.onResponse = function (request, response) {
			if (request.onSuccess) {
				if (request.context) {
					request.onSuccess.apply(request.context, [response]);
				} else {
					request.onSuccess(response);
				}
			}
		};
		_inner.onResponse = this.onResponse;
	};

	// create the http provider and the request
	global.Appacitive.http = new HttpProvider();
	global.Appacitive.HttpRequest = HttpRequest;

	/* PLUGIN: Http Utilities */

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
				try {
					var _valid = global.Appacitive.Session.isSessionValid(response);
					if (!_valid.status) {
						if (_valid.isSession) {
							if (global.Appacitive.Session.get() !== null) {
								global.Appacitive.Session.resetSession();
							}
							global.Appacitive.http.send(request);
						}
					} else {
						if (response && ((response.status && response.status.code && (response.status.code == '19036' || response.status.code == '421')) || (response.code && (response.code == '19036' || response.code == '421')))) {
							global.Appacitive.Users.logout(function(){}, true);
						} else {
							global.Appacitive.Session.incrementExpiry();
						}
					}
				} catch(e){}
			}
		});

		global.Appacitive.http.addProcessor({
			pre: function (req) {
				return new Date().getTime();
			},
			post: function (response, state) {
				var timeSpent = new Date().getTime() - state;
				response._timeTakenInMilliseconds = timeSpent;
			}
		});

	})(global);

	/* Http Utilities */

})();
