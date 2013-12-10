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

		var _sessionKey = null, _appName = null, _options = null, _apikey = null, _authToken = null, authEnabled = false;

		this.useApiKey = true ;

		this.onSessionCreated = function() {};

		this.recreate = function(callbacks) {
			return global.Appacitive.Session.create(callbacks);
		};

		this.create = function(callbacks) {

			if (!this.initialized) throw new Error("Intialize Appacitive SDK");

			// create the session
			var _sRequest = new _sessionRequest();

			_sRequest.apikey = _apikey;

			var request = new global.Appacitive._Request({
				method: 'PUT',
				type: 'application',
				op: 'getSessionCreateUrl',
				callbacks: callbacks,
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
				if (global.Appacitive.Session.useApiKey) {
					request.headers.push({ key: 'ak', value: _apikey });
				} else {
					request.headers.push({ key: 'as', value: _sessionKey });
				}

				if (authEnabled === true) {
					var userAuthHeader = request.headers.filter(function (uah) {
						return uah.key == 'ut';
					});
					if (userAuthHeader.length == 1) {
						request.headers.forEach(function (uah) {
							if (uah.key == 'ut') {
								uah.value = _authToken;
							}
						});
					} else {
						request.headers.push({ key: 'ut', value: _authToken });
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
						global.Appacitive.Cookie.setCookie('Appacitive-UserToken', authToken, expiry);
						global.Appacitive.Cookie.setCookie('Appacitive-UserTokenExpiry', expiry ? expiry : -1, expiry);
					}
				}
			} catch(e) {}
		};

		this.incrementExpiry = function() {
			return;
			/*try {
				if (global.Appacitive.runtime.isBrowser && authEnabled) {
					var expiry = global.Appacitive.Cookie.readCookie('Appacitive-UserTokenExpiry');
					
					if (!expiry) expiry = 60;
					if (expiry == -1) expiry = null;
					
					global.Appacitive.Cookie.setCookie('Appacitive-UserToken', _authToken, expiry);
					global.Appacitive.Cookie.setCookie('Appacitive-UserTokenExpiry', expiry ? expiry : -1, expiry);
				}
			} catch(e) {}*/
		};

		this.removeUserAuthHeader = function(makeApiCall) {
			
			global.Appacitive.localStorage.remove('Appacitive-User');
		 	if (_authToken && makeApiCall) {
				try {
					var promise = new global.Appacitive.Promise();

					var _request = new global.Appacitive.HttpRequest();
		            _request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getInvalidateTokenUrl(_authToken);
		            _request.method = 'POST';
		            _request.data = {};
		            _request.onSuccess = _request.onError = function() {
		            	authEnabled = false;
		            	_authToken = null;
		            	global.Appacitive.Cookie.eraseCookie('Appacitive-UserToken');
		 				global.Appacitive.Cookie.eraseCookie('Appacitive-UserTokenExpiry');
						promise.fulfill();  
		            };

		 	        global.Appacitive.http.send(_request);

		 	        return promise;
				} catch (e){}
			} else {
				authEnabled = false;
				_authToken = null;
				global.Appacitive.Cookie.eraseCookie('Appacitive-UserToken');
		 		global.Appacitive.Cookie.eraseCookie('Appacitive-UserTokenExpiry');
				return global.Appacitive.Promise().fulfill();
			}
		};

		this.isSessionValid = function(response) {
			if (!response) return true;
			if (response.status) {
				if (response.status.code) {
					if (response.status.code == '19027' || response.status.code == '19002') {
						return { status: false, isSession: (response.status.code == '19027') ? true : false };
					}
				}
			} else if (response.code) {
				if (response.code == '19027' || response.code == '19002') {
					return { status: false, isSession: (response.code == '19027') ? true : false };
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
		
		if (!options.apikey || options.apikey.length === 0) throw new Error("apikey is mandatory");
		
		if (!options.appId || options.appId.length === 0) throw new Error("appId is mandatory");


		global.Appacitive.Session.setApiKey( options.apikey) ;
		global.Appacitive.Session.environment(options.env || 'sandbox' );
		global.Appacitive.useApiKey = true;
		global.Appacitive.appId = options.appId;
  		
  		global.Appacitive.Session.initialized = true;
  		global.Appacitive.Session.persistUserToken = options.persistUserToken;
  		
		if (options.debug) global.Appacitive.config.debug = true;
		if (options.log) global.Appacitive.log = [];

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
				//read usertoken from cookie and set it
				var token = global.Appacitive.Cookie.readCookie('Appacitive-UserToken');
				if (token) { 
					var expiry = global.Appacitive.Cookie.readCookie('Appacitive-UserTokenExpiry');
					if (!expiry) expiry = 60;
					
					//read usertoken from cookie and user from from localstorage and set it;
					var user = global.Appacitive.localStorage.get('Appacitive-User');	
					if (user) global.Appacitive.Users.setCurrentUser(user, token, expiry);
				}
			}
		}			
	};

} (global));


// compulsory http plugin
// attaches the appacitive environment headers
(function (global){

	"use strict";

	if (!global.Appacitive) return;
	if (!global.Appacitive.http) return;

	global.Appacitive.http.addProcessor({
		pre: function(req) {
			req.headers.push({ key: 'e', value: global.Appacitive.Session.environment() });
		}
	});

})(global);
