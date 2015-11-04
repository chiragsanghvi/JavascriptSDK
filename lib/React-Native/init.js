var global = {};

(function() {

    "use strict";

    // create the global object
    var _initialize = function() {
        var t;
        if (!global.Appacitive) {
            // create the global object
            // Export the Appacitive object for **CommonJS**, with backwards-compatibility
            // for the old `require()` API. If we're not in CommonJS, add `Appacitive` to the
            // global object.
            
            global.Appacitive = {
                runtime: {
                    isBrowser: true,
                    isReactNative: true
                }
            };
            
        }
    };
    _initialize();

    var Appacitive = global.Appacitive;

    Appacitive.initialize = function(options) {

        options = options || {};

        var promise = new Appacitive.Promise();

        if (Appacitive.Session.initialized) return promise.fulfill(Appacitive);

        if (options.masterKey && options.masterKey.length > 0) Appacitive.Session.setMasterKey(options.masterKey);

        if (!options.apikey || options.apikey.length === 0) {
            if (options.masterKey) options.apikey = options.masterKey;
            else throw new Error("apikey is mandatory");
        }

        if (!options.appId || options.appId.length === 0) throw new Error("appId is mandatory");

        var _onInitialized = function() {
            Appacitive.Session.initialized = true;
            promise.fulfill(Appacitive.User.current());
        };

        Appacitive.Session.setApiKey(options.apikey);
        Appacitive.Session.environment(options.env || 'sandbox');
        Appacitive.useApiKey = true;
        Appacitive.appId = options.appId;
        Appacitive.Session.persistUserToken = options.persistUserToken;

        if (options.debug) Appacitive.config.debug = true;
        if (_type.isFunction(options.apiLog)) Appacitive.logs.apiLog = options.apiLog;
        if (_type.isFunction(options.apiErrorLog)) Appacitive.logs.apiErrorLog = options.apiErrorLog;
        if (_type.isFunction(options.exceptionLog)) Appacitive.logs.exceptionLog = options.exceptionLog;

        if (options.userToken) {

            if (options.expiry == -1) options.expiry = null;
            else if (!options.expiry) options.expiry = 8450000;

            Appacitive.Session.setUserAuthHeader(options.userToken, options.expiry);
            if (options.user) Appacitive.Users.setCurrentUser(options.user);
            _onInitialized();
            
        } else {

            if (Appacitive.runtime.isBrowser) {
                //read usertoken, expiry, expiry-date and user from LocalStorage and set it
                Appacitive.LocalStorage.multiGet('Appacitive-UserToken','Appacitive-UserTokenExpiry','Appacitive-UserTokenDate','Appacitive-User').then(function(keyValues) {
                    var token = keyValues['Appacitive-UserToken'], expiry = keyValues['Appacitive-UserTokenExpiry'], expiryDate = keyValues['Appacitive-User'], user = keyValues['Appacitive-User'];
                    if (token) {
                        if (!expiry) expiry = -1;
                        if (expiryDate && expiry > 0) {
                            if (new Date(expiryDate + (expiry * 1000)) < new Date()) return;
                        }
                        if (expiry == -1) expiry = null;
                        if (user) Appacitive.Users.setCurrentUser(user, token, expiry);
                    }
                    _onInitialized();
                });
            } else {
                _onInitialized();
            }
        }

        return promise;
    };

})(this);
