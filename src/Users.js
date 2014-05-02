(function (global) {

	"use strict";

	var User = function(options, setSnapshot) {
		options = options || {};
		options.__type = 'user';
		global.Appacitive.Object.call(this, options, setSnapshot);
		return this;
	};

	var _authenticatedUser = null;

	User.currentUser = User.current = function() { return _authenticatedUser; };

	var _updatePassword = function(oldPassword, newPassword, options) {
		var userId = this.get('__id');
		if (!userId || !_type.isString(userId) || userId.length === 0) throw new Error("Please specify valid userid");
		if (!oldPassword || !_type.isString(oldPassword) || oldPassword.length === 0) throw new Error("Please specify valid oldPassword");
		if (!newPassword || !_type.isString(newPassword) || newPassword.length === 0) throw new Error("Please specify valid newPassword");

		var updatedPasswordOptions = { oldpassword : oldPassword, newpassword: newPassword };
		
		var that = this;

		var request = new global.Appacitive._Request({
			method: 'POST',
			type: 'user',
			op: 'getUpdatePasswordUrl',
			args: [userId],
			options: options,
			data: updatedPasswordOptions,
			entity: this,
			onSuccess: function(data) {
				request.promise.fulfill(that);
			}
		});
		return request.send();
	};

	var _link = function(link, options) {
		var userId = this.get('__id');

		if (!this.get('__id')) {
			this.set('__link', link);
			return global.Appacitive.Promise.buildPromise(options).fulfill(this);
		}

		var that = this;

		var request = new global.Appacitive._Request({
			method: 'POST',
			type: 'user',
			op: 'getLinkAccountUrl',
			args: [userId],
			options: options,
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

	User.setCurrentUser = function(user, token, expiry) {
		if (!user) throw new Error('Cannot set null object as user');
		var userObject = user;
		
		if (!(userObject instanceof global.Appacitive.User)) userObject = new global.Appacitive.User(user, true); 
		else if (!userObject.get('__id') || userObject.get('__id').length === 0) throw new Error('Specify user __id');
		else user = userObject.toJSON(); 

		global.Appacitive.localStorage.set('Appacitive-User', user);

		if (!expiry) expiry = 3600;
		_authenticatedUser = userObject;

		if (token) global.Appacitive.Session.setUserAuthHeader(token, expiry);

		_authenticatedUser.logout = function(callback) { return global.Appacitive.Users.logout(callback); };

		_authenticatedUser.updatePassword = function(oldPassword, newPassword, options) {
			return _updatePassword.apply(this, [oldPassword, newPassword, options]);
		};

		_authenticatedUser.logout = function(callback) { return global.Appacitive.Users.logout(callback); };

		global.Appacitive.eventManager.clearAndSubscribe('type.user.' + userObject.get('__id') + '.updated', function(sender, args) {
			global.Appacitive.localStorage.set('Appacitive-User', args.object.getObject());
		});

		return _authenticatedUser;
	};
	

	//getter to get linkedaccounts
	User.prototype.linkedAccounts = function() {
		
		var accounts = this.get('__link');
		
		if (!accounts) accounts = [];
		else if (!_type.isArray(accounts)) accounts = [accounts];
		
		return accounts;
	};

	//method for getting all linked accounts
	User.prototype.getAllLinkedAccounts = function(options) {
		var userId = this.get('__id');
		
		if (!userId || !_type.isString(userId) || userId.length === 0) {
			return global.Appacitive.Promise.buildPromise(options).fulfill(this.linkedAccounts(), this);
		}

		var that = this;

		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'user',
			op: 'getGetAllLinkedAccountsUrl',
			args: [userId],
			options: options,
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

	User.prototype.checkin = function(coords, options) {
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
			options: options,
			entity: this,
			onSuccess: function() {
				request.promise.fulfill(that);
			}
		});
		return request.send();
	};

	//method for linking facebook account to a user
	User.prototype.linkFacebook = function(accessToken, options) {
		
		if (!accessToken || !_type.isString(accessToken)) throw new Error("Please provide accessToken");

		var payload = {
			"authtype": "facebook",
			"accesstoken": accessToken,
			"name": "facebook"
		};

		return _link.apply(this, [payload, options]);
	};

	//method for linking twitter account to a user
	User.prototype.linkTwitter = function(twitterObj, options) {
		
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

		return _link.apply(this, [payload, options]);
	};

	//method to unlink an oauth account
	User.prototype.unlink = function(name, options) {
		
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
			options: options,
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

	User.prototype.clone = function() {
		return new global.Appacitive.User(this.getObject());
	};

	global.Appacitive.User = global.Appacitive.Object.extend('user', User.prototype);

	//Remove article static properties
	delete global.Appacitive.User._create;
	delete global.Appacitive.User._parseResult;
	delete global.Appacitive.User.multiDelete;

	User.deleteUser = function(userId, options) {
		if (!userId) throw new Error('Specify userid for user delete');
		return new global.Appacitive.Object({ __type: 'user', __id: userId }).destroyWithConnections(options);
	};

	User.deleteCurrentUser = function(options) {
		
		var promise = global.Appacitive.Promise.buildPromise(options);

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
			promise.reject.apply(promise, arguments);
		});

		return promise;
	};

	User.createNewUser = function(user, options) {
		user = user || {};
		user.__type = 'user';
		if (!user.username || !user.password || !user.firstname || user.username.length === 0 || user.password.length === 0 || user.firstname.length === 0) 
			throw new Error('username, password and firstname are mandatory');

		return new global.Appacitive.User(user).save(options);
	};

	User.createUser = User.createNewUser;

	//method to allow user to signup and then login 
	User.signup = function(user, options) {
		var that = this;
		var promise = global.Appacitive.Promise.buildPromise(options);

		this.createUser(user).then(function() {
			that.login(user.username, user.password).then(function() {
				promise.fulfill.apply(promise, arguments);
			}, function(staus) {
				promise.reject.apply(promise, arguments);
			});
		}, function() {
			promise.reject.apply(promise, arguments);
		});

		return promise;
	};

	//authenticate user with authrequest that contains username , password and expiry
	User.authenticateUser = function(authRequest, options, provider) {

		if (!authRequest.expiry) authRequest.expiry = 86400000;
		var that = this;

		var request = new global.Appacitive._Request({
			method: 'POST',
			type: 'user',
			op: 'getAuthenticateUserUrl',
			options: options,
			data: authRequest,
			onSuccess: function(data) {
				if (data && data.user) {
					if (provider) data.user.__authType = provider;
					that.setCurrentUser(data.user, data.token, authRequest.expiry);
					global.Appacitive.User.trigger('login', _authenticatedUser, _authenticatedUser, data.token);
					request.promise.fulfill({ user : _authenticatedUser, token: data.token });
				} else {
					request.promise.reject(data.status);
				}
			}
		});
		return request.send();
	};

	//An overrride for user login with username and password directly
	User.login = function(username, password, options) {

		if (!username || !password || username.length ==0 || password.length == 0) throw new Error('Please specify username and password');

		var authRequest = {
			username : username,
			password: password,
			expiry: 86400000
		};

		return this.authenticateUser(authRequest, options, 'BASIC');
	};

	User.loginWithFacebook = function(accessToken, options) {
		
		if (!accessToken || !_type.isString(accessToken)) throw new Error("Please provide accessToken");

		var authRequest = {
			"accesstoken": accessToken,
			"type": "facebook",
			"expiry": 86400000,
			"createnew": true
		};

		return this.authenticateUser(authRequest, options, 'FB');
	};

	User.loginWithTwitter = function(twitterObj, options) {
		
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

		return this.authenticateUser(authRequest, options, 'TWITTER');
	};

	User.validateCurrentUser = function(avoidApiCall, callback) {

		var promise = global.Appacitive.Promise.buildPromise({ success: callback });

		if (callback && _type.isBoolean(callback)) {
			avoidApiCall = callback;
			callback = function() {}; 
		}

		var token = global.Appacitive.localStorage.get('Appacitive-UserToken');

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

	var _getUserByIdType = function(op, args, options) {
		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'user',
			op: op,
			options: options,
			args: args,
			onSuccess: function(data) {
				if (data && data.user) request.promise.fulfill(new global.Appacitive.User(data.user));
				else request.promise.reject(data.status);
			}
		});
		return request.send();
	};

	User.getUserByToken = function(token, options) {
		if (!token || !_type.isString(token) || token.length === 0) throw new Error("Please specify valid token");
		global.Appacitive.Session.setUserAuthHeader(token, 0, true);
		return _getUserByIdType("getUserByTokenUrl", [token], options);
	};

	User.getUserByUsername = function(username, options) {
		if (!username || !_type.isString(username) || username.length === 0) throw new Error("Please specify valid username");
		return _getUserByIdType("getUserByUsernameUrl", [username], options);
	};

	User.logout = function(makeApiCall, options) {
		_authenticatedUser = null;
		return global.Appacitive.Session.removeUserAuthHeader(makeApiCall, options);
	};

	User.sendResetPasswordEmail = function(username, subject, options) {

		if (!username || !_type.isString(username)  || username.length === 0) throw new Error("Please specify valid username");
		if (!subject || !_type.isString(subject) || subject.length === 0) throw new Error('Plase specify subject for email');

		var passwordResetOptions = { username: username, subject: subject };

		var request = new global.Appacitive._Request({
			method: 'POST',
			type: 'user',
			op: 'getSendResetPasswordEmailUrl',
			options: options,
			data: passwordResetOptions,
			onSuccess: function() {
				request.promise.fulfill();
			}
		});
		return request.send();
	};

	User.resetPassword = function(token, newPassword, options) {

		if (!token) throw new Error("Please specify token");
		if (!newPassword || newPassword.length === 0) throw new Error("Please specify password");

		var request = new global.Appacitive._Request({
			method: 'POST',
			type: 'user',
			op: 'getResetPasswordUrl',
			options: options,
			data: { newpassword: newPassword },
			args: [token],
			onSuccess: function() {
				request.promise.fulfill();
			}
		});
		return request.send();
	};

	User.validateResetPasswordToken = function(token, options) {
		
		if (!token) throw new Error("Please specify token");

		var request = new global.Appacitive._Request({
			method: 'POST',
			type: 'user',
			op: 'getValidateResetPasswordUrl',
			options: options,
			data: {},
			args: [token],
			onSuccess: function(a) {
				request.promise.fulfill(a.user);
			}
		});
		return request.send();
	};

	global.Appacitive.Users = global.Appacitive.User;

    global.Appacitive.Events.mixin(global.Appacitive.User);

})(global);
