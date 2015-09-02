(function (global) {

	"use strict";

	var Appacitive = global.Appacitive;

	var _facebook = function() {

		var _accessToken = null;

		this.FB = null;

		var _app_id = null;

		var _initialized = true;

		this.initialize = function (options) { 
			if (!Ti.Facebook) throw new Error("Titanium Facebook module needs be loaded before calling initialize.");
			if (!options.appId) throw new Error("Please provide appid");
			
			_app_id = options.appId;
			Ti.Facebook.setAppid(_app_id);
			Ti.Facebook.setPermissions("email", "user_birthday");
			this.FB = Ti.Facebook;
		    _initialized = true;
		};

		this.requestLogin = function() {
			if (!_initialized) throw new Error("Titanium Facebook module has not yet been initialized, or not yet loaded.");
		    
		    var promise = new Appacitive.Promise();

			Ti.Facebook.addEventListener('login', function(e) {
			    if (e.success) {
			        _accessToken = Ti.Facebook.accessToken;
			        promise.fulfill({
			        	id: e.data.id,
		                access_token: Ti.Facebook.accessToken,
		                expiration_date: Ti.Facebook.expirationDate
			        });
			    } else if (e.error) {
			        promise.reject();
			    } else if (e.cancelled) {
			        promise.reject();
			    }
			});
			Ti.Facebook.authorize();
			return promise;
		};

		this.getCurrentUserInfo = function() {
			if (!_initialized) throw new Error("Titanium Facebook module  has not yet been initialized, or not yet loaded.");
			var promise = new Appacitive.Promise();

			if (Ti.Facebook && _accessToken){
				
				Ti.Facebook.requestWithGraphPath('me', {}, 'GET', function(e) {
				    if (e.success) {
				        promise.fulfill(e);
				    } else {
				        promise.reject("Access token is invalid");
				    }
				});
			} else {
				promise.reject("Either intialize Titanium Facebook module with your appid and appsecret or set accesstoken");
			}
			return promise;
		};

		this.accessToken = function() {
			if (arguments.length === 1) {
				_accessToken = arguments[0];
				if (Ti.Facebook) Ti.Facebook.setAccessToken(_accessToken);
				return this;
			}
			return _accessToken;
		};

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};

		this.logout = function() {
			_accessToken = "";
			Ti.Facebook.logout();
			return new Appacitive.Promise().fulfill();
		};
	};

	Appacitive.Facebook = new _facebook();

})(global);
