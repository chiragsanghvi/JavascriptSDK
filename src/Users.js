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

			var updatedPasswordOptions = { oldpassword : oldPassword, newpassword: newPassword };
			
			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getUpdatePasswordUrl',
				args: [userId],
				callbacks: callbacks,
				data: updatedPasswordOptions,
				entity: this,
				onSuccess: function(data) {
					request.promise.fulfill(that);
				}
			});
			return request.send();
		};

		var _link = function(link, callbacks) {
			var userId = this.get('__id');

			if (!this.get('__id')) {
				this.set('__link', link);
				return global.Appacitive.Promise.buildPromise(callbacks).fulfill(this);
			}

			var that = this;

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getLinkAccountUrl',
				args: [userId],
				callbacks: callbacks,
				data: link,
				entity: this,
				onSuccess: function(data) {
					var links = that.get('__link');
					if (!_type.isArray(links)) {
						links = (links) ? [links] : [];
					}
					links.push(link);
					that.copy({__link: links }, true);
					request.promise.fulfill(that);
				}
			});
			return request.send();
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
			
			if (!userId || !_type.isString(userId) || userId.length === 0) {
				return global.Appacitive.Promise.buildPromise(callbacks).fulfill(this.linkedAccounts(), this);
			}

			var that = this;

			var request = new global.Appacitive._Request({
				method: 'GET',
				type: 'user',
				op: 'getGetAllLinkedAccountsUrl',
				args: [userId],
				callbacks: callbacks,
				entity: this,
				onSuccess: function() {
					var accounts = a.identities || []; 
					if (accounts.length > 0) that.set('__link', accounts);
					else that.set('__link', null);
					
					request.promise.fulfill(accounts, that);
				}
			});
			return request.send();
		};

		global.Appacitive.User.prototype.checkin = function(coords, callbacks) {
			var userId = this.get('__id');
			if (!userId || !_type.isString(userId) || userId.length === 0) {
				if (onSuccess && _type.isFunction(onSuccess)) onSuccess();
			}
			if (!coords || !(coords instanceof global.Appacitive.GeoCoord)) throw new Error("Invalid coordinates provided");

			var that = this;

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getCheckinUrl',
				args: [userId, coords.lat, coords.lngerId],
				callbacks: callbacks,
				entity: this,
				onSuccess: function() {
					request.promise.fulfill(that);
				}
			});
			return request.send();
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
			
			if (!_type.isObject(twitterObj) || !twitterObj.oAuthToken  || !twitterObj.oAuthTokenSecret) throw new Error("Twitter Token and Token Secret required for linking");
			
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

			if (!this.get('__id')) {
				this.set('__link', null);
				promise.fulfill(this);
				return promise;
			}

			var that = this;

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getDelinkAccountUrl',
				args: [userId, name],
				callbacks: callbacks,
				entity: this,
				onSuccess: function(a) {
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
						that.copy({ __link: accounts }, true);
					} else {
						that.copy({ __link: [] }, true);
					}

					request.promise.fulfill(that);
				}
			});
			return request.send();
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
				_authenticatedUser = null;
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
					promise.fulfill.apply(promise, arguments);
				}, function(staus) {
					promise.reject.apply(promise, arguments);
				});
			}, function() {
				promise.reject(arguments);
			});

			return promise;
		};

		//authenticate user with authrequest that contains username , password and expiry
		this.authenticateUser = function(authRequest, callbacks, provider) {

			if (!authRequest.expiry) authRequest.expiry = 86400000;
			var that = this;

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getAuthenticateUserUrl',
				callbacks: callbacks,
				data: authRequest,
				onSuccess: function(data) {
					if (data && data.user) {
						if (provider) data.user.__authType = provider;
						that.setCurrentUser(data.user, data.token, authRequest.expiry);
						request.promise.fulfill({ user : _authenticatedUser, token: data.token });
					} else {
						request.promise.reject(data.status);
					}
				}
			});
			return request.send();
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

			return this.authenticateUser(authRequest, callbacks, 'FB');
		};

		this.loginWithTwitter = function(twitterObj, callbacks) {
			
			if (!_type.isObject(twitterObj) || !twitterObj.oAuthToken  || !twitterObj.oAuthTokenSecret) throw new Error("Twitter Token and Token Secret required for linking");
			
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

			return this.authenticateUser(authRequest, callbacks, 'TWITTER');
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

		var _getUserByIdType = function(op, args, callbacks) {
			var request = new global.Appacitive._Request({
				method: 'GET',
				type: 'user',
				op: op,
				callbacks: callbacks,
				args: args,
				onSuccess: function(data) {
					if (data && data.user) request.promise.fulfill(new global.Appacitive.User(data.user));
					else request.promise.reject(data.status);
				}
			});
			return request.send();
		};

		this.getUserByToken = function(token, callbacks) {
			if (!token || !_type.isString(token) || token.length === 0) throw new Error("Please specify valid token");
			global.Appacitive.Session.setUserAuthHeader(token, 0, true);
			return _getUserByIdType("getUserByTokenUrl", [token], callbacks);
		};

		this.getUserByUsername = function(username, callbacks) {
			if (!username || !_type.isString(username) || username.length === 0) throw new Error("Please specify valid username");
			return _getUserByIdType("getUserByUsernameUrl", [username], callbacks);
		};

		this.logout = function(makeApiCall) {
			_authenticatedUser = null;
			return global.Appacitive.Session.removeUserAuthHeader(makeApiCall);
		};

		this.sendResetPasswordEmail = function(username, subject, callbacks) {

			if (!username || !_type.isString(username)  || username.length === 0) throw new Error("Please specify valid username");
			if (!subject || !_type.isString(subject) || subject.length === 0) throw new Error('Plase specify subject for email');

			var passwordResetOptions = { username: username, subject: subject };

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getSendResetPasswordEmailUrl',
				callbacks: callbacks,
				data: passwordResetOptions,
				onSuccess: function() {
					request.promise.fulfill();
				}
			});
			return request.send();
		};

		this.resetPassword = function(token, newPassword, callbacks) {

			if (!token) throw new Error("Please specify token");
			if (!newPassword || newPassword.length === 0) throw new Error("Please specify password");

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getResetPasswordUrl',
				callbacks: callbacks,
				data: { newpassword: newPassword },
				args: [token],
				onSuccess: function() {
					request.promise.fulfill();
				}
			});
			return request.send();
		};

		this.validateResetPasswordToken = function(token, callbacks) {
			
			if (!token) throw new Error("Please specify token");

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'user',
				op: 'getValidateResetPasswordUrl',
				callbacks: callbacks,
				data: {},
				args: [token],
				onSuccess: function(a) {
					request.promise.fulfill(a.user);
				}
			});
			return request.send();
		};
	};

	global.Appacitive.Users = new UserManager();

})(global);
