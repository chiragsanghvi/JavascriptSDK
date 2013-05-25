/** workaround for __getter__ and __setter__ API's for IE
**/

try {
   if (!Object.prototype.__defineGetter__ && Object.defineProperty({},"x",{get: function(){return true}}).x) {
      Object.defineProperty(Object.prototype, "__defineGetter__",
         {
         	enumerable: false, 
         	configurable: true,
          	value: function(name,func)
             {Object.defineProperty(this,name,
                 {
                 	get:func,
                 	enumerable: true,
                 	configurable: true
                 });
      }});
      Object.defineProperty(Object.prototype, "__defineSetter__",
         {
         	enumerable: false, 
         	configurable: true,
          	value: function(name,func)
             {
             	Object.defineProperty(this,name,
                 {
                 	set:func,
                 	enumerable: true,
                 	configurable: true
                 });
      }});
   }
} catch(defPropException) {/*Do nothing if an exception occurs*/};
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
				error: function (e) {
					that.onError(request, e);
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
				error: function (e) {
					that.onError(request, e);
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
				error: function (e) {
					that.onError(request, e);
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
				error: function (e) {
					that.onError(request, e);
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
                        that.onError(options, res);
                    };
 
                });
            });
 
            x.write(o.data);
            x.on('error', function(e) {
                that.onError(options, e);
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
		this.onError = function (request, err) {
			if (request.onError) {
				if (request.context) {
					request.onError.apply(request.context, [err]);
				} else {
					request.onError(err);
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
				try {
					var _valid = global.Appacitive.session.isSessionValid(response);
					if (!_valid) {
						if (global.Appacitive.session.get() != null) {
							global.Appacitive.session.resetSession();
						}
						global.Appacitive.http.send(request);
					} else {
						if (response && ((response.status && response.status.code && response.status.code == '8036') || (response.code &&response.code == '8036'))) {
							global.Appacitive.session.removeUserAuthHeader(true);
						} else {
							global.Appacitive.session.incrementExpiry();
						}
					}
				} catch(e){}
			}
		});

	})(global);

	/* Http Utilities */

})();(function (global) {
    /**
     * @param {...string} var_args
     */
    String.format = function (text, var_args) {
        if (arguments.length <= 1) {
            return text;
        }
        var tokenCount = arguments.length - 2;
        for (var token = 0; token <= tokenCount; token++) {
            //iterate through the tokens and replace their placeholders from the original text in order
            text = text.replace(new RegExp("\\{" + token + "\\}", "gi"),
                                                arguments[token + 1]);
        }
        return text;
    };
    String.prototype.toPascalCase = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    String.prototype.trimChar = function (char1) {
        var pattern = new RegExp("^" + char1);
        var returnStr = this;
        if (pattern.test(returnStr)) returnStr = returnStr.slice(1, returnStr.length);
        pattern = new RegExp(char1 + "$");
        if (pattern.test(returnStr)) returnStr = returnStr.slice(0, -1);
        return returnStr;
    };
    String.toSearchString = function (text) {
        if (typeof (text) == 'undefined')
            text = '';

        var result = '';
        for (var x = 0; x < text.length; x = x + 1) {
            if (' .,;#'.indexOf(text[x]) == -1)
                result += text[x];
        }

        result = result.toLowerCase();

        return result;
    }

    String.contains = function (s1, s2) {
        return (s1.indexOf(s2) != -1);
    }

    String.startsWith = function (s1, s2) {
        return (s1.indexOf(s2) == 0);
    }

    global.dateFromWcf = function (input, throwOnInvalidInput) {
        var pattern = /Date\(([^)]+)\)/;
        var results = pattern.exec(input);
        if (results.length != 2) {
            if (!throwOnInvalidInput) {
                return s;
            }
            throw new Error(s + " is not .net json date.");
        }
        return new Date(parseFloat(results[1]));
    }

    /**
     * @constructor
     */
    var UrlFactory = function () {

        global.Appacitive.bag = global.Appacitive.bag || {};
        
        var baseUrl = (global.Appacitive.config || { apiBaseUrl: '' }).apiBaseUrl;
        
        this.email = {
            emailServiceUrl: 'email',
            
            getSendEmailUrl: function() {
                return String.format("{0}/send", this.emailServiceUrl)
            }
        };
        this.user = {

            userServiceUrl:  'user',

            getCreateUrl: function () {
                return String.format("{0}/create", this.userServiceUrl);
            },
            getAuthenticateUserUrl: function () {
                return String.format("{0}/authenticate", this.userServiceUrl);
            },
            getUserUrl: function (userId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getUpdateUrl: function (userId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getDeleteUrl: function (userId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getGetAllLinkedAccountsUrl: function(userId) {
                var url = String.format("{0}/{1}/linkedaccounts", this.userServiceUrl, userId);
                return url;
            },
            getValidateTokenUrl: function(token) {
                return String.format("{0}/validate?userToken={1}", this.userServiceUrl, token);
            },
            getInvalidateTokenUrl: function(token) {
                return String.format("{0}/invalidate?userToken={1}", this.userServiceUrl, token);
            }
        };
        this.device = {
            deviceServiceUrl: 'device',

            getCreateUrl: function () {
                return String.format("{0}/register", this.deviceServiceUrl);
            },
            getUpdateUrl: function (deviceId, deploymentId) {
                return String.format("{0}/{1}", this.deviceServiceUrl, deviceId);
            },
            getDeleteUrl: function (deviceId) {
                return String.format("{0}/{1}", this.deviceServiceUrl, deviceId);
            }
        };
        this.article = {
            articleServiceUrl: 'article',

            getSearchAllUrl: function (schemaName, queryParams, pageSize) {
                var url = '';

                url = String.format('{0}/search/{1}/all', this.articleServiceUrl, schemaName);

                if (pageSize)
                    url = url + '?psize=' + pageSize;
                else
                    url = url + '?psize=10';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        if (queryParams[i].trim().length == 0) continue;
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getProjectionQueryUrl: function() {
                return String.format('{0}/search/project', this.articleServiceUrl);
            },
            getPropertiesSearchUrl: function (schemaName, query) {
                var url = String.format('{0}/search/{1}/all', this.articleServiceUrl, schemaName);
                url += '?properties=' + query;

                return url;
            },
            getGetUrl: function (schemaName, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaName, articleId);
            },
            getMultiGetUrl: function (schemaName, articleIds) {
                return String.format('{0}/multiGet/{1}/{2}', this.articleServiceUrl, schemaName, articleIds);
            },
            getCreateUrl: function (schemaName) {
                return String.format('{0}/{1}', this.articleServiceUrl, schemaName);
            },
            getUpdateUrl: function (schemaName, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaName, articleId);
            },
            getDeleteUrl: function (schemaName, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaName, articleId);
            },
            getMultiDeleteUrl: function (schemaName) {
                return String.format('{0}/{1}/bulkdelete', this.articleServiceUrl, schemaName);
            }
        };
        this.connection = {

            connectionServiceUrl: 'connection',

            getGetUrl: function (relationName, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationName, connectionId);
            },
            getMultiGetUrl: function (schemaName, articleIds) {
                return String.format('{0}/multiGet/{1}/{2}', this.articleServiceUrl, schemaName, articleIds);
            },
            getCreateUrl: function (relationName) {
                return String.format('{0}/{1}', this.connectionServiceUrl, relationName);
            },
            getUpdateUrl: function (relationName, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationName, connectionId);
            },
            getDeleteUrl: function (relationName, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationName, connectionId);
            },
            getMultiDeleteUrl: function (relationName) {
                return String.format('{0}/{1}/bulkdelete', this.connectionServiceUrl, relationName);
            },
            getSearchByArticleUrl: function (relationName, articleId, label, queryParams) {
                var url = '';

                url = String.format('{0}/{1}/find/all?label={2}&articleid={3}', this.connectionServiceUrl, relationName, label, articleId);
                // url = url + '?psize=1000';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getConnectedArticles: function (relationName, articleId, queryParams) {
                var url = '';
                url = String.format('{0}/{1}/{2}/find', this.connectionServiceUrl, relationName, articleId);
                if (queryParams && queryParams.length && queryParams.length > 0) {
                    for (var x = 0; x < queryParams.length; x += 1) {
                        if (x == 0) {
                            url += '?' + queryParams[x];
                        } else {
                            url += '&' + queryParams[x];
                        }
                    }
                }
                return url;
            },
            getInterconnectsUrl: function () {
                var url = '';
                url = String.format('{0}/connectedarticles', this.connectionServiceUrl);
                return url;
            },
            getPropertiesSearchUrl: function (relationName, query) {
                var url = String.format('{0}/{1}/find/all', this.connectionServiceUrl, relationName);
                url += '?properties=' + query;

                return url;
            }
        };
        this.cannedList = {

            cannedListServiceUrl: 'list',

            getGetListItemsUrl: function (cannedListId) {
                return String.format('{0}/list/{1}/contents', this.cannedListServiceUrl, cannedListId);
            }
        };
        this.push = {
            
            pushServiceUrl: 'push',

            getPushUrl: function () {
                return String.format('{0}/', this.pushServiceUrl);
            },

            getGetNotificationUrl: function (notificationId) {
                return String.format('{0}/notification/{1}', this.pushServiceUrl, notificationId);
            },

            getGetAllNotificationsUrl: function (pagingInfo) {
                return String.format('{0}/getAll?psize={1}&pnum={2}', this.pushServiceUrl, pagingInfo.psize, pagingInfo.pnum);
            }
        };
        this.file = {

            fileServiceUrl: 'file',

            getUploadUrl: function (contentType) {
                return String.format('{0}/uploadurl?contenttype={1}&expires=20', this.fileServiceUrl, escape(contenttype));
            },

            getUploadUrl: function (contentType, fileId) {
                return String.format('{0}/updateurl/{1}?contenttype={2}&expires=20', this.fileServiceUrl, fileId, escape(contenttype));
            },

            getDownloadUrl: function (fileId, expiryTime) {
                return String.format('{0}/download/{1}?expires={2}', this.fileServiceUrl, fileId, expiryTime);
            },

            getDeleteUrl: function () {
                return String.format('{0}/delete/{1}', this.fileServiceUrl, fileId);
            }
        };
        this.query = {
            params: function (key) {
                var match = [];
                if (location.search == "" || location.search.indexOf("?") == -1) return match;
                if (!key) return location.search.split("?")[1].split("=");
                else {
                    key = key.toLowerCase();
                    var splitQuery = location.search.split("?")[1].split("&");
                    splitQuery.forEach(function (i, k) {
                        var splitKey = k.split("=");
                        var value = splitKey[1];
                        if (splitKey.length > 2) {
                            splitKey.forEach(function (ii, kk) {
                                if (ii == 0 || ii == 1) return;
                                value = value + "=" + splitKey[ii];
                            });
                        }
                        if (splitKey[0].toLowerCase() == key) match = [splitKey[0], value];
                    });
                    return match;
                }
            }
        };

    }

    global.Appacitive.storage = global.Appacitive.storage || {};
    global.Appacitive.storage.urlFactory = new UrlFactory();

})(global);/**
Depends on  NOTHING
**/

(function(global) {

    "use strict";

    /**
     * @constructor
    */

    var EventManager = function () {

        function GUID() {
            var S4 = function () {
                return Math.floor(
                    Math.random() * 0x10000 /* 65536 */
                ).toString(16);
            };

            return (
                S4() + S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + S4() + S4()
            );
        }

        var _subscriptions = {};

        this.subscribe = function (eventName, callback) {
            if (typeof (eventName) != "string" || typeof (callback) != "function")
                throw new Error("Incorrect subscription call");

            if (typeof (_subscriptions[eventName]) == "undefined")
                _subscriptions[eventName] = [];

            var _id = GUID();
            _subscriptions[eventName].push({
                callback: callback,
                id: _id
            });

            return _id;
        };

        this.unsubscribe = function (id) {
            if (!id) return false;
            var index = -1, eN = null;
            for (var eventName in _subscriptions) {
                for (var y = 0; y < _subscriptions[eventName].length; y = y + 1) {
                    if (_subscriptions[eventName][y].id == id) {
                        index = y;
                        eN = eventName;
                        break;
                    }
                }
            }
            if (index != -1) {
                _subscriptions[eN].splice(index, 1);
                return true;
            }
            return false;
        };

        this.fire = function (eventName, sender, args) {
            if (typeof (eventName) != "string") throw new Error("Incorrect fire call");

            if (typeof (args) == "undefined" || args === null)
                args = {};
            args.eventName = eventName;

            // shifted logging here
            // for better debugging
            if (console && console.log && typeof console.log == 'function')
                console.log(eventName + ' fired');

            if (typeof (_subscriptions["all"]) != "undefined") {
                for (var x = 0; x < _subscriptions["all"].length; x = x + 1) {
                    //try {
                    _subscriptions["all"][x].callback(sender, args);
                    //} catch (e) { }
                }
            }

            var _callback = function (f, s, a) {
                setTimeout(function () {
                    f(s, a);
                }, 0);
            };

            if (typeof (_subscriptions[eventName]) != "undefined") {
                for (var y= 0; y < _subscriptions[eventName].length; y = y + 1) {
                    _callback(_subscriptions[eventName][y].callback, sender, args);
                }
            }
        };

        this.clearSubscriptions = function (eventName) {
            if (typeof (eventName) != 'string')
                throw new Error('Event Name must be string in EventManager.clearSubscriptions');

            if (_subscriptions[eventName]) _subscriptions[eventName].length = 0;

            return this;
        };

        this.clearAndSubscribe = function (eventName, callback) {
            this.clearSubscriptions(eventName);
            this.subscribe(eventName, callback);
        };

        this.dump = function () {
            console.dir(_subscriptions);
        };

    };

    global.Appacitive.eventManager = new EventManager();

})(global);(function(global) {

	"use strict";

	global.Appacitive.config = {
		apiBaseUrl: 'https://apis.appacitive.com/'
	};

}(global));(function(global) {

	"use strict";

	/**
	 * @constructor
	 */
	var SessionManager = function() {

		/**
		 * @constructor
		 */
		var _sessionRequest = function() {
			this.apikey = '';
			this.isnonsliding = false;
			this.usagecount = -1;
			this.windowtime = 240;
		};

		var _sessionKey = null, _appName = null, _options = null, _apikey = null, _authToken = null, authEnabled = false;

		this.useApiKey = true ;

		this.onSessionCreated = function() {};

		this.recreate = function() {
			global.Appacitive.session.create(_options);
		};

		this.create = function(options) {
			
			options = options || {};
			_options = options;

			// track the application 
			_appName = options.app || '';

			// create the session
			var _sRequest = new _sessionRequest();

			if (options.apikey) {
				_sRequest.apikey = options.apikey || '';
				_apikey = _sRequest.apikey;
			} else {
				_sRequest.apikey = _apikey
			}
			

			_sRequest.isnonsliding = options.isnonsliding || _sRequest.isnonsliding;
			_sRequest.usagecount = options.usagecount || _sRequest.usagecount;
			_sRequest.windowtime = options.windowtime || _sRequest.windowtime;

			var _request = new global.Appacitive.HttpRequest();
			_request.url = global.Appacitive.config.apiBaseUrl + 'application.svc/session';
			_request.method = 'put';
			_request.data = _sRequest;
			_request.onSuccess = function(data) {
				if (data && data.status && data.status.code == '200') {
					_sessionKey = data.session.sessionkey;
					global.Appacitive.session.useApiKey = false;
					global.Appacitive.eventManager.fire('session.success', {}, data);
					global.Appacitive.session.onSessionCreated();
				}
				else {
					global.Appacitive.eventManager.fire('session.error', {}, data);
				}
			};
			global.Appacitive.http.send(_request);
		};

		global.Appacitive.http.addProcessor({
			pre: function(request) {
				if (global.Appacitive.session.useApiKey) {
					request.headers.push({ key: 'appacitive-apikey', value: _apikey });
				} else {
					request.headers.push({ key: 'appacitive-session', value: _sessionKey });
				}

				if (authEnabled === true) {
					var userAuthHeader = request.headers.filter(function (uah) {
						return uah.key == 'appacitive-user-auth';
					});
					if (userAuthHeader.length == 1) {
						request.headers.forEach(function (uah) {
							if (uah.key == 'appacitive-user-auth') {
								uah.value = _authToken;
							}
						});
					} else {
						request.headers.push({ key: 'appacitive-user-auth', value: _authToken });
					}
				}
			}
		});

		this.setUserAuthHeader = function(authToken, expiry, doNotSetCookie) {
			try {
				if (authToken) {
					authEnabled = true;
					_authToken = authToken;
					if (!doNotSetCookie) {
						if(!expiry) expiry = 60;
						if (expiry == -1) expiry = null;
						
						if (global.Appacitive.runtime.isBrowser) {
							global.Appacitive.Cookie.setCookie('Appacitive-UserToken', authToken, expiry);
							global.Appacitive.Cookie.setCookie('Appacitive-UserTokenExpiry', expiry ? expiry : -1, expiry);
						}
					}
				}
			} catch(e) {}
		};

		this.incrementExpiry = function() {
			try {
				if (global.Appacitive.runtime.isBrowser && authEnabled) {
					var expiry = global.Appacitive.Cookie.readCookie('Appacitive-UserTokenExpiry');
					
					if (!expiry) expiry = 60;
					if (expiry == -1) expiry = null;
					
					global.Appacitive.Cookie.setCookie('Appacitive-UserToken', _authToken, expiry);
					global.Appacitive.Cookie.setCookie('Appacitive-UserTokenExpiry', expiry ? expiry : -1, expiry);
				}
			} catch(e) {}
		};

		this.removeUserAuthHeader = function(callback, avoidApiCall) {
			if (callback && typeof callback != 'function' && typeof callback == 'boolean') {
				avoidApiCall = callback;
				callback = function() {}; 
			}

			authEnabled = false;
			callback = callback || function() {};
			global.Appacitive.localStorage.remove('Appacitive-User');
			if (global.Appacitive.runtime.isBrowser) global.Appacitive.Cookie.eraseCookie('Appacitive-UserToken');

			if (_authToken  && !avoidApiCall) {
				try {
					var _request = new global.Appacitive.HttpRequest();
					_request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.user.getInvalidateTokenUrl(_authToken);
					_authToken = null;
					_request.method = 'POST';
					_request.data = {};
					_request.onSuccess = function() {
						if (typeof(callback) == 'function')
							callback();
					};
					global.Appacitive.http.send(_request);
				} catch (e){}
			} else {
				_authToken = null;
				if (typeof(callback) == 'function')
					callback();
			}
		};

		this.isSessionValid = function(response) {
			if (!response) return true;
			if (response.status) {
				if (response.status.code) {
					if (response.status.code == '8027' || response.status.code == '8002') {
						return false;
					}
				}
			} else if (response.code) {
				if (response.code == '8027' || response.code == '8002') {
					return false;
				}
			}
			return true;
		};

		this.resetSession = function() {
			_sessionKey = null;
			this.useApiKey = true;
		};

		this.get = function() {
			return _sessionKey;
		};

		this.setSession = function(session) {
			if (session) {
				_sessionKey = session;
				this.useApiKey = false;
			}
		};

		this.setApiKey = function(apikey) {
			if (apikey) {
				_apikey = apikey;
				this.useApiKey = true;
			}
		}

		// the name of the environment, simple public property
		var _env = 'sandbox';
		this.__defineGetter__('environment', function() {
			return _env;
		});
		this.__defineSetter__('environment', function(value) {
			if (value != 'sandbox' && value != 'live')
				value = 'sandbox';
			_env = value;
		});
	};

	global.Appacitive.session = new SessionManager();

	global.Appacitive.initialize = function(options) {
		global.Appacitive.session.setApiKey( options.apikey || '' ) ;
		global.Appacitive.session.environment = ( options.env || '' );
		global.Appacitive.useApiKey = true;

		if (options.userToken) {

			if (options.expiry == -1)  options.expiry = null 
			else if (!options.expiry)  options.expiry = 3600;

			global.Appacitive.session.setUserAuthHeader(options.userToken, options.expiry);

			if (options.user) {
				global.Appacitive.localStorage.set('Appacitive-User', options.user);
				global.Appacitive.Users.setCurrentUser(options.user);	
			}

		} else {

			if (global.Appacitive.runtime.isBrowser) {
				//read usertoken from cookie and set it
				var token = global.Appacitive.Cookie.readCookie('Appacitive-UserToken');
				if (token) { 
					var expiry = global.Appacitive.Cookie.readCookie('Appacitive-UserTokenExpiry');
					if (!expiry) expiry = 60;
					
					//read usertoken from cookie and user from from localstorage and set it;
					var user = global.Appacitive.localStorage.get('Appacitive-User');	
					global.Appacitive.Users.setCurrentUser(user, token, expiry);
				}
			}
		}			
	};

} (global));


// compulsory http plugin
// attaches the appacitive environment headers
(function (global){

	if (!global.Appacitive) return;
	if (!global.Appacitive.http) return;

	global.Appacitive.http.addProcessor({
		pre: function(req) {
			req.headers.push({ key: 'appacitive-environment', value: global.Appacitive.session.environment });
		}
	});

})(global);(function(global) {

	"use strict";

	global.Appacitive.queries = {};

	// basic query for contains pagination
	/** 
	* @constructor
	**/
	var PageQuery = function(o) {
		var options = o || {};
		this.pageNumber = options.pageNumber || 1;
		this.pageSize = options.pageSize || 200;
	};
	PageQuery.prototype.toString = function() {
		return 'psize=' + this.pageSize + '&pnum=' + this.pageNumber;
	};

	// sort query
	/** 
	* @constructor
	**/
	var SortQuery = function(o) {
		o = o || {};
		this.orderBy = o.orderBy || '__UtcLastUpdatedDate';
		this.isAscending = typeof o.isAscending == 'undefined' ? false : o.isAscending;
	};
	SortQuery.prototype.toString = function() {
		return 'orderBy=' + this.orderBy + '&isAsc=' + this.isAscending;
	};

	// base query
	/** 
	* @constructor
	**/
	var BaseQuery = function(o) {
		var options = o || {};

		this.pageQuery = new PageQuery(o);
		this.sortQuery = new SortQuery(o);
		this.baseType = o.schema || o.relation;
		if (!this.baseType)
			throw new Error('schema or relation name is mandatory');
		this.type = (o.schema) ? 'article' : 'connection';

		this.extendOptions = function(changes) {
			for (var key in changes) {
				options[key] = changes[key];
			}
			this.pageQuery = new PageQuery(options);
			this.sortQuery = new SortQuery(options);
		};

        this.toUrl = function() {
			var finalUrl = global.Appacitive.config.apiBaseUrl +
				this.type + '.svc/' +
				this.baseType + '/find/all?' + this.pageQuery.toString() + '&' + this.sortQuery.toString();

			if (this.filter && this.filter.trim().length > 0) {
				finalUrl += '&query=' + this.filter;
			}

			if (this.freeText && this.freeText.trim().length > 0) {
                finalUrl += "&freetext=" + this.freeText + "&language=en";
            }

            if (this.fields && this.fields.trim().length > 0) {
            	finalUrl += "&fields=" + this.fields;
            }

			return finalUrl;
		};

		this.toString = function() {

			var finalUrl = this.pageQuery.toString() + '&' + this.sortQuery.toString();

			if (this.filter && this.filter.trim().length > 0) {
				finalUrl += '&query=' + this.filter;
			}

			if (this.freeText && this.freeText.trim().length > 0) {
                finalUrl += "&freetext=" + this.freeText + "&language=en";
            }

            if (this.fields && this.fields.trim().length > 0) {
            	finalUrl += "&fields=" + this.fields;
            }

			return finalUrl;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.BasicFilterQuery = function(options) {

		options = options || {};
		var inner = new BaseQuery(options);

		//Set setter for filter to set value from basequery
		this.__defineSetter__('filter', function(value) {
			 inner.filter = value;
		});

		//Set getter for freetext to retrieve value from basequery
		this.__defineGetter__('freeText', function() {
			return inner.freetext;
		});

		//Set setter for freetext to set value from basequery
		this.__defineSetter__('freeText', function(value) {
			if (typeof freeText == 'string')
				inner.freeText = value;
			else if (typeof freeText == 'object' && value.length)
				inner.freeText = value.join(',');
		});

		//Set getter for fields to retrieve value from basequery
		this.__defineGetter__('fields', function() {
			return inner.fields;
		});

		//Set setter for fields to set value from basequery
		this.__defineSetter__('fields', function(value) {
			if (typeof fields == 'string')
				inner.fields = value;
			else if (typeof fields == 'object' && value.length)
				inner.fields = value.join(',');
		});

		//set filters , freetext and fields
		this.filter = options.filter || '';
		this.freeText = options.freeText || '';
		this.fields = options.fields || '';

		// just append the filters/properties parameter to the query string
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = inner.toUrl();
            r.method = 'get';
			return r;
		}; 

		this.setFilter = function() {
			inner.filter = arguments[0];
		};

		this.setFreeText = function() {
            this.freeText = arguments[0];
        };

        this.setFields = function() {
        	this.fields = arguments[0];
        };

		this.extendOptions = function() {
			inner.extendOptions.apply(inner, arguments);
		};

		this.getOptions = function() {
			var o = {};
			for (var key in inner) {
				if (inner.hasOwnProperty(key) && typeof inner[key] != 'function') {
					o[key] = inner[key];
				}
			}
			return o;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.GraphQuery = function(options) {

		options = options || {};
		
		if (!options.graphQuery)
			throw new Error('graphQuery object is mandatory');

		// just append the filters/properties parameter to the query string
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = global.Appacitive.config.apiBaseUrl;
			r.url += global.Appacitive.storage.urlFactory.article.getProjectionQueryUrl();
			r.method = 'post';
			r.data = options.graphQuery;
			return r;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.ConnectedArticlesQuery = function(options) {

		options = options || {};
		var inner = new BaseQuery(options);

		//Set getter for filter to retrieve value from basequery
		this.__defineGetter__('filter', function() {
			return inner.filter;
		});

		//Set setter for filter to set value from basequery
		this.__defineSetter__('filter', function(value) {
			 inner.filter = value;
		});

		//Set getter for freetext to retrieve value from basequery
		this.__defineGetter__('freeText', function() {
			return inner.freetext;
		});

		//Set setter for freetext to set value from basequery
		this.__defineSetter__('freeText', function(value) {
			if (typeof freeText == 'string')
				inner.freeText = value;
			else if (typeof freeText == 'object' && value.length)
				inner.freeText = value.join(',');
		});

		//Set getter for fields to retrieve value from basequery
		this.__defineGetter__('fields', function() {
			return inner.fields;
		});

		//Set setter for fields to set value from basequery
		this.__defineSetter__('fields', function(value) {
			if (typeof fields == 'string')
				inner.fields = value;
			else if (typeof fields == 'object' && value.length)
				inner.fields = value.join(',');
		});

		//set filters , freetext and fields
		this.filter = options.filter || '';
		this.freeText = options.freeText || '';
		this.fields = options.fields || '';

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = global.Appacitive.config.apiBaseUrl + 'connection/' + options.relation + '/' + options.articleId + '/find?' +
				inner.toString();
			return r;
		};

		this.extendOptions = function() {
			inner.extendOptions.apply(inner, arguments);
		};
		
		this.setFilter = function() {
			inner.filter = arguments[0];
		};

		this.setFreeText = function() {
            this.freeText = arguments[0];
        };

        this.setFields = function() {
        	this.fields = arguments[0];
        };


		this.getOptions = function() {
			var o = {};
			for (var key in inner) {
				if (inner.hasOwnProperty(key) && typeof inner[key] != 'function') {
					o[key] = inner[key];
				}
			}
			return o;
		};
	};

})(global);(function(global) {

	"use strict";

	//base object for articles and connections
	/**
	* @constructor
	**/
	var _BaseObject = function(raw, setSnapShot) {

		var _snapshot = {};

		raw = raw || {};
		var article = raw;

		//will be used in case of 
		if (setSnapShot) {
			for (var property in article) {
				_snapshot[property] = article[property];
			}
		}
		if (!_snapshot.__id && raw.__id)
			_snapshot.__id = raw.__id;

		// crud operations
		// fetch ( by id )
		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			if (!article.__id) {
				onError();
				return;
			}
			// get this article by id
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl  + global.Appacitive.storage.urlFactory[this.type].getGetUrl(article.__schematype || article.__relationtype, article.__id);
			var getRequest = new global.Appacitive.HttpRequest();
			getRequest.url = url;
			getRequest.method = 'get';
			getRequest.onSuccess = function(data) {
				if (data && (data.article || data.connection || data.user || data.device)) {
					_snapshot = data.article || data.connection || data.user || data.device;
					var obj = data.article || data.connection || data.user || data.device;

					article.__id = obj.__id;
					for (var property in obj) {
						if (typeof article[property] == 'undefined') {
							article[property] = obj[property];
						}
					}
					if (that.___collection && ( that.___collection.collectionType == 'article'))
						that.___collection.addToCollection(that);
					onSuccess();
				} else {
					onError(data.status);
				}
			};
			global.Appacitive.http.send(getRequest);
		};

		// delete the article
		this.del = function(onSuccess, onError, options) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			options = options || {};

			// if the article does not have __id set, 
			// just remove it from the collection
			// else delete the article and remove from collection

			if (!article['__id'] && this.___collection) {
				this.___collection.removeByCId(this.__cid);
				onSuccess();
				return;
			}

			// delete this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl;
			url += global.Appacitive.storage.urlFactory[this.type].getDeleteUrl(article.__schematype || article.__relationtype, article.__id);

			// for User and Device articles
			if (article && article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) {
				url = global.Appacitive.config.apiBaseUrl;
				url += global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getDeleteUrl(article.__id);
			}

			// if deleteConnections is specified
			if (options.deleteConnections && options.deleteConnections === true) {
				if (url.indexOf('?') == -1) url += '?deleteconnections=true';
				else url += '&deleteconnections=true';
			}

			var _deleteRequest = new global.Appacitive.HttpRequest();
			_deleteRequest.url = url;
			_deleteRequest.method = 'delete';
			_deleteRequest.onSuccess = function(data) {
				if (data.code == '200') {
					if (that.___collection)
						that.___collection.removeById(article.__id);
					onSuccess();
				} else {
					onError(data);
				}
			};
			_deleteRequest.onError = function(err) {
				onError(err);
			}
			global.Appacitive.http.send(_deleteRequest);
		};

		this.getObject = function() { return article; };

		this.toJSON = function() { return article; };

		// accessor function for the article's attributes
		this.attributes = function() {
			if (arguments.length === 0) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes;
			} else if (arguments.length == 1) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes[arguments[0]];
			} else if (arguments.length == 2) {
				if(typeof(arguments[1]) !== 'string')
					throw new Error('only string values can be stored in attributes.');
				if (!article.__attributes) article.__attributes = {};
				article.__attributes[arguments[0]] = arguments[1];
			} else {
				throw new Error('.attributes() called with an incorrect number of arguments. 0, 1, 2 are supported.');
			}
		};

		// accessor function for the article's aggregates
		this.aggregates = function() {
			var aggregates = {};
			for (var key in article) {
				if (!article.hasOwnProperty(key)) return;
				if (key[0] == '$') {
					aggregates[key] = article[key];
				}
			}
			if (arguments.length === 0) {
				return aggregates;
			} else if (arguments.length == 1) {
				return aggregates[arguments[0]];
			} else {
				throw new Error('.aggregates() called with an incorrect number of arguments. 0, and 1 are supported.');
			}
		};

		this.get = function(key) {
			if (key) {
				return article[key];
			}
		};

		this.set = function(key, value) {
			if (key) {
				article[key] = value;
			}
			return value;
		};

		// save
		// if the object has an id, then it has been created -> update
		// else create
		this.save = function(onSuccess, onError) {
			if (article.__id)
				_update.apply(this, arguments);
			else
				_create.apply(this, arguments);
		};

		this.copy = function(properties) {
			for (var property in properties) {
				article[property] = properties[property];
			}
		};

		// to update the article
		var _update = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var isDirty = false;
			var fieldList = [];
			var changeSet = JSON.parse(JSON.stringify(_snapshot));
			for (var property in article) {
				if (typeof article[property] == 'undefined' || article[property] === null) {
					changeSet[property] = null;
					isDirty = true;
				} else if (article[property] != _snapshot[property]) {
					changeSet[property] = article[property];
					isDirty = true;
				} else if (article[property] == _snapshot[property]) {
					delete changeSet[property];
				}
				if (changeSet["__revision"]) delete changeSet["__revision"];
				if (changeSet["__endpointa"]) delete changeSet["__endpointa"];
				if (changeSet["__endpointb"]) delete changeSet["__endpointb"];
			}
			var that = this;
			
			if (isDirty) {
				var _updateRequest = new global.Appacitive.HttpRequest();
				var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getUpdateUrl(article.__schematype || article.__relationtype, (_snapshot.__id) ? _snapshot.__id : article.__id);
				
				// for User and Device articles
				if (article && article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) {
					url = global.Appacitive.config.apiBaseUrl;
					url += global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getUpdateUrl(_snapshot.__id);
				}

				_updateRequest.url = url;
				_updateRequest.method = 'post';
				_updateRequest.data = changeSet;
				_updateRequest.onSuccess = function(data) {
					if (data && (data.article || data.connection || data.user || data.device)) {
						_snapshot = data.article || data.connection || data.user || data.device;
						if (typeof onSuccess == 'function') {
							onSuccess(that);
						}
					} else {
						if (typeof onError == 'function') {
							onError(data.status);
						}
					}
				};
				_updateRequest.onError = function(err) {
					onError(err);
				}
				global.Appacitive.http.send(_updateRequest);
			} else {
				onSuccess();
			}
		};

		// to create the article
		var _create = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			// save this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getCreateUrl(article.__schematype || article.__relationtype);

			// for User and Device articles
			if (article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) {
				url = global.Appacitive.config.apiBaseUrl;
				url += global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getCreateUrl();
			}

			var _saveRequest = new global.Appacitive.HttpRequest();
			_saveRequest.url = url;
			_saveRequest.method = 'put';
			if (article["__revision"]) delete article["__revision"];
			_saveRequest.data = article;
			_saveRequest.onSuccess = function(data) {
				var savedState = null;
				if (data && (data.article || data.connection || data.user || data.device)) {
					savedState = data.article || data.connection || data.user || data.device;
				}
				if (data && savedState) {
					_snapshot = savedState;
					article.__id = savedState.__id;

					for (var property in savedState) {
						if (typeof article[property] == 'undefined') {
							article[property] = savedState[property];
						} else if (typeof savedState[property] == 'object')  {
							for (var p in savedState[property]) {
								article[property][p] = savedState[property][p];
							}
						}
					}

					// if this is an article and there are collections 
					// of connected articles, set the article Id in them
					if (that.connectionCollections && that.connectionCollections.length > 0) {
						that.connectionCollections.forEach(function (collection) {
							collection.getQuery().extendOptions({ articleId: article.__id });
						});
					}

					if (that.type == 'connection') {
						that.parseConnection();
					}

					if (typeof onSuccess == 'function') {
						onSuccess(that);
					}
				} else {
					if (typeof onError == 'function') {
						onError(data.status);
					}
				}
			};
			_saveRequest.onError = function(err) {
				onError(err);
			}
			global.Appacitive.http.send(_saveRequest);
		};

	};

	global.Appacitive.BaseObject = _BaseObject;

	global.Appacitive.BaseObject.prototype.toString = function() {
		return JSON.stringify(this.getObject());
	};

})(global);(function (global) {

	"use strict";

	var S4 = function () {
		return Math.floor(Math.random() * 0x10000).toString(16);
	};

	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	var _utf8_encode = function (string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	};

	var encodeToBase64 = function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		input = _utf8_encode(input);
		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
				_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
				_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
		}

		return output;
	};

	/**
	 * @constructor
	 **/
	global.Appacitive.GUID = function () {
		return encodeToBase64(
		S4() + S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + S4() + S4()).toString();
	};

})(global);(function(global) {

	"use strict";

	/** 
	* @constructor
	**/
	var _ArticleCollection = function(options) {

		var _schema = null;
		var _query = null;
		var _articles = [];
		var _options = options;

		this.collectionType = 'article';

		if (!options || !options.schema) {
			throw new Error('Must provide schema while initializing ArticleCollection.');
		}
		_schema = options.schema;
		
		var that = this;
		var _parseOptions = function(options) {
			options.type = 'article';

			if (options.schema)
				_schema = options.schema;
			else
				options.schema = _schema;

			_query = new global.Appacitive.queries.BasicFilterQuery(options);
			_options = options;
			that.extendOptions = _query.extendOptions;
		};

		this.setFilter = function(filterString) {
			_options.filter = filterString;
			_options.type = 'article';
			if (_query) {
				_query.filter = filterString;
			} else {
				_query = new global.Appacitive.queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
		};

        this.setFreeText = function(tokens) {
            if(!tokens && tokens.trim().length==0)
                _options.freeText = "";
            _options.freeText = tokens;
            _options.type = 'article';
            if (_query) {
				_query.freeText = tokens;
			} else {
				_query = new global.Appacitive.queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
        };

        this.setFields = function(fields) {
        	if (!fields)
                _options.fields = "";
            _options.fields = fields;
            _options.type = 'article';
            if (_query) {
				_query.fields = fields;
			} else {
				_query = new global.Appacitive.queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
        };

		this.reset = function() {
			_options = null;
			_schema = null;
			_articles.length = 0;
			_query = null;
		};

		this.__defineGetter__("query", function() {
			return _query;
		});

		this.getQuery = function() {
			return _query;
		};

		this.__defineSetter__("query", function(query) {
			if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to articleCollection');
			_articles.length = 0;
			_query = query;
		});

		this.setQuery = function(query) {
			if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to articleCollection');
			_articles.length = 0;
			_query = query;
		};

		this.setOptions = _parseOptions;
		
		_parseOptions(options);

		// getters
		this.get = function(index) {
			if (index != parseInt(index, 10)) return null;
			index = parseInt(index, 10);
			if (typeof index != 'number') return null;
			if (index >= _articles.length)  return null;
			return _articles.slice(index, index + 1)[0];
		};

		var fetchArticleById = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function() {};		
			onError = onError || function() {};
			if(!id || id.length == 0)
			
			var tempArticle = locs.createNewArticle({ __id : id});
    		tempArticle.fetch(function(data){},onError);
		};

		this.addToCollection = function(article) {
			if (!article || article.get('__schematype') != _schema)
				throw new Error('Null article passed or schema type mismatch');
			var index =  null;
			_articles.forEach(function(a, i) {
				if (a.get('__id') == article.get('__id')) {
					index = i;
				}
			});
			if (index !=+ null) {
				_articles.splice(index, 1);
			} else {
				_articles.push(article);
			}
		};

		this.getArticleById = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			var existingArticle = _articles.filter(function (article) {
				return article.get('__id') == id;
			});
			if (existingArticle.length == 1) {
				onSuccess(Array.prototype.slice.call(existingArticle)[0]);
			} else {
				onError();
			}
		};

		this.getAll = function() { return Array.prototype.slice.call(_articles); };

		this.getAllArticles = function() {
			return Array.prototype.slice.call(_articles).map(function (a) {
				return a.getArticle();
			});
		};

		this.removeById = function(id) {
			if (!id) return false;
			var index = null;
			_articles.forEach(function(article, i) {
				if (article.getArticle().__id && article.getArticle().__id == id) {
					index = i;
				}
			});
			if (index !== null) {
				_articles.splice(index, 1);
				return true;
			} else { return false; }
		};

		this.removeByCId = function(id) {
			if (!id) return false;
			var index = null;
			_articles.forEach(function(article, i) {
				if (article.__cid && article.__cid == id) {
					index = i;
				}
			});
			if (index !== null) {
				_articles.splice(index, 1);
				return true;
			} else { return false; }
		};

		var parseArticles = function (data, onSuccess, onError) {
			var articles = data.articles;
			if (!articles) {
				onError(data.status);
				return;
			}
			if (!articles.length || articles.length === 0) articles = [];
			articles.forEach(function (article) {
				var _a = new global.Appacitive.Article(article, true);
				_a.___collection = that;
				_articles.push(_a);
			});
			var pagingInfo = data.paginginfo || {};
			onSuccess(pagingInfo);
		};

		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			_articles.length = 0;
			var _queryRequest = _query.toRequest();
			_queryRequest.onSuccess = function(data) {
				parseArticles(data, onSuccess, onError);
			};
			global.Appacitive.http.send(_queryRequest);
		};

		this.fetchByPageNumber = function(onSuccess, onError, pageNumber) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber = pageNumber;
			this.fetch(onSuccess, onError);
		};

		this.fetchNextPage = function(onSuccess, onError) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber += 1;
			this.fetch(onSuccess, onError);
		};

		this.fetchPreviousPage = function(onSuccess, onError) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber -= 1;
			if (pInfo.pageNumber === 0) pInfo.pageNumber = 1;
			this.fetch(onSuccess, onError);
		};

		this.createNewArticle = function(values) {
			values = values || {};
			values.__schematype = _schema;
			var _a = new global.Appacitive.Article(values);
			_a.___collection = that;
			_a.__cid = parseInt(Math.random() * 1000000, 10);
			_articles.push(_a);
			return _a;
		};

		this.map = function() { return _articles.map.apply(this, arguments); };
		this.forEach = function() { return _articles.forEach.apply(this, arguments); };
		this.filter = function() { return _articles.filter.apply(this, arguments); };
	};

	global.Appacitive.ArticleCollection = _ArticleCollection;

	global.Appacitive.ArticleCollection.prototype.toString = function() {
		return JSON.stringify(this.getAllArticles());
	};

	global.Appacitive.ArticleCollection.prototype.toJSON = function() {
		return this.getAllArticles();
	};

	global.Appacitive.ArticleCollection.prototype.__defineGetter__('articles', function() {
		return this.getAll();
	});


})(global);(function(global) {

	"use strict";

	/** 
	* @constructor
	**/
	var _ConnectionCollection = function(options) {

		var _relation = null;
		var _schema = null;

		var _query = null;

		var _connections = [];
		var _articles = [];

		var _options = options;
		var connectionMap = {};

		this.collectionType = 'connection';

		if (!options || !options.relation) {
			throw new Error('Must provide relation while initializing ConnectionCollection.');
		}
		_relation = options.relation;

		var _parseOptions = function(options) {
			options.type = 'connection';

			if (options.relation)
				_relation = options.relation;
			else
				options.relation = _relation;

			_query = new global.Appacitive.queries.BasicFilterQuery(options);
			_options = options;
		};

		this.setFilter = function(filterString) {
			_options.filter = filterString;
			_options.type = 'connection';
			if (_query) {
				_query.filter = filterString;
			} else {
				_query = new global.Appacitive.queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
		};

		this.setFreeText = function(tokens) {
            if(!tokens && tokens.trim().length==0)
                _options.freeText = "";
            _options.freeText = tokens;
            _options.type = 'connection';
            if (_query) {
				_query.freeText = tokens;
			} else {
				_query = new global.Appacitive.queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
        };

        this.setFields = function(fields) {
        	if (!fields)
                _options.fields = "";
            _options.fields = fields;
            _options.type = 'connection';
            if (_query) {
				_query.fields = fields;
			} else {
				_query = new global.Appacitive.queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
        };

		this.__defineGetter__("query", function() {
			return _query;
		});

		this.getQuery = function() {
			return _query;
		};

		this.__defineSetter__("query", function(query) {
			if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to connectionCollection');
			_articles.length = 0;
			_connections.length = 0;
			_query = query;
		});

		this.setQuery = function(query) {
			if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to connectionCollection');
			_articles.length = 0;
			_connections.length = 0;
			_query = query;
		};

		this.reset = function() {
			_options = null;
			_relation = null;
			_articles.length = 0;
			_connections.length = 0;
			_query = null;
		};

		this.setOptions = _parseOptions;
		_parseOptions(options);

		// getters
		this.get = function(index) {
			if (index != parseInt(index, 10)) return null;
			index = parseInt(index, 10);
			if (typeof index != 'number') return null;
			if (index >= _connections.length)  return null;
			return _connections.slice(index, index + 1)[0];
		};

		this.addToCollection = function(connection) {
			if (!connection || connection.get('__relationtype') != _relation)
				throw new Error('Null connection passed or relation type mismatch');
			var index =  null;
			_connections.forEach(function(c, i) {
				if (c.get('__id') == connection.get('__id')) {
					index = i;
				}
			});
			if (index !== null) {
				_connections.splice(index, 1);
			} else {
				_connections.push(connection);
			}
		};

		this.getConnection = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			var existingConnection = _connections.filter(function (connection) {
				return connection.get('__id') == id;
			});
			if (existingConnection.length == 1) {
				onSuccess(Array.prototype.slice.call(existingConnection)[0]);
			} else {
				onError();
			}
		};

		this.getAll = function() { return Array.prototype.slice.call(_connections); };

		this.getAllConnections = function() {
			return Array.prototype.slice.call(_connections).map(function (c) {
				return c.getConnection();
			});
		};

		this.removeById = function(id) {
			if (!id) return false;
			var index = null;
			_connections.forEach(function(connection, i) {
				if (connection.getConnection().__id && connection.getConnection().__id == id) {
					index = i;
				}
			});
			if (index !== null) {
				_connections.splice(index, 1);
				return true;
			} else { return false; }
		};

		this.removeByCId = function(id) {
			if (!id) return false;
			var index = null;
			_connections.forEach(function(connection, i) {
				if (connection.__cid && connection.__cid == id) {
					index = i;
				}
			});
			if (index !== null) {
				_connections.splice(index, 1);
				return true;
			} else { return false; }
		};

		var that = this;
		var parseConnections = function (data, onSuccess, onError) {
			data = data || {};
			var connections = data.connections;
			if (!connections) {
				if (data.status && data.status.code && data.status.code == '200') {
					connections = [];
				} else {
					onError(data.status);
					return;
				}
			}
			if (!connections.length || connections.length === 0) connections = [];
			connections.forEach(function (connection) {
				var _c = new global.Appacitive.Connection(connection, true);
				_c.___collection = that;
				_connections.push(_c);

				// if this is a connected articles call...
				if (_c.endpointA.article || _c.endpointB.article) {
					var _a = _c.endpointA.article || _c.endpointB.article;
					_a.___collection = that;
					_articles.push(_a);
				}
			});

			var pagingInfo = data.paginginfo || {};
			onSuccess(pagingInfo);
		};

		this.getConnectedArticle = function(articleId) {
			if (!_articles || _articles.length === 0) return null;
			var article = _articles.filter(function(a) { return a.get('__id') == articleId; });
			if (article.length > 0) return article[0];
			return null;
		};

		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			_connections.length = 0;
			var _queryRequest = _query.toRequest();
			_queryRequest.onSuccess = function(data) {
				parseConnections(data, onSuccess, onError);
			};
			global.Appacitive.http.send(_queryRequest);
		};

		this.fetchByPageNumber = function(onSuccess, onError, pageNumber) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber = pageNumber;
			this.fetch(onSuccess, onError);
		};

		this.fetchNextPage = function(onSuccess, onError) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber += 1;
			this.fetch(onSuccess, onError);
		};

		this.fetchPreviousPage = function(onSuccess, onError) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber -= 1;
			if (pInfo.pageNumber === 0) pInfo.pageNumber = 1;
			this.fetch(onSuccess, onError);
		};


		this.createNewConnection = function(values) {
			values = values || {};
			values.__relationtype = _relation;
			var _a = new global.Appacitive.Connection(values);
			_a.___collection = that;
			_a.__cid = parseInt(Math.random() * 1000000, 10);
			_connections.push(_a);
			return _a;
		};

		this.map = function() { return _connections.map.apply(this, arguments); };

		this.forEach = function(delegate, context) {
			context = context || this;
			return _connections.forEach(delegate, context);
		};

		this.filter = function() { return _connections.filter.apply(this, arguments); };

	};

	global.Appacitive.ConnectionCollection = _ConnectionCollection;

})(global);(function (global) {

	"use strict";

	var _getFacebookProfile = function(onSuccess, onError) {
		onSuccess = onSuccess || function() {};
		onError = onError || function(){};
		
		var r = new global.Appacitive.HttpRequest();
		r.method = 'get';
		r.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(this.get('__id'));
		r.onSuccess = function(d) {
			var fbUsername = null;
			if (d && d.identities && d.identities.length > 0) {
				var fb = d.identities.filter(function(identity) {
					return identity.authtype.toLowerCase() == 'facebook';
				});
				if (fb.length == 1) {
					fbUsername = fb[0].username;
				}
			}
			if (fbUsername !== null) {
				FB.api('/' + fbUsername, function(response) {
					if (response) {
						onSuccess(response);
					} else {
						onError();
					}
				});
			} else {
				onError();
			}
		};
		r.onError = function() {
			onError();
		};
		global.Appacitive.http.send(r);
	};

	global.Appacitive.Article = function(options, setSnapShot) {
		if (!options.__schematype && !options.schema )
			throw new error("Cannot set article without __schematype");

		if (options.schema) {
			options.__schematype = options.schema;
			delete options.schema;
		}
		
		var base = new global.Appacitive.BaseObject(options, setSnapShot);
		base.type = 'article';
		base.connectionCollections = [];
		base.getArticle = base.getObject;

		if (base.get('__schematype') && base.get('__schematype').toLowerCase() == 'user') {
			base.getFacebookProfile = _getFacebookProfile;
		}

		return base;
	};

	global.Appacitive.BaseObject.prototype.getConnectedArticles = function(options) {
		if (this.type != 'article') return null;
		options = options || {};
		options.articleId = this.get('__id');

		var collection = new global.Appacitive.ConnectionCollection({ relation: options.relation });
		collection.connectedArticle = this;
		this.connectionCollections.push(collection);
		var connectedArticlesQuery = new global.Appacitive.queries.ConnectedArticlesQuery(options);
		collection.query = connectedArticlesQuery;

		return collection;
	};

	global.Appacitive.Article.multiDelete = function(schemaName, ids, onSuccess, onError) {
		if (!schemaName)
			throw new Error("Specify schemaName");

		if (schemaName.toLowerCase() == 'user' || schemaName.toLowerCase() == 'device')
			throw new Error("Cannot delete schema and devices using multidelete");

		if (ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.article.getMultiDeleteUrl(schemaName);
			request.method = 'post';
			request.data = { idlist : ids };
			request.onSuccess = function(d) {
				if (d && d.code == '200') {
					onSuccess();
				} else {
					d = d || {};
					onError(d || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				onError(d || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else onSuccess();
	};

	/*global.Appacitive.BaseObject.prototype.getConnected = function(options) {
		if (this.type != 'article') return null;
		options = options || {};
		options.onSuccess = options.onSuccess || function(){};
		options.onError = options.onError || function(){};
		options.articleId = this.get('__id');

	};*/

})(global);(function (global) {

	"use strict";

	var parseEndpoint = function(endpoint, type, base) {
		var result = {
			label: endpoint.label
		};

		if (endpoint.articleid) {
			// provided an article id
			result.articleid = endpoint.articleid;
		} 
		if (endpoint.article) {
			if (typeof endpoint.article.getArticle == 'function') {
				// provided an instance of Appacitive.ArticleCollection
				// stick the whole article if there is no __id
				// else just stick the __id
				if (endpoint.article.get('__id')) {
					result.articleid = endpoint.article.get('__id');
				} else {
					result.article = endpoint.article.getArticle();
				}
			} else if (typeof endpoint.article == 'object' && endpoint.article.__schematype) {
				// provided a raw article
				// if there is an __id, just add that
				// else add the entire article
				if (endpoint.article.__id) {
					result.articleid = endpoint.article.__id;
				} else {
					result.article = endpoint.article;
				}
				endpoint.article =  new Appacitive.Article(endpoint.article);
			} 
		} else {
			if (!result.articleid && !result.article)
				throw new Error('Incorrectly configured endpoints provided to setupConnection');
		}

		base["endpoint" + type] = endpoint;
		
		return result;
	};

	var convertEndpoint = function(endpoint, type, base) {

		if ( base.get('__endpoint' + type.toLowerCase()).article && typeof base.get('__endpoint' + type.toLowerCase()).article == 'object') {
			if (!base['endpoint' + type]) {
				base["endpoint" + type] = {};
				base['endpoint' + type].article = new global.Appacitive.Article(base.get('__endpoint' + type.toLowerCase()).article);
			} else {
				if (base['endpoint' + type] && base['endpoint' + type].article && base['endpoint' + type].article.getArticle)
					base["endpoint" + type].article.copy(base.get('__endpointb').article);
				else 
					base['endpoint' + type].article = new global.Appacitive.Article(base.get('__endpointb').article);
			}
			base["endpoint" + type].articleid = base.get('__endpoint' + type.toLowerCase()).articleid;
			base["endpoint" + type].label = base.get('__endpoint' + type.toLowerCase()).label;
			base["endpoint" + type].type = base.get('__endpoint' + type.toLowerCase()).type;

			base["endpoint" + type].article.___collection = base.___collection;
			delete base.get('__endpoint' + type.toLowerCase()).article
		} else {
			base["endpoint" + type] = base.get('__endpoint' + type.toLowerCase());
		}

	};

	global.Appacitive.Connection = function(options, doNotConvert) {

		if (!options.__relationtype && !options.relation )
			throw new error("Cannot set connection without relation");

		if (options.relation) {
			options.__relationtype = options.relation;
			delete options.relation;
		}

		if (options.endpoints && options.endpoints.length == 2) {
			options.__endpointa = options.endpoints[0];
			options.__endpointb = options.endpoints[1];
			delete options.endpoints;
		}

		var base = new global.Appacitive.BaseObject(options);
		base.type = 'connection';
		base.getConnection = base.getObject;

		// helper method for setting up the connection
		base.setupConnection = function(endpointA, endpointB) {
			// validate the endpoints
			if (!endpointA || (!endpointA.articleid &&  !endpointA.article) || !endpointA.label || !endpointB || (!endpointB.articleid && !endpointB.article) || !endpointB.label) {
				throw new Error('Incorrect endpoints configuration passed.');
			}

			// there are two ways to do this
			// either we are provided the article id
			// or a raw article
			// or an Appacitive.Article instance
			// sigh
			
			// 1
			base.set('__endpointa', parseEndpoint(endpointA, 'A', base));

			// 2
			base.set('__endpointb', parseEndpoint(endpointB, 'B', base));
		};


		base.parseConnection = function() {

			var typeA = 'A', typeB ='B';
			if ( options.__endpointa.label == this.get('__endpointb').label ) {
				if (options.__endpointa.articleid == this.get('__endpointb').articleid)
					typeA = 'B', typeB = 'A';
			}

			convertEndpoint(this.get('__endpointa'), typeA, base);
			convertEndpoint(this.get('__endpointb'), typeB, base);

			base.__defineGetter__('endpoints', function() {
				var endpoints = [];
				endpoints.push(this.endpointA);
				endpoints.push(this.endpointB);
				return endpoints;
			});

			return base;
		};

		if (doNotConvert) {

				base.__defineGetter__('connectedArticle', function() {
					if (!base.___collection.connectedArticle) {
						throw new Error('connectedArticle can be accessed only by using the getConnectedArticles call');
					}
					var articleId = base.___collection.connectedArticle.get('__id');
					if (!articleId) return null;
					var otherArticleId = base.getConnection().__endpointa.articleid;
					if (base.getConnection().__endpointa.articleid == articleId)
						otherArticleId = base.getConnection().__endpointb.articleid;
					return base.___collection.getConnectedArticle(otherArticleId);

				});

				base.parseConnection();

		} else {
			if (options.__endpointa && options.__endpointb)
				base.setupConnection(base.get('__endpointa'), base.get('__endpointb'));
		} 

		return base;
	};

	global.Appacitive.Connection.multiDelete = function(relationName, ids, onSuccess, onError) {
		if (!relationName)
			throw new Error("Specify relationName");

		if (ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.connection.getMultiDeleteUrl(relationName);
			request.method = 'post';
			request.data = { idlist : ids };
			request.onSuccess = function(d) {
				if (d && d.code == '200') {
					onSuccess();
				} else {
					d = d || {};
					onError(d || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				onError(d || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else onSuccess();
	};

})(global);(function (global) {

	"use strict";

	var UserManager = function() {

		var authenticatedUser = null;

		this.__defineGetter__('currentUser', function() {
			return authenticatedUser;
		});

		this.setCurrentUser = function(user, token, expiry) {

			global.Appacitive.localStorage.set('Appacitive-User', user);
			
			if (!expiry) expiry = 60;

			authenticatedUser = user;
			if (token)
				Appacitive.session.setUserAuthHeader(token, expiry);
		};
		
		global.Appacitive.User = function(options) {
			var base = new global.Appacitive.BaseObject(options);
			base.type = 'user';
			base.connectionCollections = [];

			if (base.get('__schematype') && base.get('__schematype').toLowerCase() == 'user') {
				base.getFacebookProfile = _getFacebookProfile;
			}

			return base;
		};

		this.deleteUser = function(userId, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.method = 'delete';
			request.url = global.Appacitive.config.apiBaseUrl;
			request.url += global.Appacitive.storage.urlFactory.user.getDeleteUrl(userId);
			request.onSuccess = function(data) {
				if (data && data.code && data.code == '200') {
					onSuccess(data);
				} else {
					data = data || {};
					data.message = data.message || 'Server error';
					onError(data);
				}
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		this.deleteCurrentUser = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (authenticatedUser === null) {
				throw new Error('Current user is not set yet for delete operation');
			}
			
			var currentUserId = authenticatedUser.__id;

			this.deleteUser(currentUserId, function(data) { 
				global.Appacitive.session.removeUserAuthHeader();
				onSuccess(data);
			}, onError);
		};

		this.createUser = function(user, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			user = user || {};
			user.__schematype = 'user';
			if (!user.username || !user.password || !user.firstname || user.username.length == 0 || user.password.length == 0 || user.firstname.length == 0) {
				throw new Error('Username, password and firstname are mandatory');
			}
			var request = new global.Appacitive.HttpRequest();
			request.method = 'put';
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getCreateUrl();
			request.data = user;
			request.onSuccess = function(data) {
				if (data && data.user) {
					onSuccess(data.user);
				} else {
					onError((data || {}).status || 'No response from APIs.');
				}
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		//method to allow user to signup and then login 
		this.signup = function(user, onSuccess, onError) {
			var that = this;
			this.createUser(user, function(data) {
				that.login(user.username, user.password, onSuccess, onError);
			}, function(status) {
				onError(status);
			});
		};

		//authenticate user with authrequest that contains username , password and expiry
		this.authenticateUser = function(authRequest, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!authRequest.expiry) authRequest.expiry = -1;
			var that = this;
			var request = new global.Appacitive.HttpRequest();
			request.method = 'post';
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
			request.data = authRequest;
			request.onSuccess = function(data) {
				if (data && data.user) {
					authenticatedUser = data.user;
					that.setCurrentUser(data.user, data.token, authRequest.expiry);
					onSuccess(data);
				} else {
					data = data || {};
					onError(data.status);
				}
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		//An overrride for user login with username and password directly
		this.login = function(username, password, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!username || !password || username.length ==0 || password.length == 0) 
				throw new Error('Please specify username and password');

			var authRequest = {
				username : username,
				password: password,
				expiry: -1
			};

			this.authenticateUser(authRequest, onSuccess, onError);
		};

		this.signupWithFacebook = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			var that = this;
			if (FB) {
				FB.api('/me', function(response) {
					var authRequest = {
						"accesstoken": global.Appacitive.facebook.accessToken,
						"type": "facebook",
						"expiry": 120,
						"attempts": -1,
						"createnew": true
					};
					var request = new global.Appacitive.HttpRequest();
					request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
					request.method = 'post';
					request.data = authRequest;
					request.onSuccess = function(a) {
						if (a.user) {
							a.user.__authType = 'FB';
							authenticatedUser = a.user;	
							that.setCurrentUser(a.user, a.token, 120);
							onSuccess(a);
						} else {
							onError(a);
						}
					};
					request.onError = function() {
						onError();
					};
					global.Appacitive.http.send(request);
				});
			} else
				onError();
		};

		this.authenticateWithFacebook = this.signupWithFacebook;

		this.validateCurrentUser = function(callback, avoidApiCall) {
			if (callback && typeof callback != 'function' && typeof callback == 'boolean') {
				avoidApiCall = callback;
				callback = function() {}; 
			}

			var token = global.Appacitive.Cookie.readCookie('Appacitive-UserToken');

			if (!token) {
				if (typeof(callback) == 'function')
					callback(false);
				return false;
			}

			if (!avoidApiCall) {
				try {
					var _request = new global.Appacitive.HttpRequest();
					_request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.user.getValidateTokenUrl(token);
					_request.method = 'POST';
					_request.data = {};
					_request.onSuccess = function(data) {
						if (typeof(callback) == 'function')
							callback(data.result);
					};
					global.Appacitive.http.send(_request);
				} catch (e) { callback(false);}
			} else {
				if (typeof(callback) == 'function')
					callback(true);
				return true;
			}
		};

		this.logout = function(callback) {
			callback = callback || function() {};
			if (!this.currentUser) { 
				callback();
				return;
			}

			global.Appacitive.session.removeUserAuthHeader(callback);
		};

	};

	global.Appacitive.Users = new UserManager();

})(global);(function(global) {

	"use strict";

	var _emailManager = function() {

		var config = {
			smtp: {
				username: null,
				password: null,
				host: "smtp.gmail.com",
				port: 465,
				enablessl: true
			},
			from: null,
			replyto: null
		}

		this.getConfig = function() {
			var _copy = config;
			return _copy;
		};

		var _sendEmail = function (email, onSuccess, onError) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.email.getSendEmailUrl();
			request.method = 'post';
			request.data = email;
			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.email);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};
			global.Appacitive.http.send(request);
		};

		this.setupEmail = function(options) {
			options = options || {};
			config.smtp.username = options.username || config.smtp.username;
			config.from = options.from || config.from;
			config.smtp.password = options.password || config.smtp.password;
			config.smtp.host = options.smtp.host || config.smtp.host;
			config.smtp.port = options.smtp.port || config.smtp.port;
			config.smtp.enablessl = options.enableSSL || config.smtp.enablessl;
			config.replyto = options.replyTo || config.replyto;
		};


		this.sendTemplatedEmail = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!options || !options.to || !options.to.length || options.to.length == 0) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject || options.subject.trim().length == 0) {
				throw new Error('Subject is mandatory to send an email');
			}

			if(!options.from && config.from) {
				throw new Error('from is mandatory to send an email. Set it in config or send it in options');
			} 

			if (!options.templateName) {
				throw new Error('template name is mandatory to send an email');
			}

			var email = {
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject,
				body: {
					templatename: options.templateName || '',
					data : options.data || {},
					ishtml: (options.isHtml == false) ? false : true
				}
			};

			if (options.useConfig) {
				email.smtp = config.smtp;
				if(!options.from && !config.from) {
					throw new Error('from is mandatory to send an email. Set it in config or send it in options');
				}
				email.from = options.from || config.from;
				email.replyto = options.replyTo || config.replyto;
			}

			_sendEmail(email, onSuccess, onError);
		};

		this.sendRawEmail = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!options || !options.to || !options.to.length || options.to.length == 0) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject || options.subject.trim().length == 0) {
				throw new Error('Subject is mandatory to send an email');
			}

			if (!options.body) {
				throw new Error('body is mandatory to send an email');
			} 

			var email = {
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject,
				body: {
					content: options.body || '',
					ishtml: (options.isHtml == false) ? false : true
				}
			};

			if (options.useConfig) {
				email.smtp = config.smtp;
				if(!options.from && !config.from) {
					throw new Error('from is mandatory to send an email. Set it in config or send it in options');
				}
				email.from = options.from || config.from;
				email.replyto = options.replyTo || config.replyto;
			}

			_sendEmail(email, onSuccess, onError);
		};

	};

	global.Appacitive.email = new _emailManager();

})(global);(function (global) {

	"use strict";

	var _browserFacebook = function() {

		var _accessToken = null;

		this.requestLogin = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			if (!FB) {
				onError();
				return;
			}
			FB.login(function(response) {
				if (response.authResponse) {
					var accessToken = response.authResponse.accessToken;
					_accessToken = accessToken;
					onSuccess(response.authResponse);
				} else {
					onError();
				}
			}, {scope:'email,user_birthday'});
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			FB.api('/me', function(response) {
				if (response) {
					onSuccess(response);
				} else {
					onError();
				}
			});
		};

		this.__defineGetter__('accessToken', function() {
			return _accessToken;
		});

		this.__defineSetter__('accessToken', function(val) {
			_accessToken = val;
		});

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};

		this.logout = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function(){};
			Appacitive.facebook.accessToken = "";
			try {
				FB.logout(function(response) {
					onSuccess();
				});
			} catch(e) {
				onError(e.message);
			}
		};
	};

	var _nodeFacebook = function() {

		var Facebook = require('facebook-node-sdk');

		var _accessToken = null;

		this.FB = null;

		var _app_id = null;

		var _app_secret = null;

		this.initialize = function (appId, appSecret) { 
			if (!appId) throw new Error("Please provide appid");
			if (!appSecret) throw new Error("Please provide app secret");
			
			_app_id = appId;
			_app_secret = appSecret;
		    this.FB = new Facebook({ appId: appId, secret: appSecret });
		}

		this.requestLogin = function(accessToken, onSuccess, onError) {
			if (this.FB) {
				_accessToken = accesstoken;
				FB.setAccessToken(accessToken);
			} else {
				onError ("Intialize facebook with your appid and appsecret");
			}
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			if(this.FB && _accessToken){
				onSuccess = onSuccess || function(){};
				onError = onError || function(){};
				this.FB.api('/me', function(err, response) {
					if (response) {
						onSuccess(response);
					} else {
						onError("Access token is invalid");
					}
				});
			} else{
				onError("Either intialize facebook with your appid and appsecret or set accesstoken");
			}
		};

		this.__defineGetter__('accessToken', function() {
			return _accessToken;
		});

		this.__defineSetter__('accessToken', function(val) {
			console.log(val);
			_accessToken = val;
			if(this.FB)
				this.FB.setAccessToken(val);
		});

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};
	}

	global.Appacitive.facebook = global.Appacitive.runtime.isBrowser ? new _browserFacebook() : new _nodeFacebook();

})(global);(function(global) {

	"use strict";

	var _pushManager = function() {

		this.send = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if(!options)
				throw new Error("Please specify push options");

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getPushUrl();

			request.method = 'post';
			request.data = options;

			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.id);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};

			request.onError = function(d){
				onError(d || "Server error");
			}

			global.Appacitive.http.send(request);
		};

		this.getNotification = function(notificationId, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if(!notificationId)
				throw new Error("Please specify notification id");

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getGetNotificationUrl(notificationId);

			request.method = 'get';

			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.pushnotification);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};

			request.onError = function(d){
				onError(d || "Server error");
			}

			global.Appacitive.http.send(request);
		};

		this.getAllNotifications = function(pagingInfo, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if(!pagingInfo)
				pagingInfo = { pnum: 1, psize: 20 };
			else {
				pagingInfo.pnum = pagingInfo.pnum || 1;
				pagingInfo.psize = pagingInfo.psize || 20;
			}

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getGetAllNotificationsUrl(pagingInfo);

			request.method = 'get';

			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.pushnotifications, d.paginginfo);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};

			request.onError = function(d){
				onError(d || "Server error");
			}

			global.Appacitive.http.send(request);
		};

	};

	global.Appacitive.push = new _pushManager();

})(global);(function(global) {
  
  global.Appacitive.parseISODate = function (str) {
    try{
      var date = new Date(str); 
      if (isNaN(date)) {
        var regexp = new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z$");
        if(!regexp.exec(str)) {
           return null;
        } else {
           var parts = str.split('T'),
           dateParts = parts[0].split('-'),
           timeParts = parts[1].split('Z'),
           timeSubParts = timeParts[0].split(':'),
           timeSecParts = timeSubParts[2].split('.'),
           timeHours = Number(timeSubParts[0]),
           date = new Date();

           date.setUTCFullYear(Number(dateParts[0]));
           date.setUTCMonth(Number(dateParts[1])-1);
           date.setUTCDate(Number(dateParts[2]));
           date.setUTCHours(Number(timeHours));
           date.setUTCMinutes(Number(timeSubParts[1]));
           date.setUTCSeconds(Number(timeSecParts[0]));
           if (timeSecParts[1]) date.setUTCMilliseconds(Number(timeSecParts[1]));

           return date;
        }
      } else {
        return date;
      }
    } catch(e) {return null;}
  }

  global.Appacitive.toISOString = function (date) {
    try {
      var date = date.toISOString();
      var i = date.indexOf('Z');
      date = replace('Z','0000Z');
      return date;
    } catch(e) { return null;}
  }

})(global);(function (global) {

	"use strict";

	var A_LocalStorage = function() {

		var _localStorage = window.localStorage || {};

		this.set = function(key, value) {
			value = value || '';
			if (!key) return false;

		    if (typeof value == "object") {
		    	try {
			      value = JSON.stringify(value);
			    } catch(e){}
		    }

			_localStorage[key] = value;
			return true;
		};

		this.get = function(key) {
			if (!key) return null;

			var value = _localStorage.getItem(key);
		   	if (!value) { return null; }

		    // assume it is an object that has been stringified
		    if (value[0] == "{") {
		    	try {
			      value = JSON.parse(value);
			    } catch(e){}
		    }

		    return value;
		};
		
		this.remove = function(key) {
			if (!key) return;
			try { delete _localStorage[key]; } catch(e){}
		}
	};

	global.Appacitive.localStorage = new A_LocalStorage();

})(global);(function (global) {

var cookieManager = function () {

	this.setCookie = function (name, value, minutes) {
		if (minutes) {
			var date = new Date();
			date.setTime(date.getTime() + (minutes*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name + "=" + value + expires + "; path=/";
	};

	this.readCookie = function (name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for (var i=0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	};

	this.eraseCookie = function (name) {
		this.setCookie(name, "" ,-1);
	};

};

if (global.Appacitive.runtime.isBrowser)
	global.Appacitive.Cookie = new cookieManager();

})(global);
if (typeof module != 'undefined') {
	module.exports = function(apikey) {
		global.Appacitive.initialize({apikey:apikey});
		return global.Appacitive;
	}
}