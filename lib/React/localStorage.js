var _reactNative = require('react-native');

(function(global) {

    'use strict';

    var AsyncStorage = _reactNative.AsyncStorage;

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    Appacitive.LocalStorage = new (function() {

        this.set = function(key, value) {
            value = value || '';
            if (!_type.isString(key)) return this;
            var path = Appacitive.getAppPrefix(key);
            AsyncStorage.setItem(path, value);
            return this;
        };

        this.get = function(key) {
            var promise = new Appacitive.Promise();
            if (!_type.isString(key)) return promise.fulfill(null, key);

            var promise = new Appacitive.Promise(), path = Appacitive.getAppPrefix(key);

            AsyncStorage.getItem(path, function (err, value) {
                if (err) {
                    promise.fulfill(null, key);
                } else {
                    if (!value) value = null;
                    // assume it is an object that has been stringified
                    if (value && value[0] === "{") {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {}
                    }
                    promise.fulfill(value, key);
                }
            });

            return promise;
        };

        this.multiGet = function() {
            var promise = new Appacitive.Promise(), self = this, keys = Array.prototype.slice.call(arguments)
            if (arguments.length > 1) {
                var output = {}, promises = [];
                keys.forEach(function(key) {
                    if (Array.isArray(key)) key = key.join();
                    key.replace(/\s/g, '').split(',').forEach(function(k) {
                        var p = self.get(key);
                        p.then(function(value, key) { output[key] = value });
                        promises.push(p);
                    });
                });
                Appacitive.Promise.when(promises).then(function() {
                    promise.fulfill(output);
                });

                return promise;
            }

            throw new Error("Appacitive.LocalStorage.multiGet requires atleast one argument");
        };

        this.remove = function(key) {
            if (!_type.isString(key)) return this;
            var path = Appacitive.getAppPrefix(key);
            AsyncStorage.removeItem(path);
            return this;
        };

    })();

})(global);
