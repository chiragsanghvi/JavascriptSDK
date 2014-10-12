var ArrayProto = Array.prototype;
var ObjectProto = Object.prototype;

var each = function(obj, iterator, context) {
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
var _extend = function(obj) {
    each(ArrayProto.slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
};

var _reject = function(col, fn) {
  return col.filter(function(v) {
    return !fn(v);
  });
};

// Deep Extend a given object with all the properties in passed-in object(s).
var _deepExtend = function(obj) {
  var slice = Array.prototype.slice;

  each(slice.call(arguments, 1), function(source) {
    for (var prop in source) {
      if (_type.isArray(source[prop])) {
        if (!_type.isArray(obj[prop]))  obj[prop] = [];
        obj[prop] = _reject(_extend(obj[prop], source[prop]), function (item) { return _type.isNull(item);});
      } else if (_type.isObject(source[prop]) && (!(source[prop] instanceof Appacitive.Object)) && (!(source[prop] instanceof Appacitive.Connection)) && (!(source[prop] instanceof Appacitive.GeoCoord))) {
        if (!_type.isObject(obj[prop])){
          obj[prop] = {};
        } 
        obj[prop] = _extend(obj[prop], source[prop]);
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
    if (_type.isObject(protoProps) && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ 
        return parent.apply(this, arguments); 
      };
    }

    // Add static properties to the constructor function, if supplied.
    _extend(child, parent, staticProps);
    
    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

(function (global) {

  "use strict";

  global.Appacitive._extend = function(parent, protoProps, staticProps) {
    return extend.apply(parent, [protoProps, staticProps]);
  };

})(global);
