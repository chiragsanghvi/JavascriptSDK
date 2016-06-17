(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;

    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;
    var _types = Appacitive.utils._cast;

    //Fields on which set operation is allowed
    var _allowObjectSetOperations = ["__link", "__endpointa", "__endpointb"];

    //Fileds to be ignored while update operation
    var _ignoreTheseFields = ["__id", "__revision", "__endpointa", "__endpointb", "__createdby", "__lastmodifiedby", "__type", "__relationtype", "__typeid", "__relationid", "__utcdatecreated", "__utclastupdateddate", "__tags", "__authType", "__link", "__acls", "__meta"];

    var isEncodable = function(val) {
        return (_types.isString(val) || _type.isDate(val) || _types.isGeocode(val));
    };

    //base object for objects and connections
    /**
     * @constructor
     **/
    var _BaseObject = function(objectOptions, optns) {

        this._snapshot = {};

        optns = optns || {};
        
        objectOptions = objectOptions || {};

        this.objectOptions = _deepExtend({}, objectOptions);

        this.meta = {};

        //set default meta
        this.objectOptions.__meta = _extend(this.meta, this.objectOptions.__meta);

        if (optns && optns.parse) this.objectOptions = this.parse(this.objectOptions);

        this.defaults = Appacitive.utils._result(this, 'defaults')
        
        if (_type.isObject(this.defaults) && !optns.setSnapShot) this.objectOptions = _deepExtend({}, this._defaults, this.objectOptions);

        if (optns && optns.collection) this.collection = optns.collection;

        this.objectOptions = Appacitive.utils._decode(objectOptions);

        var that = this;

        //Set client id
        this.cid = parseInt(Math.random() * 100000000, 10);

        // Set id attribute
        this.idAttribute = '__id';

        //atomic properties
        this._atomicProps = {};

        //mutlivalued properties
        this._multivaluedProps = {};

        //list of properties on whom set operations performed
        this._setOps = {};

        var raw = {};
        this._copy(this.objectOptions, raw);
        var object = raw;

        //will be used in case of creating an appacitive object for internal purpose
        if (optns.setSnapShot) this._copy(object, this._snapshot);

        if (!this._snapshot[this.idAttribute] && raw[this.idAttribute]) this._snapshot[this.idAttribute] = raw[this.idAttribute];

        // Set id property
        this.id = this._snapshot[this.idAttribute];

        //Check whether __type or __relationtype is mentioned and set type property
        if (raw.__type) {
            raw.__type = raw.__type.toLowerCase();
            this.entityType = 'type';
            this.type = 'object';
            this.className = raw.__type;
            this.base = Appacitive.Object.prototype;

        } else if (raw.__relationtype) {
            raw.__relationtype = raw.__relationtype.toLowerCase();
            this.entityType = 'relation';
            this.type = 'connection';
            this.className = raw.__relationtype;
            this.base = Appacitive.Connection.prototype;
        }


        if (this.type == 'object') {
            this._destroyWithConnections = function(options) {
                return this.destroy(_extend({
                    deleteConnections: true
                }, options));
            };
        }

        //attributes
        if (!object.__attributes) object.__attributes = {};
        if (!this._snapshot.__attributes) this._snapshot.__attributes = {};

        //tags
        this._removeTags = [];
        if (!object.__tags) object.__tags = [];
        if (!this._snapshot.__tags) this._snapshot.__tags = [];

        //set attributes property
        this.attributes = this._object = object;

        //fields to be returned
        this._fields = '';

        //Set private property value in main object
        this._mergePrivateFields(this.attributes);

    };

    // Define the Collection's inheritable methods.
    _extend(_BaseObject.prototype, {

        //Copy properties from source to destination object
        _copy: function(src, des) {
            src.__meta = _extend(this.meta, src.__meta);
            this.meta = src.__meta;
            this._mergePrivateFields(src);
            var obj = Appacitive.utils._decode(src);
            for (var property in obj) {

                if (property == this.idAttribute) this.id = obj[property];

                if (this._atomicProps[property]) delete this._atomicProps[property];
                if (this._multivaluedProps[property]) delete this._multivaluedProps[property];
                if (this._setOps[property]) delete this._setOps[property];

                if (isEncodable(obj[property])) des[property] = obj[property];
                else if (_type.isObject(obj[property])) des[property] = _deepExtend({}, des[property], obj[property]);
                else if (_type.isArray(obj[property])) {

                    des[property] = [];

                    obj[property].forEach(function(v) {
                        if (isEncodable(v) || property == '__link') des[property].push(v);
                        else throw new Error("Multivalued property cannot add object or array as property of object");
                    });

                } else {
                    des[property] = obj[property];
                }
            }
        },

        _mergePrivateFields : function(attrs, del) {
            var privateProps = ["id", "__id", "__utclastupdateddate", "__utcdatecreated", "__createdby", "__updatedby"];
            var map = {
                "id": "id",
                "__id": "id",
                "__utclastupdateddate": "lastUpdatedAt",
                "__utcdatecreated": "createdAt",
                "__createdby": "createdBy",
                "__updatedby": "lastUpdatedBy"
            };
            var that = this;
            privateProps.forEach(function(prop) {
                if (attrs[prop]) {
                    if ((prop === "__utcdatecreated" || prop === "__utclastupdateddate") && !_type.isDate(attrs[prop])) {
                        that[map[prop]] = Appacitive.Date.parseISODate(attrs[prop]);
                    } else {
                        that[map[prop]] = attrs[prop];
                    }

                    if (del) delete attrs[prop];
                }
            });
        },

        // parse api output to get error info
        _getOutpuStatus : function(data) {
            data = data || {};
            data.message = data.message || 'Server error';
            data.code = data.code || '500';
            return data;
        },

        // converts object to json representation for data transfer
        getObject : function() {
            var obj = Appacitive.utils._encode(_deepExtend({
                __meta: this.meta
            }, this._object));

            if (this.type == 'connection') {
                obj.__endpointa = this._object.__endpointa.toJSON();
                obj.__endpointb = this._object.__endpointb.toJSON();
            }

            if (this.hasOwnProperty("id")) obj.__id = this.id;
            return obj;
        },

        // converts object to json representation but not in an encoded form
        toJSON: function(recursive) {
            if (recursive && this.type == 'object') {
                var parseChildren = function(root) {
                    var objects = [];
                    root.forEach(function(obj) {
                        var tmp = obj.toJSON();
                        if (obj.children && !Object.isEmpty(obj.children)) {
                            tmp.children = {};
                            for (var c in obj.children) {
                                if (_type.isArray(obj.children[c])) {
                                    tmp[c] = parseChildren(obj.children[c]);
                                } else {
                                    tmp[c] = parseChildren([obj.children[c]])[0];
                                }
                                tmp.children[c] = tmp[c];
                            }
                        }
                        if (obj.connection) tmp.__connection = obj.connection.toJSON();
                        objects.push(tmp);
                    }); 
                    return objects;
                };
                return parseChildren([this])[0];
            } else {
                var obj = _deepExtend({
                    __meta: this.meta
                }, this._object);

                if (this.type == 'connection') {
                    this._object.__endpointa = this._object.__endpointa.toJSON();
                    this._object.__endpointb = this._object.__endpointb.toJSON();
                }
                if (this.hasOwnProperty("id") && this.id) obj.__id = this.id;
                return obj;
            }

        },

        // Returns all properties of this object
        properties: function() {
            var properties = _deepExtend({}, this.attributes);
            delete properties.__attributes;
            delete properties.__tags;
            return properties;
        },

        // accessor function for the object's attributes
        attr: function() {
            if (arguments.length === 0) {
                if (!this._object.__attributes) this._object.__attributes = {};
                return this._object.__attributes;
            } else if (arguments.length === 1) {
                if (!this._object.__attributes) this._object.__attributes = {};
                return this._object.__attributes[arguments[0]];
            } else if (arguments.length === 2) {
                if (!_type.isString(arguments[1]) && arguments[1] !== null)
                    throw new Error('only string values can be stored in attributes.');
                if (!this._object.__attributes) this._object.__attributes = {};
                this._object.__attributes[arguments[0]] = arguments[1];
            } else throw new Error('.attr() called with an incorrect number of arguments. 0, 1, 2 are supported.');

            this.triggerChangeEvent('__attributes');

            return this._object.__attributes;
        },

        //accessor function to get changed attributes
        getChangedAttributes: function() {
            if (!this._object.__attributes) return undefined;
            if (!this._snapshot.__attributes) return this._object.__attributes;

            var isDirty = false;
            var changeSet = JSON.parse(JSON.stringify(this._snapshot.__attributes));
            for (var property in this._object.__attributes) {
                if (this._object.__attributes[property] == null || this._object.__attributes[property] == undefined) {
                    changeSet[property] = null;
                    isDirty = true;
                } else if (this._object.__attributes[property] != this._snapshot.__attributes[property]) {
                    changeSet[property] = this._object.__attributes[property];
                    isDirty = true;
                } else if (this._object.__attributes[property] == this._snapshot.__attributes[property]) {
                    delete changeSet[property];
                }
            }
            if (!isDirty) return undefined;
            return changeSet;
        },

        // accessor function for the object's aggregates
        aggregate: function() {
            var aggregates = {};
            for (var key in this._object) {
                if (!this._object.hasOwnProperty(key)) return;
                if (key[0] == '$') {
                    aggregates[key.substring(1)] = this._object[key];
                }
            }
            if (arguments.length === 0) return aggregates;
            else if (arguments.length == 1) return aggregates[arguments[0]];
            else throw new Error('.aggregates() called with an incorrect number of arguments. 0, and 1 are supported.');
        },

        tags: function() {
            if (!this._object.__tags) return [];
            return this._object.__tags;
        },

        addTag: function(tag) {
            if (!tag || !_type.isString(tag) || !tag.length) return this;

            if (!this._object.__tags) this._object.__tags = [];

            this._object.__tags.push(tag);
            this._object.__tags = Array.distinct(this._object.__tags);

            if (!_removeTags || !_removeTags.length) {
                this.triggerChangeEvent('__tags');
                return this;
            }

            var index = _removeTags.indexOf(tag);
            if (index != -1) _removeTags.splice(index, 1);

            this.triggerChangeEvent('__tags');

            return this;
        },

        removeTag: function(tag) {
            if (!tag || !_type.isString(tag) || !tag.length) return this;
            //tag = tag.toLowerCase();
            this._removeTags.push(tag);
            this._removeTags = Array.distinct(this._removeTags);

            if (!this._object.__tags || !this._object.__tags.length) {
                this.triggerChangeEvent('__tags');
                return this;
            }

            var index = this._object.__tags.indexOf(tag);
            if (index != -1) this._object.__tags.splice(index, 1);

            this.triggerChangeEvent('__tags');

            return this;
        },

        getChangedTags: function() {
            if (!this._object.__tags) return undefined;
            if (!this._snapshot.__tags) return this._object.__tags;

            var _tags = [], that = this;
            this._object.__tags.forEach(function(a) {
                if (that._snapshot.__tags.indexOf(a) == -1)
                    _tags.push(a);
            });
            return _tags.length > 0 ? _tags : undefined;
        },

        getRemovedTags: function() {
            return this._removetags;
        },

        _setMutliItems: function(key, value, op, options) {

            if (!key || !_type.isString(key) || key.length === 0 || key.trim().indexOf('__') == 0 || key.trim().indexOf('$') === 0 || value == undefined || value == null) return this;

            key = key.toLowerCase();

            var that = this;

            try {

                var addItem = function(item) {
                    var val = item;
                    if (!isEncodable(val)) throw new Error("Multivalued property cannot have values of property as an object");

                    if (that._object[key] && _type.isArray(that._object[key])) {

                        if (op == 'additems') {
                            that._object[key].push(val);
                        } else if (op == 'adduniqueitems') {
                            var index = -1;

                            that._object[key].find(function(o, i) {
                                if (_type.isEqual(o, val)) {
                                    index = i;
                                    return true;
                                }
                                return false;
                            });

                            if (index == -1) that._object[key].push(val);
                        } else if (op == 'removeitems') {
                            that._object[key].removeAll(val);
                        }
                    } else {
                        if (op == 'removeitems') that._object[key] = [];
                        else that._object[key] = [val];
                    }

                    if (!that._multivaluedProps[key]) {
                        that._multivaluedProps[key] = {
                            additems: [],
                            adduniqueitems: [],
                            removeitems: []
                        };
                    }

                    that._multivaluedProps[key][op].push(val);
                };

                if (_type.isArray(value)) {
                    value.forEach(function(v) {
                        addItem(v);
                    });
                } else {
                    addItem(value);
                }

                this.triggerChangeEvent(key, options);

            } catch (e) {
                throw new Error("Unable to add item to " + key);
            }

            return this;
        },

        add: function(key, value, options) {
            return this._setMutliItems(key, value, 'additems', options);
        },

        addUnique: function(key, value, options) {
            return this._setMutliItems(key, value, 'adduniqueitems', options);
        },

        remove: function(key, value, options) {
            return this._setMutliItems(key, value, 'removeitems', options);
        },

        _hasChanged: function(property, prevValue, currValue, isInternal) {
            var changed = undefined;

            if (!_type.isEqual(currValue, prevValue)) {
                if (property == '__tags') {
                    var changedTags = this.getChangedTags();
                    if (changedTags && changedTags.length > 0) changed = changedTags;
                } else if (property == '__attributes') {
                    var attrs = this.getChangedAttributes();
                    if (!Object.isEmpty(attrs)) changed = attrs;
                } else {
                    if (_type.isArray(currValue)) {
                        if (this._multivaluedProps[property] && !this._setOps[property]) {
                            if (isInternal) {
                                changed = this._multivaluedProps[property];
                            } else {
                                changed = currValue;
                            }
                        } else if (!currValue.equals(prevValue)) {
                            changed = currValue;
                        }
                    } else if (this._atomicProps[property] && !this._setOps[property]) {
                        if (isInternal) {
                            changed = {
                                incrementby: this._atomicProps[property].value
                            };
                        } else {
                            changed = currValue;
                        }
                    } else {
                        changed = currValue;
                    }
                }
            }

            return changed;
        },

        _getChanged: function(isInternal) {
            var isDirty = false;
            var changeSet = _deepExtend({}, this._snapshot);

            for (var p in changeSet) {
                if (p[0] == '$') delete changeSet[p];
            }

            for (var property in this._object) {
                var changed = this._hasChanged(property, changeSet[property], this._object[property], isInternal);

                if (changed === undefined) {
                    delete changeSet[property];
                } else {
                    isDirty = true;
                    changeSet[property] = changed;
                }
            }

            try {
                _ignoreTheseFields.forEach(function(c) {
                    if (changeSet[c]) delete changeSet[c];
                });
            } catch (e) {}

            if (isInternal) changeSet = Appacitive.utils._encode(changeSet);

            var changedTags = this.getChangedTags();
            if (isInternal) {
                if (changedTags && changedTags.length > 0) {
                    changeSet["__addtags"] = changedTags;
                    isDirty = true;
                }
                if (this._removeTags && this._removeTags.length > 0) {
                    changeSet["__removetags"] = this._removeTags;
                    isDirty = true;
                }
            } else {
                if (changedTags && changedTags.length > 0) {
                    changeSet["__tags"] = changedTags;
                    isDirty = true;
                }
            }

            var attrs = this.getChangedAttributes();
            if (attrs && !Object.isEmpty(attrs)) {
                changeSet["__attributes"] = attrs;
                isDirty = true;
            } else delete changeSet["__attributes"];

            if (this.type == 'object' && this._aclFactory) {
                var acls = this._aclFactory.getChanged();
                if (acls) {
                    isDirty = true;
                    changeSet['__acls'] = acls;
                }
            }

            if (isDirty && !Object.isEmpty(changeSet)) return changeSet;
            return false;
        },

        changed: function() {
            if (this.isNew()) return this.toJSON();
            return this._getChanged();
        },

        hasChanged: function() {
            if (this.isNew()) return true;

            if (arguments.length === 0)
                return Object.isEmpty(this._getChanged(true)) ? false : true;
            else if (arguments.length == 1 && _type.isString(arguments[0]) && arguments[0].length > 0)
                return (this._hasChanged(arguments[0], this._snapshot[arguments[0]], this._object[arguments[0]]) == undefined) ? false : true;

            return false;
        },

        changedAttributes: function() {
            if (this.isNew()) return this.toJSON();

            if (arguments.length === 0) {
                return this._getChanged();
            } else if (arguments.length == 1 && _type.isArray(arguments[0]) && arguments[0].length) {
                var attrs = {}, that = this;
                arguments[0].forEach(function(c) {
                    var value = that._hasChanged(c, that._snapshot[c], that._object[c]);
                    if (value != undefined) attrs.push(value);
                });
                return attrs;
            }
            return false;
        },

        previous: function() {
            if (this.isNew()) return null;

            if (arguments.length == 1 && _type.isString(arguments[0]) && arguments[0].length) {
                return this._snapshot[arguments[0]];
            }
            return null;
        },

        previousAttributes: function() {
            if (this.isNew()) return null;
            return _extend({}, this._snapshot);
        },

        fields: function() {
            if (arguments.length == 1) {
                var value = arguments[0];
                if (_type.isString(value)) this._fields = value;
                else if (_type.isArray(value)) this._fields = value.join(',');
                return this;
            } else {
                return this._fields;
            }
        },

        get: function(key, type) {
            if (key) {
                if (type && _types[type.toLowerCase()]) {
                    if (_types[type.toLowerCase()]) {
                        var res = _types[type.toLowerCase()](this._object[key]);
                        return res;
                    } else {
                        throw new Error('Invalid cast-type "' + type + '"" provided for get "' + key + '"');
                    }
                }
                return this._object[key];
            }
        },

        tryGet: function(key, value, type) {
            var res = this.get(key, type);
            if (res !== undefined) return res;
            return value;
        },

        triggerChangeEvent: function(key, options) {
            if (options && !options.silent) {
                var changed = this._hasChanged(key, this._snapshot[key], this._object[key]);

                if (changed[key] != undefined || (_ignoreTheseFields.indexOf(key) != -1)) {
                    var value = changed[key] || this._object[key];
                    // Trigger all relevant attribute changes.
                    this.trigger('change:' + key, this, value, {});
                    if (!options.ignoreChange) this.trigger('change', this, options);
                }
            }
        },

        triggerDestroy: function(opts) {
            if (opts && !opts.silent) this.trigger('destroy', this, this.collection, opts);
        },

        _triggerError: function(options, status) {
            if (!options.silent) this.trigger('error', this, status, options);
        },

        _set: function(key, value, options) {

            if (!key || !_type.isString(key) || key.length === 0 || key.trim().indexOf('$') === 0) return this;

            options = options || {};

            var oType = options.dataType, that = this;

            key = key.toLowerCase();

            try {

                if (_type.isNullOrUndefined(value)) {
                    this._object[key] = null;
                } else if (isEncodable(value)) {
                    this._object[key] = value;
                } else if (_type.isObject(value)) {
                    if (_allowObjectSetOperations.indexOf(key) !== -1) this._object[key] = value;
                    else throw new Error("Property cannot have value as an object");
                } else if (_type.isArray(value)) {
                    this._object[key] = [];

                    value.forEach(function(v) {
                        if (isEncodable(v)) that._object[key].push(v);
                        else throw new Error("Multivalued property cannot have values of property as an object");
                    });
                }

                delete this._atomicProps[key];
                delete this._multivaluedProps[key];
                delete this._setOps[key];

                if (!_type.isEqual(this._object[key], this._snapshot[key])) this._setOps[key] = true;

                if (key == this.idAttribute) this.id = value;

                return this;
            } catch (e) {
                throw new Error("Unable to set " + key);
            }
        },

        set: function(key, val, options) {

            var attr, attrs, unset, changes, silent, changing, prev, current;

            if (key == null) return this;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (key == null || typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            options || (options = {});

            // Run validation.
            if (!this._validate(attrs, options)) return false;

            // Check for changes of `id`.
            if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

            this._mergePrivateFields(attrs);

            var changed = false;

            // For each `set` attribute, update or delete the current value.
            for (attr in attrs) {
                val = attrs[attr];
                this._set(attr, val, _extend({}, options, {
                    ignoreChange: true
                }));
            }

            if (options && !options.silent) {
                for (attr in attrs) {
                    var changedValue = this._hasChanged(attr, this._snapshot[attr], this._object[attr]);
                    if ((changedValue != undefined) || (_ignoreTheseFields.indexOf(attr) != -1)) {
                        changed = true;
                        var value = this._object[key];
                        // Trigger relevant attribute change event.
                        this.trigger('change:' + key, this, value, {});
                    }
                }
            }

            if (changed) this.trigger('change', this, options);

            return this;
        },

        unset: function(key, options) {
            if (!key || !_type.isString(key) || key.length === 0 || key.indexOf('__') === 0) return this;
            key = key.toLowerCase();
            delete this._object[key];
            this.triggerChangeEvent(key, options);
            return this;
        },

        // Run validation against the next complete set of model attributes,
        // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
        _validate: function(attrs, options) {
            if (!options.validate || !this.validate || !_type.isFunction(this.validate)) return true;
            attrs = _extend({}, this.attributes, attrs);
            var error = this.validationError = this.validate(attrs, options) || null;
            if (!error) return true;
            this.trigger('invalid', this, error, _extend(options, {
                validationError: error
            }));
            return false;
        },

        // Check if the model is currently in a valid state.
        isValid: function(options) {
            return this._validate({}, _extend(options || {}, {
                validate: true
            }));
        },

        has: function(key) {
            if (!key || !_type.isString(key) || key.length === 0) return false;
            if (this._object[key] && !_type.isUndefined(this._object[key])) return true;
            return false;
        },

        isNew: function() {
            return !(!_type.isNullOrUndefined(this.id) || this.has(this.idAttribute));
        },

        clone: function() {
            if (this.type == 'object')
                return Appacitive.Object._create(_deepExtend({
                    __meta: this.meta
                }, this.getObject()));

            return Appacitive.Connection._create(_deepExtend({
                __meta: this.meta
            }, this.getObject()));
        },

        copy: function(properties, setSnapShot) {
            if (properties) {
                this._copy(properties, this._object);
                if (setSnapShot) {
                    this._copy(properties, this._snapshot);
                }
            }
            return this;
        },

        mergeWithPrevious: function() {
            this._copy(this._object, this._snapshot);
            if (this._aclFactory) this._aclFactory.merge();
            this._mergePrivateFields(this._snapshot);
            this._removeTags = [];
            this._atomicProps = {};
            this._multivaluedProps = {};
            this._setOps = {};
            return this;
        },

        _merge: function() {
            this._copy(this._snapshot, this._object);
            if (this._aclFactory) this._aclFactory.merge();
            this._mergePrivateFields(this._object);
            this._removeTags = [];
            this._atomicProps = {};
            this._multivaluedProps = {};
            this._setOps = {};
        },

        rollback: function() {
            this._object = this.raw = {};
            this._merge();
            return this;
        },

        _atomic: function(key, amount, multiplier, options) {
            if (!key || !_type.isString(key) || key.length === 0 || key.indexOf('__') === 0) return this;

            key = key.toLowerCase();

            if (_type.isObject(this._object[key]) || _type.isArray(this._object[key])) {
                throw new Error("Cannot increment/decrement array/object");
            }

            try {
                if (_type.isObject(amount)) {
                    options = amount;
                    amount = multiplier;
                } else {
                    if (!amount || isNaN(Number(amount))) amount = multiplier;
                    else amount = Number(amount) * multiplier;
                }
                this._object[key] = isNaN(Number(this._object[key])) ? amount : Number(this._object[key]) + amount;

                if (!this.isNew()) {
                    this._atomicProps[key] = {
                        value: (this._atomicProps[key] ? this._atomicProps[key].value : 0) + amount
                    };
                }

            } catch (e) {
                throw new Error('Cannot perform increment/decrement operation');
            }

            this.triggerChangeEvent(key, options);

            return this;
        },

        increment: function(key, amount, options) {
            return this._atomic(key, amount, 1, options);
        },

        decrement: function(key, amount, options) {
            return this._atomic(key, amount, -1, options);
        },

        _findUnsavedChanges: function() {

            var changeSet = {
                object: null,
                isNested: false
            };

            if (!this.id) {

                var clonedObject = this.getObject();

                delete clonedObject.__meta;

                //remove __revision and aggregate poprerties
                for (var p in clonedObject)
                    if (p[0] == '$') delete clonedObject[p];

                if (clonedObject["__revision"]) delete clonedObject["__revision"];

                if (this.type == 'object' && this._aclFactory) {
                    var acls = this._aclFactory.getChanged();
                    if (acls) clonedObject.__acls = acls;
                }

                if (clonedObject.__tags && clonedObject.__tags.length == 0) delete clonedObject.__tags;

                if (Object.isEmpty(clonedObject.__attributes)) delete clonedObject.__attributes;

                if (this.type == 'connection') {
                    if (clonedObject.__endpointa.objectid) delete clonedObject.__endpointa.object;
                    if (clonedObject.__endpointb.objectid) delete clonedObject.__endpointb.object;
                }

                changeSet.object = clonedObject;
            } else {
                changeSet.object = this._getChanged(true);
            }

            return changeSet;
        },

        getType: function() {
            var type = this.type;
            if (this._object.__type && (this._object.__type.toLowerCase() == 'user' || this._object.__type.toLowerCase() == 'device')) {
                type = this._object.__type.toLowerCase()
            }

            return type;
        },

        _parseOutput: function(options, data) {

            var type = this.getType(), status;

            options = options || {};

            if (data && data[type]) {
                if (options && options.parse) data[type] = this.parse(data[type]);

                var isNew = this.isNew(), endpointSwitched = false;

                //A hack to avoid messing up with labels and endpoints
                if (this.type == 'connection') {
                    if (this._object.__endpointa && data[type].__endpointa.label != this._object.__endpointa.label) {
                        var obj = data[type].__endpointa;
                        data[type].__endpointa = data[type].__endpointb;
                        data[type].__endpointb = obj;
                        endpointSwitched = true;
                    }
                }


                this._snapshot = Appacitive.utils._decode(_extend({
                    __meta: _extend(this.meta, data.__meta)
                }, data[type]));

                this.id = this._object[this.idAttribute] = data[type][this.idAttribute];

                this._merge();

                if (isNew) {
                    if (this.type == 'connection') {
                        if (!options._batch) {
                            if (endpointSwitched) {
                                if (this._object.__endpointa.object && data.__bmeta) this._object.__endpointa.object.__meta = data.__bmeta;
                                if (this._object.__endpointb.object && data.__ameta) this._object.__endpointb.object.__meta = data.__ameta;
                            } else {
                                if (this._object.__endpointa.object && data.__ameta) this._object.__endpointa.object.__meta = data.__ameta;
                                if (this._object.__endpointb.object && data.__bmeta) this._object.__endpointb.object.__meta = data.__bmeta;
                            }
                        }
                        this.parseConnection(options._batch);
                    }
                    this.trigger('change:__id', this, this.id, {});

                    Appacitive.eventManager.fire(this.entityType + '.' + type + '.created', this, {
                        object: this
                    });

                    this.created = true;
                } else {
                    Appacitive.eventManager.fire(this.entityType + '.' + type + "." + this.id + '.updated', this, {
                        object: this
                    });
                }

                if (!options.silent) this.trigger('sync', this, data[type], options);

            } else {
                data = data || {};
                data.status = data.status || {};
                status = this._getOutpuStatus(data.status);

                this._triggerError(options, new Appacitive.Error(status));

                if (this.isNew()) {
                    Appacitive.eventManager.fire(this.entityType + '.' + type + '.createFailed', this, {
                        error: status
                    });
                } else {
                    Appacitive.eventManager.fire(this.entityType + '.' + type + "." + this.id + '.updateFailed', this, {
                        object: status
                    });
                }
            }

            return status;
        },

        /* crud operations  */

        /* save
           if the object has an id, then it has been created -> update
           else create */
        _save: function() {
            if (this.id) return this._update(arguments);
            else return this._create(arguments);
        },

        // to create the object
        _create: function(options) {

            options = options || {};

            var type = this.getType(), changeSet = this._findUnsavedChanges(), that = this;

            var request = new Appacitive._Request({
                method: 'PUT',
                type: type,
                op: 'getCreateUrl',
                args: [this.className, this._fields],
                data: changeSet.object,
                options: options,
                entity: that,
                onSuccess: function(data) {
                    var status = that._parseOutput(options, data);
                    if (!status) {
                        request.promise.fulfill(that);
                    } else {
                        request.promise.reject(status, that)
                    }
                }
            });

            return request.send();
        },

        // to update the object
        _update: function(options, promise) {

            if (!Appacitive.Promise.is(promise)) promise = Appacitive.Promise.buildPromise(options);

            var changeSet = this._findUnsavedChanges(), that = this;

            options = options || {};

            if (!Object.isEmpty(changeSet.object)) {

                var type = this.type;

                var args = [this.className, (this.id) ? this.id : this.id, this._fields];

                // for User and Device objects
                if (this._object && this._object.__type && (this._object.__type.toLowerCase() == 'user' || this._object.__type.toLowerCase() == 'device')) {
                    type = this._object.__type.toLowerCase();
                    args.splice(0, 1);
                }

                var request = new Appacitive._Request({
                    method: 'POST',
                    type: type,
                    op: 'getUpdateUrl',
                    args: args,
                    data: changeSet.object,
                    options: options,
                    entity: this,
                    onSuccess: function(data) {
                        var status = that._parseOutput(options, data);
                        if (!status) {
                            request.promise.fulfill(that);
                        } else {
                            request.promise.reject(status, that)
                        }
                    }
                });

                return request.send();
            } else {
                promise.fulfill(this);
            }

            return promise;
        },

        _fetch: function(options) {

            if (!this.id) throw new Error('Please specify id for get operation');

            options = options || {};

            // for User and Device objects
            var type = this.getType(), that = this;

            var request = new Appacitive._Request({
                method: 'GET',
                type: type,
                op: 'getGetUrl',
                args: [this.className, this.id, this._fields],
                options: options,
                entity: that,
                onSuccess: function(data) {
                    if (data && data[type]) {

                        if (options && options.parse) data[type] = that.parse(data[type]);

                        that._snapshot = Appacitive.utils._decode(_extend({
                            __meta: _extend(that.meta, data.__meta)
                        }, data[type]));
                        that._copy(that._snapshot, that._object);
                        that._mergePrivateFields(that._object);

                        if (that._aclFactory) that._aclFactory._rollback();
                        if (data.connection) {
                            if (!that.endpoints && (!that.endpointA || !that.endpointB)) {
                                that.setupConnection(that._object.__endpointa, that._object.__endpointb);
                            }
                        }

                        if (!options.silent) that.trigger('sync', that, data[type], options);

                        Appacitive.eventManager.fire(that.entityType + '.' + type + "." + that.id + '.fetched', that, {
                            object: that
                        });
                        request.promise.fulfill(that);
                    } else {
                        data = data || {};
                        data.status = data.status || {};
                        data.status = _getOutpuStatus(data.status);

                        that._triggerError(options, new Appacitive.Error(data.status));

                        request.promise.reject(data.status, that);
                    }
                }
            });
            return request.send();
        },

        // delete the object
        _destroy: function(opts) {
            opts = opts || {};

            var deleteConnections = opts.deleteConnections, that = this;

            if (_type.isBoolean(opts)) {
                deleteConnections = opts;
                opts = {};
            }

            if (!opts.wait) this.triggerDestroy(opts);

            // if the object does not have id set, 
            // just call success
            // else delete the object

            if (!this.id) return new Appacitive.Promise.buildPromise(opts).fulfill();

            var type = this.getType();

            var request = new Appacitive._Request({
                method: 'DELETE',
                type: type,
                op: 'getDeleteUrl',
                args: [this.className, this.id, deleteConnections],
                options: opts,
                entity: this,
                onSuccess: function(data) {
                    if (data && data.status) {
                        that._object = {};
                        that._snapshot = {};
                        if (opts.wait) that.triggerDestroy(opts);
                        request.promise.fulfill(data.status);
                    } else {
                        data = data || {};
                        data.status = data.status || {};
                        data.status = that._getOutpuStatus(data.status);
                        that._triggerError(opts, new Appacitive.Error(data.status));
                        request.promise.reject(data.status, that);
                    }
                }
            });
            return request.send();
        },
        
        save: function() {
            return this._save.apply(this, arguments);
        },

        fetch: function() {
            return this._fetch.apply(this, arguments);
        },

        destroy: function() {
            return this._destroy.apply(this, arguments);
        },

        destroyWithConnections: function() {
            return this._destroyWithConnections.apply(this, arguments);
        },


        toString: function() {
            return JSON.stringify(this.getObject());
        },

        parse: function(resp, options) {
            return resp;
        },

        // Get the HTML-escaped value of an attribute.
        escape: function(attr) {
                return _.escape(this.get(attr));
        }
    });

    Appacitive.BaseObject = _BaseObject;

    Appacitive.BaseObject._saveAll =  function(objects, options, type) {

        var batch = new Appacitive.Batch();

        options = options || {};

        if (!_type.isArray(objects)) throw new Error("Provide an array of objects for Object.saveAll");

        objects.forEach(function(o) {
            if (!(o instanceof Appacitive.BaseObject) && _type.isObject(o)) o = new Appacitive[this.className || type](o);
            batch.add(o);
        });

        return batch.execute(options);
    };

    _BaseObject.prototype.del = _BaseObject.prototype._destroy;

    Appacitive.Events.mixin(Appacitive.BaseObject.prototype);

})(global);
