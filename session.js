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

		var _sessionKey = null;
		var _appName = null;
		var _options = null;
		var _apikey = null;

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
			}else {
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

		var _authToken = null, authEnabled = false;
		global.Appacitive.http.addProcessor({
			pre: function(request) {
				if (global.Appacitive.session.useApiKey) {
					request.headers.push({ key: 'appacitive-apikey', value: _apikey });
				} else{
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

		this.setUserAuthHeader = function(authToken, expiry) {
			if (authToken) {
				authEnabled = true;
				_authToken = authToken;
				if (global.Appacitive.runtime.isBrowser) global.Appacitive.Cookie.setCookie('Appacitive-UserToken', authToken, expiry);
			}
		};

		this.removeUserAuthHeader = function(callback) {
			authEnabled = false;
			callback = callback || function() {};
			if (_authToken) {
				try {
					var _request = new global.Appacitive.HttpRequest();
					_request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.user.getInvalidateTokenUrl(_authToken);
					_authToken = null;
					global.Appacitive.localStorage.remove('Appacitive-User');
					
					_request.method = 'POST';
					request.data = {};
					request.onSuccess = function() {
						if (typeof(callback) == 'function')
							callback();
					};
					global.Appacitive.http.send(request);
				} catch (e){}
			} else {
				if (typeof(callback) == 'function')
					callback();
			}
			if (global.Appacitive.runtime.isBrowser) global.Appacitive.Cookie.eraseCookie('Appacitive-UserToken');
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
		};

		this.get = function() {
			return _sessionKey;
		};

		this.setSession = function(session){
			_sessionKey = session;
		}

		this.setApiKey = function(apikey){
			_apikey = apikey;
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

		if (options.user) {
			global.Appacitive.localStorage.set('Appacitive-User', options.user);
			global.Appacitive.Users.setCurrentUser(options.user);	
		} else {
			if (global.Appacitive.runtime.isBrowser) {
				//read user from localstorage and set it
				var user = global.Appacitive.localStorage.get('Appacitive-User');	
				global.Appacitive.Users.setCurrentUser(user);
				
				//read usertoken from cookie and set it
				var token = global.Appacitive.Cookie.readCookie('Appacitive-UserToken');
				if (token) global.Appacitive.session.setUserAuthHeader(token, 60);
			}
		}			

		if (options.userToken) {
			global.Appacitive.session.setUserAuthHeader(options.userToken, 60);
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

})(global);