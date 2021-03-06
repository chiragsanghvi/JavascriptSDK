(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    /**
     * @constructor
     */
    var SessionManager = function() {

        /**
         * @constructor
         */

        this.initialized = false;

        var _sessionRequest = function() {
            this.apikey = '';
            this.isnonsliding = false;
            this.usagecount = -1;
            this.windowtime = 240;
        };

        var _sessionKey = null,
            _appName = null,
            _options = null,
            _apikey = null,
            _authToken = null,
            authEnabled = false,
            _masterKey;

        this.useApiKey = true;

        this.useMasterKey = false;

        this.onSessionCreated = function() {};

        this.recreate = function(options) {
            return Appacitive.Session.create(options);
        };

        this.create = function(options) {

            if (!this.initialized) throw new Error("Initialize Appacitive SDK");

            // create the session
            var _sRequest = new _sessionRequest();

            _sRequest.apikey = _apikey;

            var request = new Appacitive._Request({
                method: 'PUT',
                type: 'application',
                op: 'getSessionCreateUrl',
                options: options,
                data: _sRequest,
                onSuccess: function(data) {
                    _sessionKey = data.session.sessionkey;
                    Appacitive.Session.useApiKey = false;
                    request.promise.fulfill(data);
                    Appacitive.Session.onSessionCreated();
                }
            });
            return request.send();
        };

        Appacitive.http.addProcessor({
            pre: function(request) {
                request.options = request.options || {};
                if (Appacitive.Session.useApiKey) {
                    var key = _apikey;
                    if ((request.options.useMasterKey || (Appacitive.useMasterKey && !request.options.useMasterKey)) && _type.isString(_masterKey) && _masterKey.length > 0) {
                        key = _masterKey;
                    } else if (_type.isString(request.options.apikey)) {
                        key = request.options.apikey;
                    }
                    request.headers.push({
                        key: 'ak',
                        value: key
                    });
                } else {
                    request.headers.push({
                        key: 'as',
                        value: _sessionKey
                    });
                }

                var userToken = (_type.isString(request.options.userToken) && request.options.userToken.length > 0) ? request.options.userToken : false;

                if (authEnabled === true || userToken) {
                    var ind = -1;
                    var userAuthHeader = request.headers.filter(function(uah, i) {
                        if (uah.key == 'ut') {
                            ind = i;
                            return true;
                        }
                        return false;
                    });

                    if (request.options.ignoreUserToken) {
                        if (ind != -1) request.headers.splice(ind, 1);
                    } else {
                        var token = userToken || _authToken;

                        if (userAuthHeader.length == 1) {
                            request.headers.forEach(function(uah) {
                                if (uah.key == 'ut') {
                                    uah.value = token;
                                }
                            });
                        } else {
                            request.headers.push({
                                key: 'ut',
                                value: token
                            });
                        }
                    }
                }
            }
        });

        this.setUserAuthHeader = function(authToken, expiry, doNotSetInStorage) {
            try {
                if (authToken) {
                    authEnabled = true;
                    _authToken = authToken;
                    if (!doNotSetInStorage) {
                        if (!expiry) expiry = -1;
                        if (expiry == -1) expiry = null;

                        Appacitive.LocalStorage.set('Appacitive-UserToken', authToken);
                        Appacitive.LocalStorage.set('Appacitive-UserTokenExpiry', expiry);
                        Appacitive.LocalStorage.set('Appacitive-UserTokenDate', new Date().getTime());
                    }
                }
            } catch (e) {}
        };

        this.incrementExpiry = function() {
            try {
                if (Appacitive.runtime.isBrowser && authEnabled) {
                    Appacitive.LocalStorage.set('Appacitive-UserTokenDate', new Date().getTime());
                }
            } catch (e) {}
        };

        this.removeUserAuthHeader = function(makeApiCall, options) {

            var promise = Appacitive.Promise.buildPromise(options);

            if (!makeApiCall) Appacitive.User.trigger('logout', {});

            Appacitive.LocalStorage.remove('Appacitive-User');
            if (_authToken && makeApiCall) {
                try {

                    var _request = new Appacitive.HttpRequest(options);
                    _request.url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.user.getInvalidateTokenUrl(_authToken);
                    _request.method = 'POST';
                    _request.data = {};
                    _request.type = 'user';
                    _request.options = options;
                    _request.description = 'InvalidateToken user';
                    _request.onSuccess = _request.onError = function() {
                        authEnabled = false;
                        _authToken = null;
                        Appacitive.User.trigger('logout', {});
                        Appacitive.LocalStorage.remove('Appacitive-UserToken');
                        Appacitive.LocalStorage.remove('Appacitive-UserTokenExpiry');
                        Appacitive.LocalStorage.remove('Appacitive-UserTokenDate');
                        promise.fulfill();
                    };

                    Appacitive.http.send(_request);

                    return promise;
                } catch (e) {}
            } else {
                authEnabled = false;
                _authToken = null;
                Appacitive.LocalStorage.remove('Appacitive-UserToken');
                Appacitive.LocalStorage.remove('Appacitive-UserTokenExpiry');
                Appacitive.LocalStorage.remove('Appacitive-UserTokenDate');
                return promise.fulfill();
            }
        };

        this.isSessionValid = function(response) {
            if (response.status) {
                if (response.status.code) {
                    if (response.status.code == '420' || response.status.code == '19027' || response.status.code == '19002') {
                        return {
                            status: false,
                            isSession: (response.status.code == '19027' || response.status.code == '420') ? true : false
                        };
                    }
                }
            } else if (response.code) {
                if (response.code == '420' || response.code == '19027' || response.code == '19002') {
                    return {
                        status: false,
                        isSession: (response.code == '19027' || response.code == '420') ? true : false
                    };
                }
            }
            return {
                status: true
            };
        };

        this.resetSession = function() {
            _sessionKey = null;
            this.useApiKey = true;
        };

        this.get = function() {
            return _sessionKey;
        };

        this.setSession = function(session) {
            if (session) {
                _sessionKey = session;
                this.useApiKey = false;
            }
        };

        this.setApiKey = function(apikey) {
            if (apikey) {
                _apikey = apikey;
                this.useApiKey = true;
            }
        };

        this.setMasterKey = function(key) {
            _masterKey = key;
        };

        this.reset = function() {
            this.removeUserAuthHeader();
            _sessionKey = null, _appName = null, _options = null, _apikey = null, _authToken = null, authEnabled = false, _masterKey = null;
            this.initialized = false;
            this.useApiKey = false;
            this.useMasterKey = false;
        };

        // the name of the environment, simple public property
        var _env = 'sandbox';
        this.environment = function() {
            if (arguments.length == 1) {
                var value = arguments[0];
                if (value != 'sandbox' && value != 'live') value = 'sandbox';
                _env = value;
            }
            return _env;
        };
    };

    Appacitive.Session = new SessionManager();

    Appacitive.getAppPrefix = function(str) {
        return Appacitive.Session.environment() + '/' + Appacitive.appId + '/' + str;
    };

    Appacitive.ping = function(options) {
        if (!Appacitive.Session.initialized) throw new Error("Initialize Appacitive SDK");

        var request = new Appacitive._Request({
            method: 'GET',
            type: 'ping',
            op: 'getPingUrl',
            options: options,
            onSuccess: function(data) {
                return request.promise.fulfill(data.status);
            }
        });
        return request.send();
    };

    Appacitive.reset = function() {
        Appacitive.Session.reset();
    };

}(global));


// compulsory http plugin
// attaches the appacitive environment headers and other event plugins
(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;

    if (!Appacitive) return;
    if (!Appacitive.http) return;

    Appacitive.http.addProcessor({
        pre: function(req) {
            var env = Appacitive.Session.environment()
            req.options = req.options || {};
            if (_type.isString(req.options.env)) env = req.options.env;
            req.headers.push({
                key: 'e',
                value: env
            });
        }
    });


    Appacitive.Events.mixin(Appacitive);

})(global);
