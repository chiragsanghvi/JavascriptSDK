(function (global) {

	"use strict";

	/**
	 * @constructor
	 */
	var SessionManager = function() {

		/**
		 * @constructor
		 */

		this.initialized = false;

		var _sessionRequest = function() {
			this.apikey = '';
			this.isnonsliding = false;
			this.usagecount = -1;
			this.windowtime = 240;
		};

		var _sessionKey = null, _appName = null, _options = null, _apikey = null, _authToken = null, authEnabled = false, _masterKey;

		this.useApiKey = true;

		this.useMasterKey = false;

		this.onSessionCreated = function() {};

		this.recreate = function(options) {
			return global.Appacitive.Session.create(options);
		};

		this.create = function(options) {

			if (!this.initialized) throw new Error("Intialize Appacitive SDK");

			// create the session
			var _sRequest = new _sessionRequest();

			_sRequest.apikey = _apikey;

			var request = new global.Appacitive._Request({
				method: 'PUT',
				type: 'application',
				op: 'getSessionCreateUrl',
				options: options,
				data: _sRequest,
				onSuccess: function(data) {
					_sessionKey = data.session.sessionkey;
					global.Appacitive.Session.useApiKey = false;
					request.promise.fulfill(data);
					global.Appacitive.Session.onSessionCreated();
				}
			});
			return request.send();
		};

		global.Appacitive.http.addProcessor({
			pre: function(request) {
				request.options = request.options || {};
				if (global.Appacitive.Session.useApiKey) {
					var key = _apikey;
					if ((request.options.useMasterKey || (global.Appacitive.useMasterKey && !request.options.useMasterKey )) && _type.isString(_masterKey) && _masterKey.length > 0) {
						key = _masterKey;
					} else if (_type.isString(request.options.apikey)) {
						key = request.options.apikey;
					}
					request.headers.push({ key: 'ak', value: key });
				} else {
					request.headers.push({ key: 'as', value: _sessionKey });
				}

				if (authEnabled === true) {
					var ind = -1;
					var userAuthHeader = request.headers.filter(function (uah, i) {
						if (uah.key == 'ut') {
							ind = i;
							return true;
						}
						return false;
					});

					if (request.options.ignoreUserToken) {
						if (ind != -1) request.headers.splice(ind, 1);
					} else {
						var token = _authToken;
						
						if (_type.isString(request.options.userToken) && request.options.userToken.length > 0)
							token = request.options.userToken;

						if (userAuthHeader.length == 1) {
							request.headers.forEach(function (uah) {
								if (uah.key == 'ut') {
									uah.value = token;
								}
							});
						} else {
							request.headers.push({ key: 'ut', value: token });
						}
					}
				}
			}
		});

		this.setUserAuthHeader = function(authToken, expiry, doNotSetInStorage) {
			try {
				if (authToken) {
					authEnabled = true;
					_authToken = authToken;
					if (!doNotSetInStorage) {
						if (!expiry) expiry = -1;
						if (expiry == -1) expiry = null;

						global.Appacitive.localStorage.set('Appacitive-UserToken', authToken);
						global.Appacitive.localStorage.set('Appacitive-UserTokenExpiry', expiry);
						global.Appacitive.localStorage.set('Appacitive-UserTokenDate', new Date().getTime());
					}
				}
			} catch(e) {}
		};

		this.incrementExpiry = function() {
			try {
				if (global.Appacitive.runtime.isBrowser && authEnabled) {
					global.Appacitive.localStorage.set('Appacitive-UserTokenDate', new Date().getTime());
				}
			} catch(e) {}
		};

		this.removeUserAuthHeader = function(makeApiCall, options) {

			var promise = global.Appacitive.Promise.buildPromise(options);

			if (!makeApiCall) {
				global.Appacitive.User.trigger('logout', {});
			}

			global.Appacitive.localStorage.remove('Appacitive-User');
		 	if (_authToken && makeApiCall) {
				try {

					var _request = new global.Appacitive.HttpRequest(options);
		            _request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getInvalidateTokenUrl(_authToken);
		            _request.method = 'POST';
		            _request.data = {};
		            _request.type = 'user';
		            _request.options = options;
		            _request.description = 'InvalidateToken user';
		            _request.onSuccess = _request.onError = function() {
		            	authEnabled = false;
		            	_authToken = null;
		            	global.Appacitive.localStorage.remove('Appacitive-UserToken');
		 				global.Appacitive.localStorage.remove('Appacitive-UserTokenExpiry');
		 				global.Appacitive.localStorage.remove('Appacitive-UserTokenDate');
						promise.fulfill();  
		            };

		 	        global.Appacitive.http.send(_request);

		 	        return promise;
				} catch (e){}
			} else {
				authEnabled = false;
				_authToken = null;
				global.Appacitive.localStorage.remove('Appacitive-UserToken');
 				global.Appacitive.localStorage.remove('Appacitive-UserTokenExpiry');
 				global.Appacitive.localStorage.remove('Appacitive-UserTokenDate');
				return promise.fulfill();
			}
		};

		this.isSessionValid = function(response) {
			if (response.status) {
				if (response.status.code) {
					if (response.status.code == '420' || response.status.code == '19027' || response.status.code == '19002') {
						return { status: false, isSession: (response.status.code == '19027' || response.status.code == '420') ? true : false };
					}
				}
			} else if (response.code) {
				if (response.code == '420' || response.code == '19027' || response.code == '19002') {
					return { status: false, isSession: (response.code == '19027' || response.code == '420') ? true : false };
				}
			}
			return { status: true };
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
		};

		this.setMasterKey = function(key) {
			_masterKey = key;
		};

		this.reset = function() {
			this.removeUserAuthHeader();
			_sessionKey = null, _appName = null, _options = null, _apikey = null, _authToken = null, authEnabled = false, _masterKey = null;
			this.initialized = false;
			this.useApiKey = false;
			this.useMasterKey = false;
		};

		// the name of the environment, simple public property
		var _env = 'sandbox';
		this.environment = function() {
			if (arguments.length == 1) {
				var value = arguments[0];
				if (value != 'sandbox' && value != 'live')	value = 'sandbox';
				_env = value;
			}
			return _env;
		};
	};

	global.Appacitive.Session = new SessionManager();

	global.Appacitive.getAppPrefix = function(str) {
		return global.Appacitive.Session.environment() + '/' + global.Appacitive.appId + '/' + str;
	};

	global.Appacitive.initialize = function(options) {
		
		options = options || {};

		if (global.Appacitive.Session.initialized) return;
		
		if (options.masterKey && options.masterKey.length > 0) global.Appacitive.Session.setMasterKey(options.masterKey);

		if (!options.apikey || options.apikey.length === 0) {
			if (_masterKey) options.apikey = _masterKey;
		    else throw new Error("apikey is mandatory");
		}

		if (!options.appId || options.appId.length === 0) throw new Error("appId is mandatory");

		
		global.Appacitive.Session.setApiKey( options.apikey);
		global.Appacitive.Session.environment(options.env || 'sandbox' );
		global.Appacitive.useApiKey = true;
		global.Appacitive.appId = options.appId;
  		
  		global.Appacitive.Session.initialized = true;
  		global.Appacitive.Session.persistUserToken = options.persistUserToken;
  		
		if (options.debug) global.Appacitive.config.debug = true;

		if (_type.isFunction(options.apiLog)) global.Appacitive.logs.apiLog = options.apiLog;
		if (_type.isFunction(options.apiErrorLog)) global.Appacitive.logs.apiErrorLog = options.apiErrorLog;
		if (_type.isFunction(options.exceptionLog)) global.Appacitive.logs.exceptionLog = options.exceptionLog;

  		if (options.userToken) {

			if (options.expiry == -1)  options.expiry = null;
			else if (!options.expiry)  options.expiry = 3600;

			global.Appacitive.Session.setUserAuthHeader(options.userToken, options.expiry);

			if (options.user) {
				global.Appacitive.Users.setCurrentUser(options.user);	
			} else {
				//read user from from localstorage and set it;
				var user = global.Appacitive.localStorage.get('Appacitive-User');	
				if (user) global.Appacitive.Users.setCurrentUser(user);
			}

		} else {

			if (global.Appacitive.runtime.isBrowser) {
				//read usertoken from localstorage and set it
				var token = global.Appacitive.localStorage.get('Appacitive-UserToken');
				if (token) { 
					var expiry = global.Appacitive.localStorage.get('Appacitive-UserTokenExpiry');
					var expiryDate = global.Appacitive.localStorage.get('Appacitive-UserTokenDate');
					
					if (!expiry) expiry = -1;
					if (expiryDate && expiry > 0) {
						if (new Date(expiryDate + (expiry * 1000)) < new Date()) return;
					}
					if (expiry == -1) expiry = null;
					//read usertoken and user from from localstorage and set it;
					var user = global.Appacitive.localStorage.get('Appacitive-User');	
					if (user) global.Appacitive.Users.setCurrentUser(user, token, expiry);
				}
			}
		}			
	};

	global.Appacitive.reset = function() {

	};

} (global));


// compulsory http plugin
// attaches the appacitive environment headers and other event plugins
(function (global){

	"use strict";

	if (!global.Appacitive) return;
	if (!global.Appacitive.http) return;

	global.Appacitive.http.addProcessor({
		pre: function(req) {
			req.headers.push({ key: 'e', value: global.Appacitive.Session.environment() });
		}
	});


   global.Appacitive.Events.mixin(global.Appacitive);

})(global);
