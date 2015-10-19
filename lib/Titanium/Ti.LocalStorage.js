(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    Appacitive.LocalStorage = new (function() {

        var _localStorage = Ti.App.Properties;

        this.set = function(key, value) {
            value = value || '';
            if (!_type.isString(key)) return this;

            if (_type.isObject(value) || _type.isArray(value)) {
                try {
                    value = JSON.stringify(value);
                } catch (e) {}
            }

            var path = Appacitive.getAppPrefix(key);
            _localStorage.setString(path, value;
            return this;
        };

        this.get = function(key) {
            var promise = new Appacitive.Promise();
            if (!_type.isString(key)) return promise.fulfill(null, key);

            var path = Appacitive.getAppPrefix(key), value = _localStorage.getString(path);

            if (!value) value = null;
            
            // assume it is an object that has been stringified
            if (value && value[0] === "{") {
                try {
                    value = JSON.parse(value);
                } catch (e) {}
            }

            return promise.fulfill(value, key);
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
                    console.log(output);
                    promise.fulfill(output);
                });

                return promise;
            }

            throw new Error("Appacitive.LocalStorage.multiGet requires atleast one argument");
        };

        this.remove = function(key) {
            if (!_type.isString(key)) return this;
            var path = Appacitive.getAppPrefix(key);
            try {
                _localStorage.removeProperty(path);
            } catch (e) {}
        };

    })();

})(global);
