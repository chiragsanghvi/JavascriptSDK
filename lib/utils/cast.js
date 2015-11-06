(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;

    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    var __privateMeta = {
        "__utcdatecreated": "datetime",
        "__utclastupdateddate": "datetime"
    };

    var isString = function(val) {
        return (_type.isString(val) || _type.isNumber(val) || _type.isBoolean(val));
    };

    var isGeocode = function(val) {
        return (val instanceof Appacitive.GeoCoord);
    };

    var getMeta = function(attrs) {
        attrs = attrs || {};
        var meta = {};
        for (var m in attrs.__meta) {
            attrs.__meta[m].forEach(function(p) {
                meta[p] = m;
            });
        }

        return meta;
    };

    var _types = {
        "integer": function(value) {
            if (value) {
                var res = parseInt(value);
                if (!isNaN(res)) return res;
            }
            return value;
        },
        "decimal": function(value) {
            if (value) {
                var res = parseFloat(value);
                if (!isNaN(res)) return res;
            }
            return value;
        },
        "boolean": function(value) {
            if (_type.isBoolean(value)) return value;
            if (value !== undefined && value !== null && (value.toString().toLowerCase() === 'true' || value === true || value > 0)) return true;
            return false;
        },
        "date": function(value) {
            if (_type.isDate(value)) return value;
            if (value) {
                var res = Appacitive.Date.parseISODate(value);
                if (res) return res;
            }
            return value;
        },
        "datetime": function(value) {
            if (_type.isDate(value)) return value;
            if (value) {
                var res = Appacitive.Date.parseISODate(value);
                if (res) return res;
            }
            return value;
        },
        "time": function(value) {
            if (_type.isDate(value)) return value;
            if (value) {
                var res = Appacitive.Date.parseISOTime(value);
                if (res) return res;
            }
            return value;
        },
        "string": function(value) {
            if (value) return value.toString();
            return value;
        },
        "geocode": function(value) {

            if (isGeocode(value)) return value;

            // value is not string or its length is 0, return false
            if (!_type.isString(value) || value.trim().length == 0) return false;

            // Split value string by ,
            var split = value.split(',');

            // split length is not equal to 2 so return false
            if (split.length !== 2) return false;

            // validate the value
            return new Appacitive.GeoCoord(split[0], split[1]);
        }
    };

    _types["long"] = _types["integer"];
    _types["geography"] = _types["geocode"];
    _types["text"] = _types["string"];
    _types["bool"] = _types["boolean"];

    Appacitive.utils._cast = _types;
    Appacitive.utils._cast.isString = isString;
    Appacitive.utils._cast.isGeocode = isGeocode;

    var encode = function(value) {
        if (_type.isNullOrUndefined(value)) return null;
        else if (isString(value)) return (value + '');
        else if (_type.isDate(value)) return Appacitive.Date.toISOString(value);
        else if (_type.isObject(value)) {
            if (isGeocode(value)) return value.toString();
            return (value.getObject ? value.getObject() : value);
        }
        return value;
    };

    Appacitive.utils._encode = function(attrs) {
        var object = {};
        for (var key in attrs) {
            var value = attrs[key];
            if (_type.isArray(value)) {
                object[key] = [];
                value.forEach(function(v) {
                    var val = encode(v);
                    if (val) object[key].push(val);
                });
            } else {
                object[key] = encode(attrs[key]);
            }
        }
        return object;
    };

    Appacitive.utils._decode = function(attrs) {
        var object = {},
            meta = _extend({}, __privateMeta, getMeta(attrs));
        delete attrs.__meta;
        for (var key in attrs) {
            if (_type.isArray(attrs[key])) {
                object[key] = [];
                attrs[key].forEach(function(v) {
                    var val = (meta[key]) ? _types[meta[key]](v) : v;
                    object[key].push(val);
                });
            } else if (_type.isString(attrs[key])) {
                object[key] = (meta[key]) ? _types[meta[key]](attrs[key]) : attrs[key];
            } else {
                object[key] = attrs[key];
            }
        }
        return object;
    };

})(global);
