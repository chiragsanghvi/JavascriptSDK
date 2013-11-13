(function (global) {

	"use strict";

	var UserManager = function() {

		var _authenticatedUser = null;

		this.current = function() {
			return _authenticatedUser;
		};

		this.currentUser = this.current;

		var _updatePassword = function(oldPassword, newPassword, callbacks) {
			var userId = this.get('__id');
			if (!userId || !_type.isString(userId) || userId.length === 0) throw new Error("Please specify valid userid");
			if (!oldPassword || !_type.isString(oldPassword) || oldPassword.length === 0) throw new Error("Please specify valid oldPassword");
			if (!newPassword || !_type.isString(newPassword) || newPassword.length === 0) throw new Error("Please specify valid newPassword");

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var updatedPasswordOptions = { oldpassword : oldPassword, newpassword: newPassword };
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUpdatePasswordUrl(userId);
			request.method = 'post';
			request.data = updatedPasswordOptions;
			var that = this;

			request.onSuccess = function(a) {
				promise.fulfill(that);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		var _link = function(link, callbacks) {
			var userId = this.get('__id');
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			if (!this.get('__id')) {
				this.set('__link', link);
				promise.fulfill(this);
				return promise;
			}

			var that = this;

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getLinkAccountUrl(userId);
			request.method = 'post';
			request.data = link;
			request.onSuccess = function(a) {
				var links = that.get('__link');
				if (!_type.isArray(links)) {
					links = (links) ? [links] : [];
				}
				links.push(link);
				that.set('__link', links);
				promise.fulfill(that);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		this.setCurrentUser = function(user, token, expiry) {
			if (!user) throw new Error('Cannot set null object as user');
			var userObject = user;
			
			if (!(userObject instanceof global.Appacitive.User)) userObject = new global.Appacitive.User(user, true); 
			else if (!userObject.get('__id') || userObject.get('__id').length === 0) throw new Error('Specify user __id');
			else user = userObject.toJSON(); 

			global.Appacitive.localStorage.set('Appacitive-User', user);
			if (!expiry) expiry = 60;
			_authenticatedUser = userObject;

			if (token) global.Appacitive.Session.setUserAuthHeader(token, expiry);

			_authenticatedUser.logout = function(callback) { return global.Appacitive.Users.logout(callback); };

			_authenticatedUser.updatePassword = function(oldPassword, newPassword, callbacks) {
				return _updatePassword.apply(this, [oldPassword, newPassword, callbacks]);
			};

			_authenticatedUser.logout = function(callback) { return global.Appacitive.Users.logout(callback); };

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
			
			if (!accounts) accounts = [];
			else if (!_type.isArray(accounts)) accounts = [accounts];
			
			return accounts;
		};

		//method for getting all linked accounts
		global.Appacitive.User.prototype.getAllLinkedAccounts = function(callbacks) {
			var userId = this.get('__id');
			var promise = global.Appacitive.Promise.buildPromise(callbacks);
			
			if (!userId || !_type.isString(userId) || userId.length === 0) {
				promise.fulfill(this.linkedAccounts(), this);
				return promise;
			}

			var that = this;
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(userId);
			request.method = 'get';
			request.onSuccess = function(a) {
				var accounts = a.identities || []; 
				if (accounts.length > 0) that.set('__link', accounts);
				else that.set('__link', null);
				
				promise.fulfill(accounts, that);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		global.Appacitive.User.prototype.checkin = function(coords, callbacks) {
			var userId = this.get('__id');
			if (!userId || !_type.isString(userId) || userId.length === 0) {
				if (onSuccess && _type.isFunction(onSuccess)) onSuccess();
			}
			if (!coords || !(coords instanceof global.Appacitive.GeoCoord)) throw new Error("Invalid coordinates provided");

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var that = this;

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getCheckinUrl(userId, coords.lat, coords.lng);
			request.method = 'post';
			request.onSuccess = function(a) {
				promise.fulfill(accounts, that);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		//method for linking facebook account to a user
		global.Appacitive.User.prototype.linkFacebook = function(accessToken, callbacks) {
			
			if (!accessToken || !_type.isString(accessToken)) throw new Error("Please provide accessToken");

			var payload = {
				"authtype": "facebook",
				"accesstoken": accessToken,
				"name": "facebook"
			};

			return _link.apply(this, [payload, callbacks]);
		};

		//method for linking twitter account to a user
		global.Appacitive.User.prototype.linkTwitter = function(twitterObj, callbacks) {
			
			if (!_type.isObject(twitterObj) || !twitterObj.oAuthToken  || !twitterObj.oAuthTokenSecret) throw new Error("Twitter Token and Token Secret required for linking")
			
			var payload = {
				"authtype": "twitter",
				"oauthtoken": twitterObj.oAuthToken ,
				"oauthtokensecret": twitterObj.oAuthTokenSecret
			};

			if (twitterObj.consumerKey && twitterObj.consumerSecret) {
				payload.consumersecret = twitterObj.consumerSecret;
				payload.consumerkey = twitterObj.consumerKey;
			}

			return _link.apply(this, [payload, callbacks]);
		};

		//method to unlink an oauth account
		global.Appacitive.User.prototype.unlink = function(name, callbacks) {
			
			if (!_.isString(name)) throw new Error("Specify aouth account type for unlinking");

			var userId = this.get('__id');

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			if (!this.get('__id')) {
				this.set('__link', null);
				promise.fulfill(this);
				return promise;
			}

			var that = this;

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getLinkAccountUrl(userId, name);
			request.method = 'post';
			request.onSuccess = function(a) {
				var accounts = that.get('__link');
			
				if (!accounts) accounts = [];
				else if (!_type.isArray(accounts)) accounts = [accounts];

				if (accounts.length >= 0) {
					var ind = null;
					accounts.forEach(function(a, i) {
						if (a.name == name.toLowerCase()) {
							ind = i;
							return;
						}
					});
					if (ind != null) accounts.splice(ind, 1);
					that.set('__link', accounts);
				} else {
					that.set('__link', null);
				}

				promise.fulfill(that);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		global.Appacitive.User.prototype.clone = function() {
			return new global.Appacitive.User(this.getObject());
		};

		this.deleteUser = function(userId, callbacks) {
			if (!userId) throw new Error('Specify userid for user delete');
			return new global.Appacitive.Article({ __schematype: 'user', __id: userId }).del(callbacks);
		};

		this.deleteCurrentUser = function(callbacks) {
			
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var _callback = function() {
				global.Appacitive.Session.removeUserAuthHeader();
				promise.fulfill();
			};

			if (_authenticatedUser === null) { 
				_callback();
				return promise;
			}

			var currentUserId = _authenticatedUser.get('__id');
			
			this.deleteUser(currentUserId).then(function() { 
				_callback();
			}, function() { 
				promise.reject(arguments);
			});

			return promise;
		};

		this.createNewUser = function(user, callbacks) {
			user = user || {};
			user.__schematype = 'user';
			if (!user.username || !user.password || !user.firstname || user.username.length === 0 || user.password.length === 0 || user.firstname.length === 0) 
				throw new Error('username, password and firstname are mandatory');

			return new global.Appacitive.User(user).save(callbacks);
		};
		this.createUser = this.createNewUser;

		//method to allow user to signup and then login 
		this.signup = function(user, callbacks) {
			var that = this;
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			this.createUser(user).then(function() {
				that.login(user.username, user.password).then(function() {
					promise.fulfill(arguments);
				}, function(staus) {
					promise.reject(arguments);
				});
			}, function() {
				promise.reject(arguments);
			});

			return promise;
		};

		//authenticate user with authrequest that contains username , password and expiry
		this.authenticateUser = function(authRequest, callbacks, provider) {

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			if (!authRequest.expiry) authRequest.expiry = 86400000;
			var that = this;
			var request = new global.Appacitive.HttpRequest();
			request.method = 'post';
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getAuthenticateUserUrl();
			request.data = authRequest;
			request.onSuccess = function(data) {
				if (data && data.user) {
					if (provider) data.user.__authType = provider;
					that.setCurrentUser(data.user, data.token, authRequest.expiry);
					promise.fulfill({ user : _authenticatedUser, token: data.token });
				} else {
					promise.reject(data.status);
				}
			};
			request.promise = promise;
			return global.Appacitive.http.send(request);
		};

		//An overrride for user login with username and password directly
		this.login = function(username, password, callbacks) {

			if (!username || !password || username.length ==0 || password.length == 0) throw new Error('Please specify username and password');

			var authRequest = {
				username : username,
				password: password,
				expiry: 86400000
			};

			return this.authenticateUser(authRequest, callbacks, 'BASIC');
		};

		this.loginWithFacebook = function(accessToken, callbacks) {
			
			if (!accessToken || !_type.isString(accessToken)) throw new Error("Please provide accessToken");

			var authRequest = {
				"accesstoken": accessToken,
				"type": "facebook",
				"expiry": 86400000,
				"createnew": true
			};

			return that.authenticateUser(authRequest, callbacks, 'FB');
		};

		this.loginWithTwitter = function(twitterObj, callbacks) {
			
			if (!_type.isObject(twitterObj) || !twitterObj.oAuthToken  || !twitterObj.oAuthTokenSecret) throw new Error("Twitter Token and Token Secret required for linking")
			
			var authRequest = {
				"type": "twitter",
				"oauthtoken": twitterObj.oAuthToken ,
				"oauthtokensecret": twitterObj.oAuthTokenSecret,
				"expiry": 86400000,
				"createnew": true
			};

			if (twitterObj.consumerKey && twitterObj.consumerSecret) {
				authRequest.consumersecret = twitterObj.consumerSecret;
				authRequest.consumerkey = twitterObj.consumerKey;
			}

			return that.authenticateUser(authRequest, callbacks, 'TWITTER');
		};

		this.validateCurrentUser = function(avoidApiCall, callback) {

			var promise = global.Appacitive.Promise.buildPromise({ success: callback });

			if (callback && _type.isBoolean(callback)) {
				avoidApiCall = callback;
				callback = function() {}; 
			}

			var token = global.Appacitive.Cookie.readCookie('Appacitive-UserToken');

			if (!token) {
				promise.fulfill(false);
				return promise;
			}

			if (!avoidApiCall) {
				try {
					var that = this;
					this.getUserByToken(token).then(function(user) {
						that.setCurrentUser(user, token);
						promise.fulfill(true);
					}, function() {
						promise.fulfill(false);
					});
				} catch (e) { 
					promise.fulfill(false);
				}
			} else {
				promise.fulfill(true);
			}

			return promise;
		};

		var _getUserByIdType = function(url, callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);
			var request = new global.Appacitive.HttpRequest();
			request.url = url;
			request.method = 'get';
			request.onSuccess = function(data) {
				if (data && data.user) promise.fulfill(new global.Appacitive.User(data.user));
				else promise.reject(data.status);
			};
			request.promise = promise;
			return global.Appacitive.http.send(request);
		};

		this.getUserByToken = function(token, callbacks) {
			if (!token || !_type.isString(token) || token.length === 0) throw new Error("Please specify valid token");
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUserByTokenUrl(token);
			global.Appacitive.Session.setUserAuthHeader(token, 0, true);
			return _getUserByIdType(url, callbacks);
		};

		this.getUserByUsername = function(username, callbacks) {
			if (!username || !_type.isString(username) || username.length === 0) throw new Error("Please specify valid username");
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getUserByUsernameUrl(username);
			return _getUserByIdType(url, callbacks);
		};

		this.logout = function(callback, avoidApiCall) {
			callback = callback || function() {};
			_authenticatedUser = null;
			return global.Appacitive.Session.removeUserAuthHeader(callback, avoidApiCall);
		};

		this.sendResetPasswordEmail = function(username, subject, callbacks) {

			if (!username || !_type.isString(username)  || username.length === 0) throw new Error("Please specify valid username");
			if (!subject || !_type.isString(subject) || subject.length === 0) throw new Error('Plase specify subject for email');

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var passwordResetOptions = { username: username, subject: subject };
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getSendResetPasswordEmailUrl();
			request.method = 'post';
			request.data = passwordResetOptions;
			request.onSuccess = function() {
				promise.fulfill();
			};
			request.promise = promise;
			return global.Appacitive.http.send(request); 
		};

		this.resetPassword = function(token, newPassword, callbacks) {

			if (!token) throw new Error("Please specify token");
			if (!newPassword || newPassword.length === 0) throw new Error("Please specify password");

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getResetPasswordUrl(token);
			request.method = 'post';
			request.data = { newpassword: newPassword };
			request.onSuccess = function(a) {
				promise.fulfill();
			};
			request.promise = promise;
			return global.Appacitive.http.send(request); 
		};

		this.validateResetPasswordToken = function(token, callbacks) {
			
			if (!token) throw new Error("Please specify token");

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getValidateResetPasswordUrl(token);
			request.method = 'post';
			request.data = {};
			request.onSuccess = function(a) {
				promise.fulfill(a.user);
			};
			request.promise = promise;
			return global.Appacitive.http.send(request); 
		};
	};

	global.Appacitive.Users = new UserManager();

})(global);
