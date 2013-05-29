(function (global) {

	"use strict";

	var UserManager = function() {

		var _authenticatedUser = null;

		this.__defineGetter__('currentUser', function() {
			return _authenticatedUser;
		});

		var _updatePassword = function(userId, oldPassword, newPassword, onSuccess, onError) {
			
			if (!userId || typeof userId !== 'string' || userId.length == 0) throw new Error("Please specify valid userid");
			if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.length == 0) throw new Error("Please specify valid oldPassword");
			if (!newPassword || typeof newPassword !== 'string' || newPassword.length == 0) throw new Error("Please specify valid newPassword");

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (oldPassword == newPassword) {
			 	if (typeof onSuccess == 'function') onSuccess(); return;
			}

			var updatedPasswordOptions = { oldpassword : oldPassword, newpassword: newPassword };
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUpdatePasswordUrl(userId);
			request.method = 'post';
			request.data = updatedPasswordOptions;
			request.onSuccess = function(a) {
				if (a && a.code == '200') if (typeof onSuccess == 'function') onSuccess();
				else { onError(a); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request); 
		};

		this.setCurrentUser = function(user, token, expiry) {
			if (!user || typeof user != 'object')
				throw new Error('Cannot set null object as user');

			var userObject = user;
			
			if (!user.getArticle) userObject = new global.Appacitive.User(user); 
			
			if (!userObject.get('__id') || userObject.get('__id').length == 0) throw new Error('Specify user __id');

			global.Appacitive.localStorage.set('Appacitive-User', user);
			
			if (!expiry) expiry = 60;

			_authenticatedUser = userObject;

			if (token)
				global.Appacitive.session.setUserAuthHeader(token, expiry);

			_authenticatedUser.logout = function(callback) {
				global.Appacitive.Users.logout(callback);
			};

			_authenticatedUser.updatePassword = function(oldPassword, newPassword, onSuccess, onError) {
				_updatePassword(this.get('__id'), oldPassword, newPassword, onSuccess, onError);
			};

			global.Appacitive.eventManager.clearAndSubscribe('user.' + userObject.get('__id') + '.updated', function(sender, args) {
				global.Appacitive.localStorage.set('Appacitive-User', args.object.getArticle());
			});
		};
		
		global.Appacitive.User = function(options) {
			options.__schematype = 'user';
			var base = new global.Appacitive.Article(options, true);
			return base;
		};

		this.deleteUser = function(userId, onSuccess, onError) {
			if (!userId)
				throw new Error('Specify userid for user delete');

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var userObject = new global.Appacitive.Article({ __schematype: 'user', __id: userId });
			userObject.del(onSuccess, onError);
		};

		this.deleteCurrentUser = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};

			if (_authenticatedUser === null)
				throw new Error('Current user is not yet set for delete operation');

			var currentUserId = _authenticatedUser.get('__id');
			this.deleteUser(currentUserId, function(data) { 
				global.Appacitive.session.removeUserAuthHeader();
				if (typeof onSuccess == 'function') onSuccess(data);
			}, onError);
		};

		this.createNewUser = function(user, onSuccess, onError) {
			user = user || {};
			user.__schematype = 'user';
			if (!user.username || !user.password || !user.firstname || user.username.length == 0 || user.password.length == 0 || user.firstname.length == 0) 
				throw new Error('username, password and firstname are mandatory');

			var userObject = new global.Appacitive.Article(user);
			user.type = 'user';
			userObject.save(onSuccess, onError);
		};
		this.createUser = this.createNewUser;

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
					that.setCurrentUser(data.user, data.token, authRequest.expiry);
					onSuccess({ user : that.currentUser, token: data.token });
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
						//"expiry": 120 * 60,
						"expiry": -1,
						"createnew": true
					};
					var request = new global.Appacitive.HttpRequest();
					request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
					request.method = 'post';
					request.data = authRequest;
					request.onSuccess = function(a) {
						if (a.user) {
							//a.user.__authType = 'FB';
							that.setCurrentUser(a.user, a.token, 120);
							onSuccess({ user : that.currentUser, token: a.token });
						} else {
							data = data || {};
							onError(data);
						}
					};
					request.onError = onError;
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
				if (typeof(callback) == 'function') callback(false);
				return false;
			}

			if (!avoidApiCall) {
				try {
					var _request = new global.Appacitive.HttpRequest();
					_request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getValidateTokenUrl(token);
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

		this.sendResetPasswordEmail = function(username, subject, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!username || typeof username != 'string' || username.length == 0) throw new Error("Please specify valid username");
			if (subject && typeof subject == 'string' && subject.length == 0) throw new Error('Plase specify subject for email');

			var passwordResetOptions = { username: username, subject: subject };
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getSendResetPasswordEmailUrl();
			request.method = 'post';
			request.data = passwordResetOptions;
			request.onSuccess = function(a) {
				if (a && a.code == '200') if (typeof onSuccess == 'function') onSuccess();
				else { onError(a); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request); 
		};

		this.logout = function(callback, avoidApiCall) {
			callback = callback || function() {};
			_authenticatedUser = null;
			global.Appacitive.session.removeUserAuthHeader(callback, avoidApiCall);
		};
	};

	global.Appacitive.Users = new UserManager();

})(global);