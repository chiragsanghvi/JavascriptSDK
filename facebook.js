(function (global) {

	"use strict";

	var _browserFacebook = function() {

		var _accessToken = null;

		this.requestLogin = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			if (!FB) {
				onError();
				return;
			}
			FB.login(function(response) {
				if (response.authResponse) {
					var accessToken = response.authResponse.accessToken;
					_accessToken = accessToken;
					onSuccess(response.authResponse);
				} else {
					onError();
				}
			}, {scope:'email,user_birthday'});
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			FB.api('/me', function(response) {
				if (response) {
					onSuccess(response);
				} else {
					onError();
				}
			});
		};

		this.__defineGetter__('accessToken', function() {
			return _accessToken;
		});

		this.__defineSetter__('accessToken', function(val) {
			_accessToken = val;
		});

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};

		this.logout = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function(){};
			try {
				FB.logout(function(response) {
					onSuccess();
				});
			} catch(e) {
				onError(e.message);
			}
		};

	};

	var _nodeFacebook = function() {

		var Facebook = require('facebook-node-sdk');

		var _accessToken = null;

		this.FB = null;

		var _app_id = null;

		var _app_secret = null;

		this.initialize = function (appId, appSecret) { 
			if (!appId) throw new Error("Please provide appid");
			if (!appSecret) throw new Error("Please provide app secret");
			
			_app_id = appId;
			_app_secret = appSecret;
		    this.FB = new Facebook({ appId: appId, secret: appSecret });
		}

		this.requestLogin = function(accessToken, onSuccess, onError) {
			if (this.FB) {
				_accessToken = accesstoken;
				FB.setAccessToken(accessToken);
			} else {
				onError ("Intialize facebook with your appid and appsecret");
			}
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			if(this.FB && _accessToken){
				onSuccess = onSuccess || function(){};
				onError = onError || function(){};
				this.FB.api('/me', function(err, response) {
					if (response) {
						onSuccess(response);
					} else {
						onError("Access token is invalid");
					}
				});
			} else{
				onError("Either intialize facebook with your appid and appsecret or set accesstoken");
			}
		};

		this.__defineGetter__('accessToken', function() {
			return _accessToken;
		});

		this.__defineSetter__('accessToken', function(val) {
			console.log(val);
			_accessToken = val;
			if(this.FB)
				this.FB.setAccessToken(val);
		});

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};
	}

	global.Appacitive.facebook = global.Appacitive.runtime.isBrowser ? new _browserFacebook() : new _nodeFacebook();

})(global);