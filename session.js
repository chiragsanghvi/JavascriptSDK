(function(global) {

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
			global.Appacitive.Session.create(_options);
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
					global.Appacitive.Session.useApiKey = false;
					global.Appacitive.eventManager.fire('session.success', {}, data);
					global.Appacitive.Session.onSessionCreated();
				}
				else {
					global.Appacitive.eventManager.fire('session.error', {}, data);
				}
			};
			global.Appacitive.http.send(_request);
		};

		global.Appacitive.http.addProcessor({
			pre: function(request) {
				if (global.Appacitive.Session.useApiKey) {
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

		this.removeUserAuthHeader = function(callback, avoidApiCall) {
			if (callback && typeof callback != 'function' && typeof callback == 'boolean') {
				avoidApiCall = callback;
				callback = function() {}; 
			}

			authEnabled = false;
			callback = callback || function() {};
			global.Appacitive.localStorage.remove('Appacitive-User');
			if (global.Appacitive.runtime.isBrowser) {
			 	global.Appacitive.Cookie.eraseCookie('Appacitive-UserToken');
			 	global.Appacitive.Cookie.eraseCookie('Appacitive-UserTokenExpiry');
			}
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

	global.Appacitive.Session = new SessionManager();

	global.Appacitive.initialize = function(options) {
		global.Appacitive.Session.setApiKey( options.apikey || '' ) ;
		global.Appacitive.Session.environment = ( options.env || '' );
		global.Appacitive.useApiKey = true;

		if (options.userToken) {

			if (options.expiry == -1)  options.expiry = null 
			else if (!options.expiry)  options.expiry = 3600;

			global.Appacitive.Session.setUserAuthHeader(options.userToken, options.expiry);

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
			req.headers.push({ key: 'appacitive-environment', value: global.Appacitive.Session.environment });
		}
	});

})(global);