(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    Appacitive.Facebook = new (function() {

        var _accessToken = null;

        this.FB = null;

        var _app_id = null;

        var _app_secret = null;

        var _initialized = false;

        this.initialize = function(options) {
            this.FB = require('facebook-node-withfetch');
            _initialized = true;
        };

        this.requestLogin = function(accessToken) {
            if (accessToken) {
                _accessToken = accessToken;
                this.FB.setAccessToken(_accessToken);
            }
            return new Appacitive.Promise().fulfill();
        };

        this.getCurrentUserInfo = function(options) {
            if (!_initialized) throw new Error("Either facebook sdk has not yet been initialized, or not yet loaded.");
            options = options || {};

            var promise = Appacitive.Promise.buildPromise(options);

            if (this.FB && _accessToken) {
                this.FB.api('/me', {} , function(response) {

                    if (!res || res.error) {
                       promise.reject(res.error || "Access token is invalid");
                       return;
                    }
                    promise.fulfill(response);
                });
            } else {
                promise.reject("Either initialize facebook with your appid and appsecret or set accesstoken");
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

        this.getProfilePictureUrl = function(id) {
            return 'https://graph.facebook.com/' + id + '/picture';
        };

        this.logout = function() {
            _accessToken = "";
            this.FB.setAccessToken("");
            return new Appacitive.Promise().fulfill();
        };
    })();

})(global);