(function (global) {

	"use strict";

	var UserManager = function() {

		var _authenticatedUser = null;

		this.currentUser = function() {
			return _authenticatedUser;
		}

		var _updatePassword = function(base, oldPassword, newPassword, onSuccess, onError) {
			var userId = base.get('__id');
			if (!userId || typeof userId !== 'string' || userId.length == 0) throw new Error("Please specify valid userid");
			if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.length == 0) throw new Error("Please specify valid oldPassword");
			if (!newPassword || typeof newPassword !== 'string' || newPassword.length == 0) throw new Error("Please specify valid newPassword");

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (oldPassword == newPassword) {
			 	if (typeof onSuccess == 'function') onSuccess(base); return;
			}

			var updatedPasswordOptions = { oldpassword : oldPassword, newpassword: newPassword };
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUpdatePasswordUrl(userId);
			request.method = 'post';
			request.data = updatedPasswordOptions;
			request.onSuccess = function(a) {
				if (a && a.code == '200') if (typeof onSuccess == 'function') onSuccess(base);
				else { onError(a, base); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		var _getAllLinkedAccounts = function(base, onSuccess, onError) {
			var userId = base.get('__id');
			if (!userId || typeof userId !== 'string' || userId.length == 0) {
				if (typeof onSuccess == 'function') onSuccess(base.linkedAccounts(), base);
			}

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(userId);
			request.method = 'get';
			request.onSuccess = function(a) {
				if (a && a.status && a.status.code == '200') { 
					var accounts = a.identities || []; 
					if (accounts.length > 0) base.set('__link', accounts);
					else base.set('__link', null);
					if (typeof onSuccess == 'function') onSuccess(accounts, base);
				}
				else { onError(a.status, base); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		var _checkin = function(coords, base, onSuccess, onError) {
			var userId = base.get('__id');
			if (!userId || typeof userId !== 'string' || userId.length == 0) {
				if (onSuccess && typeof onSuccess == 'function') onSuccess();
			}
			if (!coords || !coords.lat || !coords.lng) throw new Error("Invalid coordinates provides");

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getCheckinUrl(userId, coords.lat, coords.lng);
			request.method = 'post';
			request.onSuccess = function(a) {
				if (a && a.code == '200') { 
					if (typeof onSuccess == 'function') onSuccess(accounts, base);
				}
				else { if (typeof onError == 'function') onError(a, base); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		var _link = function(accessToken, base, onSuccess, onError) {

			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			
			var payload = {
				"authtype": "facebook",
				"accesstoken": accessToken,
				"name": "facebook"
			};

			var userId = base.get('__id');

			if (!base.get('__id')) {
				base.set('__link', payload);
				if (typeof onSuccess == 'function') onSuccess(base);
				return;
			}

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getLinkAccountUrl(userId);
			request.method = 'post';
			request.data = payload;
			request.onSuccess = function(a) {
				if (a && a.code == '200') {
					base.set('__link', payload);
					if (typeof onSuccess == 'function') onSuccess(base);
				}
				else { onError(a, base); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		var _unlink = function(name, base, onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			
			var userId = base.get('__id');

			if (!base.get('__id')) {
				if (typeof onSuccess == 'function') onSuccess(base);
				return;
			}

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getLinkAccountUrl(userId, name);
			request.method = 'post';
			request.onSuccess = function(a) {
				if (a && a.code == '200') {
					base.set('__link', null);
					if (typeof onSuccess == 'function') onSuccess(base);
				}
				else { onError(a, base); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		this.setCurrentUser = function(user, token, expiry) {
			if (!user) throw new Error('Cannot set null object as user');
			var userObject = user;
			
			if (!(userObject instanceof global.Appacitive.User)) userObject = new global.Appacitive.User(user, true); 
			else if (!userObject.get('__id') || userObject.get('__id').length == 0) throw new Error('Specify user __id');
			else user = userObject.toJSON(); 

			global.Appacitive.localStorage.set('Appacitive-User', user);
			if (!expiry) expiry = 60;
			_authenticatedUser = userObject;

			if (token) global.Appacitive.Session.setUserAuthHeader(token, expiry);

			_authenticatedUser.logout = function(callback) { global.Appacitive.Users.logout(callback); };

			_authenticatedUser.updatePassword = function(oldPassword, newPassword, onSuccess, onError) {
				_updatePassword(this, oldPassword, newPassword, onSuccess, onError);
				return this;
			};

			_authenticatedUser.linkFacebookAccount = function(onSuccess, onError) {
				var _callback = function() {
					_link(Appacitive.Facebook.accessToken(), _authenticatedUser, function(base) {
						global.Appacitive.eventManager.fire('user..article.' + base.get('__id') + '.updated', base, { object: base });
						if (typeof onSuccess == 'function') onSuccess(base);
					}, onError);
				};

				Appacitive.Facebook.getCurrentUserInfo(function() {
					_callback();
				}, function() {
					Appacitive.Facebook.requestLogin(function() {
						_callback();
					}, onError);
				});

				return this;
			};

			_authenticatedUser.unlinkFacebookAccount = function(onSuccess, onError) {

				_unlink('facebook', this, function(base) {
					global.Appacitive.eventManager.fire('user.article.' + base.get('__id') + '.updated', base, { object: base });
					if (typeof onSuccess == 'function') onSuccess(base);
				}, onError);
				
				return this;
			};

			_authenticatedUser.logout = function(callback) { global.Appacitive.Users.logout(callback); };

			_authenticatedUser.checkin = function(coords, onSuccess, onError) {
				_checkin(coords, this, onSuccess, onError);
				return this;
			};
			global.Appacitive.eventManager.clearAndSubscribe('user.article.' + userObject.get('__id') + '.updated', function(sender, args) {
				global.Appacitive.localStorage.set('Appacitive-User', args.object.getArticle());
			});

			return _authenticatedUser;
		};
		
		global.Appacitive.User = function(options) {
			options = options || {};
			options.__schematype = 'user';
			global.Appacitive.Article.call(this, options);
			return this;
		};

		global.Appacitive.User.prototype = new global.Appacitive.Article('user');

		global.Appacitive.User.prototype.constructor = global.Appacitive.User;

		//getter to get linkedaccounts
		global.Appacitive.User.prototype.linkedAccounts = function() {
			
			var accounts = this.get('__link');
			
			if(!accounts) accounts = [];
			else if(typeof accounts == 'object' && !(accounts.length >= 0)) accounts = [accounts];
			else if(!(accounts.length >= 0)) accounts = accounts[0];

			return accounts;
		};

		//method for getting all linked accounts
		global.Appacitive.User.prototype.getAllLinkedAccounts = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			var that = this;

			_getAllLinkedAccounts(this, function(accounts) {
				if (typeof onSuccess == 'function') onSuccess(accounts, that);
			}, onError);
			return this;
		};

		//method for linking facebook account to a user
		global.Appacitive.User.prototype.linkFacebookAccount = function(accessToken, onSuccess, onError) {
			_link(accessToken, this, onSuccess, onError);
			return this;
		};

		//method for unlinking facebook account for a user
		global.Appacitive.User.prototype.unlinkFacebookAccount = function(onSuccess, onError) {
			var that = this;
			_unlink('facebook', this, function() {
				var accounts = that.get('__link');
			
				if (!accounts) accounts = [];
				else if(!(accounts.length >= 0)) accounts = [accounts];

				if (accounts.length > 0) {
					if (accounts[0].name == 'facebook') {
						that.set('__link', null);
					}
				}

				if (typeof onSuccess == 'function') onSuccess(that);
			}, onError);
			return this;
		};

		global.Appacitive.User.prototype.clone = function() {
			return new global.Appacitive.User(this.getObject());
		};

		this.deleteUser = function(userId, onSuccess, onError) {
			if (!userId) throw new Error('Specify userid for user delete');

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var userObject = new global.Appacitive.Article({ __schematype: 'user', __id: userId });
			userObject.del(onSuccess, onError);
		};

		this.deleteCurrentUser = function(onSuccess, onError) {
			
			var _callback = function() {
				global.Appacitive.Session.removeUserAuthHeader();
				if (typeof onSuccess == 'function') onSuccess();
			}
			if (_authenticatedUser === null) { 
				_callback();
				return;
			}
			var currentUserId = _authenticatedUser.get('__id');
			this.deleteUser(currentUserId, function() { 
				_callback();
			}, onError);
		};

		this.createNewUser = function(user, onSuccess, onError) {
			user = user || {};
			user.__schematype = 'user';
			if (!user.username || !user.password || !user.firstname || user.username.length == 0 || user.password.length == 0 || user.firstname.length == 0) 
				throw new Error('username, password and firstname are mandatory');

			var userObject = new global.Appacitive.User(user);
			userObject.save(onSuccess, onError);
		};
		this.createUser = this.createNewUser;

		//method to allow user to signup and then login 
		this.signup = function(user, onSuccess, onError) {
			var that = this;
			this.createUser(user, function() {
				that.login(user.username, user.password, onSuccess, onError);
			}, function(status) {
				onError(status);
			});
		};

		//authenticate user with authrequest that contains username , password and expiry
		this.authenticateUser = function(authRequest, onSuccess, onError, provider) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!authRequest.expiry) authRequest.expiry = 86400000;
			var that = this;
			var request = new global.Appacitive.HttpRequest();
			request.method = 'post';
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
			request.data = authRequest;
			request.onSuccess = function(data) {
				if (data && data.user) {
					if (provider) { 
						data.user.__authType = provider;
					}
					that.setCurrentUser(data.user, data.token, authRequest.expiry);
					onSuccess({ user : _authenticatedUser, token: data.token });
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
				expiry: 86400000
			};

			this.authenticateUser(authRequest, onSuccess, onError, 'BASIC');
		};

		this.signupWithFacebook = function(onSuccess, onError) {
			this.loginWithFacebook(onSuccess, onError, false, true);
		};

		this.loginWithFacebook = function(onSuccess, onError, ignoreFBLogin, isNew) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			var that = this;

			var _callback = function() {

				var authRequest = {
					"accesstoken": global.Appacitive.Facebook.accessToken(),
					"type": "facebook",
					"expiry": 86400000,
					"createnew": true
				};

				that.authenticateUser(authRequest, function(a) {
					if (a.user) {
						a.user.__authType = 'FB';
						if (typeof onSuccess == 'function') onSuccess({ user : _authenticatedUser, token: a.token });
					} else {
						a = a || {};
						if (typeof onError == 'function') onError(a.status);
					}
				}, onError, 'FB');
			};
			if (ignoreFBLogin) {
				_callback();
			} else { 
				Appacitive.Facebook.requestLogin(function(authResponse) {
					_callback();
				}, onError);
			}
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
					var that = this;
					this.getUserByToken(token, function(user) {
						that.setCurrentUser(user, token);
						if (typeof(callback) == 'function') callback(true);
					}, function() {
						if (typeof(callback) == 'function') callback(false);
					});
				} catch (e) { callback(false);}
			} else {
				if (typeof(callback) == 'function') callback(true);
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
				if (a && a.code == '200') {
				 	if (typeof onSuccess == 'function') onSuccess();
				} else { onError(a); }
			};
			request.onError = onError;
			global.Appacitive.http.send(request); 
		};

		var _getUserByIdType = function(url, onSuccess, onError){
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.url = url;
			request.method = 'get';
			request.onSuccess = function(data) {
				if (data && data.user) { 
					if (typeof onSuccess == 'function') onSuccess(new global.Appacitive.User(data.user));
				} else if (typeof onError == 'function') onError(data.status);
			};
			request.onError = onError;
			global.Appacitive.http.send(request);
		};

		this.getUserByToken = function(token, onSuccess, onError) {
			if (!token || typeof token != 'string' || token.length == 0) throw new Error("Please specify valid token");
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUserByTokenUrl(token);
			_getUserByIdType(url, onSuccess, onError);
		};

		this.getUserByUsername = function(username, onSuccess, onError) {
			if (!username || typeof username != 'string' || username.length == 0) throw new Error("Please specify valid username");
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUserByUsernameUrl(username);
			_getUserByIdType(url, onSuccess, onError);
		};

		this.logout = function(callback, avoidApiCall) {
			callback = callback || function() {};
			_authenticatedUser = null;
			global.Appacitive.Session.removeUserAuthHeader(callback, avoidApiCall);
		};
	};

	global.Appacitive.Users = new UserManager();

})(global);