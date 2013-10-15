(function (global) {

 	"use strict";

    var _browserFacebook = function() {

		var _accessToken = null;

		var _initialized = true;

		var _app_id = null;

		this.initialize = function(options) {
		  if (!FB) throw "Facebook SDK needs be loaded before calling initialize.";
		  if (!options.appId) throw new Error("Please provide appid");
		  _app_id = options.appId;
		  FB.init(options);
		  _initialized = true;
		};

		this.requestLogin = function(onSuccess, onError) {
			if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");
		    onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			FB.login(function(response) {
				if (response && response.status === 'connected' && response.authResponse) {
					_accessToken = response.authResponse.accessToken;
					if (typeof onSuccess == 'function') onSuccess(response.authResponse);
				} else {
					if (typeof onError == 'function') onError();
				}
			}, { scope:'email,user_birthday' });
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			FB.api('/me', function(response) {
				if (response && !response.error) {
					_accessToken = FB.getAuthResponse().accessToken;
					if (typeof onSuccess == 'function') onSuccess(response);
				} else {
					if (typeof onError == 'function') onError();
				}
			});
		};

		this.accessToken = function() {
			if (arguments.length == 1) {
				_accessToken = arguments[0];
				return this;
			}
			return _accessToken;
		};

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};

		this.logout = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function(){};
			global.Appacitive.Facebook.accessToken = "";
			try {
				FB.logout(function(response) {
					global.Appacitive.Users.logout();
					if (typeof onSuccess == 'function') onSuccess();
				});
			} catch(e) {
				if (typeof onError == 'function') onError(e.message);
			}
		};
	};

	var _nodeFacebook = function() {

		var _accessToken = null;

		this.FB = null;

		var _app_id = null;

		var _app_secret = null;

		var _initialized = false;

		this.initialize = function (options) { 
			if (!Facebook) throw new Error("node-facebook SDK needs be loaded before calling initialize.");
			if (!options.appId) throw new Error("Please provide appid");
			if (!options.appSecret) throw new Error("Please provide app secret");

			_app_id = options.appId;
			_app_secret = options.appSecret;
		    this.FB = new (require('facebook-node-sdk'))({ appId: _appId, secret: _app_secret });
		    _initialized = true;
		};

		this.requestLogin = function(onSuccess, onError, accessToken) {
			if (accessToken) _accessToken = accessToken;
			global.Appacitive.Users.loginWithFacebook(onSuccess, onError, true);
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");

			if (this.FB && _accessToken){
				onSuccess = onSuccess || function(){};
				onError = onError || function(){};
				this.FB.api('/me', function(err, response) {
					if (response) {
						if (typeof onSuccess == 'function') onSuccess(response);
					} else {
						if (typeof onError == 'function') onError("Access token is invalid");
					}
				});
			} else {
				onError("Either intialize facebook with your appid and appsecret or set accesstoken");
			}
		};

		this.accessToken = function() {
			if (arguments.length == 1) {
				_accessToken = arguments[0];
				return this;
			}
			return _accessToken;
		};

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};

		this.logout = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function(){};
			global.Appacitive.Facebook.accessToken = "";
			if (typeof onSuccess == 'function') onSuccess();
		}
	}

	global.Appacitive.Facebook = global.Appacitive.runtime.isBrowser ? new _browserFacebook() : new _nodeFacebook();

})(global);