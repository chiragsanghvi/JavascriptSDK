(function (global) {

	"use strict";

	var UserManager = function() {

		var authenticatedUser = null;

		this.__defineGetter__('currentUser', function() {
			return authenticatedUser;
		});

		global.Appacitive.Users.setCurrentUser = function(user, token) {
			authenticatedUser = user;
			if (token)
				Appacitive.session.setUserAuthHeader(token);
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

		this.signup = function(user, onSuccess, onError) {
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

		this.createUser = this.signup;

		this.authenticateUser = function(authRequest, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.method = 'post';
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
			request.data = authRequest;
			request.onSuccess = function(data) {
				if (data && data.user) {
					authenticatedUser = data.user;
					global.Appacitive.session.setUserAuthHeader(data.token);
					global.Appacitive.localStorage.set('Appacitive-User', data.user);
					onSuccess(data);
				} else {
					data = data || {};
					onError(data.status);
				}
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		this.signupWithFacebook = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			FB.api('/me', function(response) {
				var authRequest = {
					"accesstoken": global.Appacitive.facebook.accessToken,
					"type": "facebook",
					"expiry": 60 * 60,
					"attempts": -1,
					"createnew": true
				};
				var request = new global.Appacitive.HttpRequest();
				request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
				request.method = 'post';
				request.data = authRequest;
				request.onSuccess = function(a) {
					if (a.user) {
						global.Appacitive.session.setUserAuthHeader(a.token);
						global.Appacitive.localStorage.set('Appacitive-User', a.user);
						authenticatedUser = a.user;
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
		};

		Appacitive.Users.currentUser.signout = function(callback) {
			callback = callback || function(){};
			global.Appacitive.session.removeUserAuthHeader(callback);
		}

		this.authenticateWithFacebook = this.signupWithFacebook;

	};

	global.Appacitive.Users = new UserManager();
})(global);