(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    Appacitive.Facebook = new (function() {

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

        this.getProfilePictureUrl = function(id) {
            return 'https://graph.facebook.com/' + id + '/picture';
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
    })();

})(global);
