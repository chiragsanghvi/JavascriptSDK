(function (global) {

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
		}

		this.requestLogin = function(onSuccess, onError) {
			if (!_initialized) throw new Error("Titanium Facebook module has not yet been initialized, or not yet loaded.");
		    onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			Ti.Facebook.addEventListener('login', function(e) {
			    if (e.success) {
			        _accessToken = Ti.Facebook.accessToken;
			        if (typeof onSuccess == 'function') onSuccess({
			        	id: e.data.id,
		                access_token: Ti.Facebook.accessToken,
		                expiration_date: Ti.Facebook.expirationDate
			        });
			    } else if (e.error) {
			        if (typeof onError == 'function') onError();
			    } else if (e.cancelled) {
			        if (typeof onError == 'function') onError();
			    }
			});
			Ti.Facebook.authorize();
		};

		this.getCurrentUserInfo = function(onSuccess, onError) {
			if (!_initialized) throw new Error("Titanium Facebook module  has not yet been initialized, or not yet loaded.");

			if (Ti.Facebook && _accessToken){
				onSuccess = onSuccess || function(){};
				onError = onError || function(){};
				
				Ti.Facebook.requestWithGraphPath('me', {}, 'GET', function(e) {
				    if (e.success) {
				        if (typeof onSuccess == 'function') onSuccess(e);
				    } else {
				        if (typeof onError == 'function') onError("Access token is invalid");
				    }
				});
			} else {
				onError("Either intialize Titanium Facebook module with your appid and appsecret or set accesstoken");
			}
		};

		this.accessToken = function() {
			if (arguments.length == 1) {
				_accessToken = arguments[0];
				if (Ti.Facebook) Ti.Facebook.setAccessToken(_accessToken);
				return this;
			}
			return _accessToken;
		};

		this.getProfilePictureUrl = function(username) {
			return 'https://graph.facebook.com/' + username + '/picture';
		};

		this.logout = function(onSuccess) {
			onSuccess = onSuccess || function() {};
			Appacitive.facebook.accessToken = "";
			_accessToken = "";
			Ti.Facebook.logout();
			if (typeof onSuccess == 'function') onSuccess();
		};
	};

	global.Appacitive.Facebook = _facebook;

})(global);