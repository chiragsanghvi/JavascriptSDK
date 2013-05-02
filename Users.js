(function (global) {

	"use strict";

	var UserManager = function() {

		var authenticatedUser = null;

		this.__defineGetter__('currentUser', function() {
			return authenticatedUser;
		});

		this.deleteCurrentUser = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (authenticatedUser === null) {
				throw new Error('Current user is not set yet');
			}
			var currentUserId = authenticatedUser.__id;
			this.deleteUser(currentUserId, onSuccess, onError);
		};

		this.deleteUser = function(userId, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.method = 'delete';
			request.url = global.Appacitive.config.apiBaseUrl;
			request.url += global.Appacitive.storage.urlFactory.user.getUserDeleteUrl(userId);
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

		this.createUser = function(fields, onSuccess, onError) {
			var users = new Appacitive.ArticleCollection({ schema: 'user' });
			var user = users.createNewArticle(fields);
			user.save(function() {
				onSuccess(user);
			}, onError);
		};

		this.createUser1 = function(user, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			user = user || {};
			user.__schematype = 'user';
			if (!user.username || !user.password) {
				throw new Error('Username and password are mandatory');
			}
			var request = new global.Appacitive.HttpRequest();
			request.method = 'put';
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getCreateUserUrl();
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
					"accesstoken": Appacitive.facebook.accessToken,
					"type": "facebook",
					"expiry": 60 * 60,
					"attempts": -1,
					"createnew": true
				};
				var request = new Appacitive.HttpRequest();
				request.url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
				request.method = 'post';
				request.data = authRequest;
				request.onSuccess = function(a) {
					if (a.user) {
						authenticatedUser = a.user;
						onSuccess(a);
					} else {
						onError(a);
					}
				};
				request.onError = function() {
					onError();
				};
				Appacitive.http.send(request);
			});
		};

		this.authenticateWithFacebook = this.signupWithFacebook;

	};

	global.Appacitive.Users = new UserManager();

})(global);