(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

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

        this.requestLogin = function(options) {
            options = options || {};
            if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");
            var promise = Appacitive.Promise.buildPromise(options);
            if (!options.scope) options.scope = 'email';
            FB.login(function(response) {
                if (response && response.status === 'connected' && response.authResponse) {
                    _accessToken = response.authResponse.accessToken;
                    promise.fulfill(response.authResponse);
                } else {
                    promise.reject();
                }
            }, options);

            return promise;
        };

        this.getCurrentUserInfo = function(options) {
            if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");
            options = options || {};
            var promise = Appacitive.Promise.buildPromise(options);
            FB.api('/me', function(response) {
                if (response && !response.error) {
                    _accessToken = FB.getAuthResponse().accessToken;
                    promise.fulfill(response);
                } else {
                    promise.reject();
                }
            });

            return promise;
        };

        this.accessToken = function() {
            if (arguments.length === 1) {
                _accessToken = arguments[0];
                return this;
            }
            return _accessToken;
        };

        this.getProfilePictureUrl = function(username) {
            return 'https://graph.facebook.com/' + username + '/picture';
        };

        this.logout = function(options) {
            _accessToken = null;

            options = options || {};
            var promise = Appacitive.Promise.buildPromise(options);

            try {
                FB.logout(function() {
                    Appacitive.Users.logout();
                    promise.fulfill();
                });
            } catch (e) {
                promise.reject(e.message);
            }

            return promise;
        };
    };

    var _nodeFacebook = function() {

        var _accessToken = null;

        this.FB = null;

        var _app_id = null;

        var _app_secret = null;

        var _initialized = false;

        this.initialize = function(options) {
            if (!Facebook) throw new Error("node-facebook SDK needs be loaded before calling initialize.");
            if (!options.appId) throw new Error("Please provide appid");
            if (!options.appSecret) throw new Error("Please provide app secret");

            _app_id = options.appId;
            _app_secret = options.appSecret;
            this.FB = new(require('facebook-node-sdk'))({
                appId: _appId,
                secret: _app_secret
            });
            _initialized = true;
        };

        this.requestLogin = function(accessToken) {
            if (accessToken) _accessToken = accessToken;
            return new Appacitive.Promise().fulfill();
        };

        this.getCurrentUserInfo = function(options) {
            if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");
            options = options || {};

            var promise = Appacitive.Promise.buildPromise(options);

            if (this.FB && _accessToken) {
                this.FB.api('/me', function(err, response) {
                    if (response) {
                        promise.fulfill(response);
                    } else {
                        promise.reject("Access token is invalid");
                    }
                });
            } else {
                promise.reject("Either intialize facebook with your appid and appsecret or set accesstoken");
            }

            return promise;
        };

        this.accessToken = function() {
            if (arguments.length === 1) {
                _accessToken = arguments[0];
                return this;
            }
            return _accessToken;
        };

        this.getProfilePictureUrl = function(username) {
            return 'https://graph.facebook.com/' + username + '/picture';
        };

        this.logout = function() {
            Appacitive.Facebook.accessToken = "";
            return new Appacitive.Promise().fulfill();
        };
    };

    Appacitive.Facebook = Appacitive.runtime.isBrowser ? new _browserFacebook() : new _nodeFacebook();

})(global);
