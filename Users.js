(function (global) {

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

})(global);