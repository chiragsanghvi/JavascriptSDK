(function(global) {

    "use strict";

    var ArrayProto = Array.prototype;
    var ObjectProto = Object.prototype;
    var Appacitive = global.Appacitive;



    Appacitive.utils._each = function(obj, iterator, context) {
        if (obj == null) return;
        if (ArrayProto.forEach && obj.forEach === ArrayProto.forEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === {}) return;
            }
        } else {
            for (var key in obj) {
                if (ObjectProto.hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === {}) return;
                }
            }
        }
    };

    // Extend a given object with all the properties in passed-in object(s).
    Appacitive.utils._extend = function(obj) {
        Appacitive.utils._each(ArrayProto.slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    };

    Appacitive.utils._reject = function(col, fn) {
        return col.filter(function(v) {
            return !fn(v);
        });
    };

    // Deep Extend a given object with all the properties in passed-in object(s).
    Appacitive.utils._deepExtend = function(obj) {
        var slice = Array.prototype.slice;

        Appacitive.utils._each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                if (Appacitive.utils._type.isArray(source[prop])) {
                    if (!Appacitive.utils._type.isArray(obj[prop])) obj[prop] = [];
                    obj[prop] = Appacitive.utils._reject(Appacitive.utils._extend(obj[prop], source[prop]), function(item) {
                        return Appacitive.utils._type.isNull(item);
                    });
                } else if (Appacitive.utils._type.isObject(source[prop]) && (!(source[prop] instanceof Appacitive.Object)) && (!(source[prop] instanceof Appacitive.Connection)) && (!(source[prop] instanceof Appacitive.GeoCoord))) {
                    if (!Appacitive.utils._type.isObject(obj[prop])) {
                        obj[prop] = {};
                    }
                    obj[prop] = Appacitive.utils._extend(obj[prop], source[prop]);
                } else {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    };

    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var extend = function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (Appacitive.utils._type.isObject(protoProps) && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function() {
                return parent.apply(this, arguments);
            };
        }

        // Add static properties to the constructor function, if supplied.
        Appacitive.utils._extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function() {
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) Appacitive.utils._extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    };

    Appacitive.utils.classExtend = function(parent, protoProps, staticProps) {
        return extend.apply(parent, [protoProps, staticProps]);
    };

    Appacitive.utils._result = function(object, property, fallback) {
        var value = object == null ? void 0 : object[property];
        if (value === void 0) {
            value = fallback;
        }
        return Appacitive.utils._type.isFunction(value) ? value.call(object) : value;
    };

    Appacitive.clone = Appacitive.utils._clone = function(obj) {
        if (!Appacitive.utils.isObject(obj)) return obj;
        return Appacitive.utils.isArray(obj) ? obj.slice() : Appacitive.utils._extend({}, obj);
    };

})(global);
