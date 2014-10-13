(function(global) {

	"use strict";

	var Appacitive = global.Appacitive;

	//Fields on which set operation is allowed
	var _allowObjectSetOperations = ["__link", "__endpointa", "__endpointb"];

	var _allowObjectEncode = ["__endpointa", "__endpointb"];

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

	var isEncodable = function(val) {
		return (isString(val) || _type.isDate(val) || isGeocode(val));
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

	Appacitive.cast = _types;

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

	Appacitive._encode = function(attrs) {
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

	Appacitive._decode = function(attrs) {
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

	//base object for objects and connections
	/**
	 * @constructor
	 **/
	var _BaseObject = function(objectOptions, optns) {

		var _snapshot = {};

		optns = optns || {};

		objectOptions = objectOptions || {};

		objectOptions = _deepExtend({}, objectOptions);

		this.meta = {};

		//set default meta
		objectOptions.__meta = _extend(this.meta, objectOptions.__meta);

		if (optns && optns.parse) objectOptions = this.parse(objectOptions);

		if (_type.isObject(this.defaults) && !optns.setSnapShot) objectOptions = _deepExtend({}, this.defaults, objectOptions);

		if (optns && optns.collection) this.collection = optns.collection;

		objectOptions = Appacitive._decode(objectOptions);

		var that = this;

		//Copy properties from source to destination object
		var _copy = function(src, des) {
			src.__meta = _extend(that.meta, src.__meta);
			that.meta = src.__meta;
			_mergePrivateFields(src);
			var obj = Appacitive._decode(src);
			for (var property in obj) {

				if (property == that.idAttribute) that.id = obj[property];

				if (_atomicProps[property]) delete _atomicProps[property];
				if (_multivaluedProps[property]) delete _multivaluedProps[property];
				if (_setOps[property]) delete _setOps[property];

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
		};

		var _mergePrivateFields = function(attrs, del) {
			var privateProps = ["id", "__id", "__utclastupdateddate", "__utcdatecreated", "__createdby", "__updatedby"];
			var map = {
				"id": "id",
				"__id": "id",
				"__utclastupdateddate": "lastUpdatedAt",
				"__utcdatecreated": "createdAt",
				"__createdby": "createdBy",
				"__updatedby": "lastUpdatedBy"
			};
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
		};

		this.base = Appacitive.Object.prototype;

		var __cid = parseInt(Math.random() * 100000000, 10);

		// Set client id
		this.cid = __cid;

		// Set id attribute
		this.idAttribute = '__id';

		//atomic properties
		var _atomicProps = {};

		//mutlivalued properties
		var _multivaluedProps = {};

		//list of properties on whom set operations performed
		var _setOps = {};

		var raw = {};
		_copy(objectOptions, raw);
		var object = raw;

		//will be used in case of creating an appacitive object for internal purpose
		if (optns.setSnapShot) _copy(object, _snapshot);

		if (!_snapshot[this.idAttribute] && raw[this.idAttribute]) _snapshot[this.idAttribute] = raw[this.idAttribute];

		// Set id property
		this.id = _snapshot[this.idAttribute];

		//Check whether __type or __relationtype is mentioned and set type property
		if (raw.__type) {
			raw.__type = raw.__type.toLowerCase();
			this.entityType = 'type';
			this.type = 'object';
			this.className = raw.__type;
		} else if (raw.__relationtype) {
			raw.__relationtype = raw.__relationtype.toLowerCase();
			this.entityType = 'relation';
			this.type = 'connection';
			this.className = raw.__relationtype;
		}

		//attributes
		if (!object.__attributes) object.__attributes = {};
		if (!_snapshot.__attributes) _snapshot.__attributes = {};

		//tags
		var _removeTags = [];
		if (!object.__tags) object.__tags = [];
		if (!_snapshot.__tags) _snapshot.__tags = [];

		//set attributes property
		this.attributes = object;

		//fields to be returned
		var _fields = '';

		//Set private property value in main object
		_mergePrivateFields(this.attributes);

		//Fileds to be ignored while update operation
		var _ignoreTheseFields = ["__id", "__revision", "__endpointa", "__endpointb", "__createdby", "__lastmodifiedby", "__type", "__relationtype", "__typeid", "__relationid", "__utcdatecreated", "__utclastupdateddate", "__tags", "__authType", "__link", "__acls", "__meta"];

		// parse api output to get error info
		var _getOutpuStatus = function(data) {
			data = data || {};
			data.message = data.message || 'Server error';
			data.code = data.code || '500';
			return data;
		};

		// converts object to json representation for data transfer
		this.getObject  = function() { 
			var obj = Appacitive._encode(_deepExtend({ __meta: this.meta }, object)); 

			if (that.type == 'connection') {
				obj.__endpointa = object.__endpointa.toJSON();
				obj.__endpointb = object.__endpointb.toJSON();
			}

			if (Object.prototype.hasOwnProperty("id")) obj.__id = this.id;
            return obj;
		};
		
		var _toJSON = function() {
			var obj = _deepExtend({
				__meta: this.meta
			}, object);

			if (that.type == 'connection') {
				object.__endpointa = object.__endpointa.toJSON();
				object.__endpointb = object.__endpointb.toJSON();
			}
			if (this.hasOwnProperty("id")  && this.id) obj.__id = this.id;
			return obj;
		};

		// converts object to json representation but not in an encoded form
		this.toJSON = function(recursive) {
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
				return _toJSON.apply(this);
			}

		};

		// Returns all properties of this object
		this.properties = function() {
			var properties = _deepExtend({}, this.attributes);
			delete properties.__attributes;
			delete properties.__tags;
			return properties;
		};

		// accessor function for the object's attributes
		this.attr = function() {
			if (arguments.length === 0) {
				if (!object.__attributes) object.__attributes = {};
				return object.__attributes;
			} else if (arguments.length === 1) {
				if (!object.__attributes) object.__attributes = {};
				return object.__attributes[arguments[0]];
			} else if (arguments.length === 2) {
				if (!_type.isString(arguments[1]) && arguments[1] !== null)
					throw new Error('only string values can be stored in attributes.');
				if (!object.__attributes) object.__attributes = {};
				object.__attributes[arguments[0]] = arguments[1];
			} else throw new Error('.attr() called with an incorrect number of arguments. 0, 1, 2 are supported.');

			triggerChangeEvent('__attributes');

			return object.__attributes;
		};

		//accessor function to get changed attributes
		var _getChangedAttributes = function() {
			if (!object.__attributes) return undefined;
			if (!_snapshot.__attributes) return object.__attributes;

			var isDirty = false;
			var changeSet = JSON.parse(JSON.stringify(_snapshot.__attributes));
			for (var property in object.__attributes) {
				if (object.__attributes[property] == null || object.__attributes[property] == undefined) {
					changeSet[property] = null;
					isDirty = true;
				} else if (object.__attributes[property] != _snapshot.__attributes[property]) {
					changeSet[property] = object.__attributes[property];
					isDirty = true;
				} else if (object.__attributes[property] == _snapshot.__attributes[property]) {
					delete changeSet[property];
				}
			}
			if (!isDirty) return undefined;
			return changeSet;
		};

		this.getChangedAttributes = _getChangedAttributes;

		// accessor function for the object's aggregates
		this.aggregate = function() {
			var aggregates = {};
			for (var key in object) {
				if (!object.hasOwnProperty(key)) return;
				if (key[0] == '$') {
					aggregates[key.substring(1)] = object[key];
				}
			}
			if (arguments.length === 0) return aggregates;
			else if (arguments.length == 1) return aggregates[arguments[0]];
			else throw new Error('.aggregates() called with an incorrect number of arguments. 0, and 1 are supported.');
		};

		this.tags = function() {
			if (!object.__tags) return [];
			return object.__tags;
		};

		this.addTag = function(tag) {
			if (!tag || !_type.isString(tag) || !tag.length) return this;

			if (!object.__tags) object.__tags = [];

			object.__tags.push(tag);
			object.__tags = Array.distinct(object.__tags);

			if (!_removeTags || !_removeTags.length) {
				triggerChangeEvent('__tags');
				return this;
			}

			var index = _removeTags.indexOf(tag);
			if (index != -1) _removeTags.splice(index, 1);

			triggerChangeEvent('__tags');

			return this;
		};

		this.removeTag = function(tag) {
			if (!tag || !_type.isString(tag) || !tag.length) return this;
			//tag = tag.toLowerCase();
			_removeTags.push(tag);
			_removeTags = Array.distinct(_removeTags);

			if (!object.__tags || !object.__tags.length) {
				triggerChangeEvent('__tags');
				return this;
			}

			var index = object.__tags.indexOf(tag);
			if (index != -1) object.__tags.splice(index, 1);

			triggerChangeEvent('__tags');

			return this;
		};

		var _getChangedTags = function() {
			if (!object.__tags) return undefined;
			if (!_snapshot.__tags) return object.__tags;

			var _tags = [];
			object.__tags.forEach(function(a) {
				if (_snapshot.__tags.indexOf(a) == -1)
					_tags.push(a);
			});
			return _tags.length > 0 ? _tags : undefined;
		};

		this.getChangedTags = _getChangedTags;

		this.getRemovedTags = function() {
			return _removetags;
		};

		var setMutliItems = function(key, value, op, options) {

			if (!key || !_type.isString(key) || key.length === 0 || key.trim().indexOf('__') == 0 || key.trim().indexOf('$') === 0 || value == undefined || value == null) return this;

			key = key.toLowerCase();

			try {

				var addItem = function(item) {
					var val = item;
					if (!isEncodable(val)) throw new Error("Multivalued property cannot have values of property as an object");

					if (object[key] && _type.isArray(object[key])) {

						if (op == 'additems') {
							object[key].push(val);
						} else if (op == 'adduniqueitems') {
							var index = -1;

							object[key].find(function(o, i) {
								if (_type.isEqual(o, val)) {
									index = i;
									return true;
								}
								return false;
							});

							if (index == -1) object[key].push(val);
						} else if (op == 'removeitems') {
							object[key].removeAll(val);
						}
					} else {
						if (op != 'removeitems') object[key] = [val];
					}

					if (!_multivaluedProps[key]) _multivaluedProps[key] = {
						additems: [],
						adduniqueitems: [],
						removeitems: []
					};

					_multivaluedProps[key][op].push(val);
				};

				if (_type.isArray(value)) {
					value.forEach(function(v) {
						addItem(v);
					});
				} else {
					addItem(value);
				}

				triggerChangeEvent(key, options);

			} catch (e) {
				throw new Error("Unable to add item to " + key);
			}

			return that;
		};

		this.add = function(key, value, options) {
			return setMutliItems.apply(this, [key, value, 'additems', options]);
		};

		this.addUnique = function(key, value, options) {
			return setMutliItems.apply(this, [key, value, 'adduniqueitems', options]);
		};

		this.remove = function(key, value, options) {
			return setMutliItems.apply(this, [key, value, 'removeitems', options]);
		};

		var hasChanged = function(property, prevValue, currValue, isInternal) {
			var changed = undefined;

			if (!_type.isEqual(currValue, prevValue)) {
				if (property == '__tags') {
					var changedTags = _getChangedTags();
					if (changedTags && changedTags.length > 0) changed = changedTags;
				} else if (property == '__attributes') {
					var attrs = _getChangedAttributes();
					if (!Object.isEmpty(attrs)) changed = attrs;
				} else {
					if (_type.isArray(currValue)) {
						if (_multivaluedProps[property] && !_setOps[property]) {
							if (isInternal) {
								changed = _multivaluedProps[property];
							} else {
								changed = currValue;
							}
						} else if (!currValue.equals(prevValue)) {
							changed = currValue;
						}
					} else if (_atomicProps[property] && !_setOps[property]) {
						if (isInternal) {
							changed = {
								incrementby: _atomicProps[property].value
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
		};

		var _getChanged = function(isInternal) {
			var isDirty = false;
			var changeSet = _deepExtend({}, _snapshot);

			for (var p in changeSet) {
				if (p[0] == '$') delete changeSet[p];
			}

			for (var property in object) {
				var changed = hasChanged(property, changeSet[property], object[property], isInternal);

				if (changed == undefined) {
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

			if (isInternal) changeSet = Appacitive._encode(changeSet);

			var changedTags = _getChangedTags();
			if (isInternal) {
				if (changedTags && changedTags.length > 0) {
					changeSet["__addtags"] = changedTags;
					isDirty = true;
				}
				if (_removeTags && _removeTags.length > 0) {
					changeSet["__removetags"] = _removeTags;
					isDirty = true;
				}
			} else {
				if (changedTags && changedTags.length > 0) {
					changeSet["__tags"] = changedTags;
					isDirty = true;
				}
			}

			var attrs = _getChangedAttributes();
			if (attrs && !Object.isEmpty(attrs)) {
				changeSet["__attributes"] = attrs;
				isDirty = true;
			} else delete changeSet["__attributes"];

			if (that.type == 'object' && that._aclFactory) {
				var acls = that._aclFactory.getChanged();
				if (acls) changeSet['__acls'] = acls;
			}

			if (isDirty && !Object.isEmpty(changeSet)) return changeSet;
			return false;
		};

		this.changed = function() {
			if (this.isNew()) return this.toJSON();
			return _getChanged();
		};

		this.hasChanged = function() {
			if (this.isNew()) return true;

			if (arguments.length === 0)
				return Object.isEmpty(_getChanged(true)) ? false : true;
			else if (arguments.length == 1 && _type.isString(arguments[0]) && arguments[0].length > 0)
				return (hasChanged(arguments[0]) == undefined) ? false : true;

			return false;
		};

		this.changedAttributes = function() {
			if (this.isNew()) return this.toJSON();

			if (arguments.length === 0) {
				return _getChanged();
			} else if (arguments.length == 1 && _type.isArray(arguments[0]) && arguments[0].length) {
				var attrs = {};
				arguments[0].forEach(function(c) {
					var value = hasChanged(c);
					if (value != undefined) attrs.push(value);
				});
				return attrs;
			}
			return false;
		};

		this.previous = function() {
			if (this.isNew()) return null;

			if (arguments.length == 1 && _type.isString(arguments[0]) && arguments[0].length) {
				return _snapshot[arguments[0]];
			}
			return null;
		};

		this.previousAttributes = function() {
			if (this.isNew()) return null;
			return _extend({}, _snapshot);
		};

		this.fields = function() {
			if (arguments.length == 1) {
				var value = arguments[0];
				if (_type.isString(value)) _fields = value;
				else if (_type.isArray(value)) _fields = value.join(',');
				return this;
			} else {
				return _fields;
			}
		};

		this.get = function(key, type) {
			if (key) {
				if (type && _types[type.toLowerCase()]) {
					if (_types[type.toLowerCase()]) {
						var res = _types[type.toLowerCase()](object[key]);
						return res;
					} else {
						throw new Error('Invalid cast-type "' + type + '"" provided for get "' + key + '"');
					}
				}
				return object[key];
			}
		};

		this.tryGet = function(key, value, type) {
			var res = this.get(key, type);
			if (res !== undefined) return res;
			return value;
		};

		var triggerChangeEvent = function(key, options) {
			if (options && !options.silent) {
				var changed = hasChanged(key, _snapshot[key], object[key]);

				if (changed[key] != undefined || (_ignoreTheseFields.indexOf(key) != -1)) {
					var value = changed[key] || object[key];
					// Trigger all relevant attribute changes.
					that.trigger('change:' + key, that, value, {});
					if (!options.ignoreChange) that.trigger('change', that, options);
				}
			}
		};

		var triggerDestroy = function(opts) {
			if (opts && !opts.silent) that.trigger('destroy', that, that.collection, opts);
		};

		this._triggerError = function(options, status) {
			if (!options.silent) that.trigger('error', that, status, options);	
		};

		var set = function(key, value, options) {

			if (!key || !_type.isString(key) || key.length === 0 || key.trim().indexOf('$') === 0) return this;

			options = options || {};

			var oType = options.dataType;

			key = key.toLowerCase();

			try {

				if (_type.isNullOrUndefined(value)) {
					object[key] = null;
				} else if (isEncodable(value)) {
					object[key] = value;
				} else if (_type.isObject(value)) {
					if (_allowObjectSetOperations.indexOf(key) !== -1) object[key] = value;
					else throw new Error("Property cannot have value as an object");
				} else if (_type.isArray(value)) {
					object[key] = [];

					value.forEach(function(v) {
						if (isEncodable(v)) object[key].push(v);
						else throw new Error("Multivalued property cannot have values of property as an object");
					});
				}

				delete _atomicProps[key];
				delete _multivaluedProps[key];
				delete _setOps[key];

				if (!_type.isEqual(object[key], _snapshot[key])) _setOps[key] = true;

				if (key == that.idAttribute) that.id = value;

				return this;
			} catch (e) {
				throw new Error("Unable to set " + key);
			}
		};

		this.set = function(key, val, options) {

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

			_mergePrivateFields(attrs);

			var changed = false;

			// For each `set` attribute, update or delete the current value.
			for (attr in attrs) {
				val = attrs[attr];
				set.apply(this, [attr, val, _extend({}, options, {
					ignoreChange: true
				})]);
			}

			if (options && !options.silent) {
				for (attr in attrs) {
					var changedValue = hasChanged(attr, _snapshot[attr], object[attr]);
					if ((changedValue != undefined) || (_ignoreTheseFields.indexOf(attr) != -1)) {
						changed = true;
						var value = object[key];
						// Trigger relevant attribute change event.
						that.trigger('change:' + key, that, value, {});
					}
				}
			}

			if (changed) this.trigger('change', this, options);

			return this;
		};

		this.unset = function(key, options) {
			if (!key || !_type.isString(key) || key.length === 0 || key.indexOf('__') === 0) return this;
			key = key.toLowerCase();
			delete object[key];
			triggerChangeEvent(key, options);
			return this;
		};

		// Run validation against the next complete set of model attributes,
		// returning `true` if all is well. Otherwise, fire an `"invalid"` event.
		this._validate = function(attrs, options) {
			if (!options.validate || !this.validate || !_type.isFunction(this.validate)) return true;
			attrs = _extend({}, this.attributes, attrs);
			var error = this.validationError = this.validate(attrs, options) || null;
			if (!error) return true;
			this.trigger('invalid', this, error, _extend(options, {
				validationError: error
			}));
			return false;
		};

		// Check if the model is currently in a valid state.
		this.isValid = function(options) {
			return this._validate({}, _extend(options || {}, {
				validate: true
			}));
		};

		this.has = function(key) {
			if (!key || !_type.isString(key) || key.length === 0) return false;
			if (object[key] && !_type.isUndefined(object[key])) return true;
			return false;
		};

		this.isNew = function() {
			return !this.has(this.idAttribute);
		};

		this.clone = function() {
			if (this.type == 'object') 
				return Appacitive.Object._create(_deepExtend({
					__meta: this.meta
				}, this.getObject()));

			return new Appacitive.connection._create(_deepExtend({
				__meta: this.meta
			}, this.getObject()));
		};

		this.copy = function(properties, setSnapShot) {
			if (properties) {
				_copy(properties, object);
				if (setSnapShot) {
					_copy(properties, _snapshot);
				}
			}
			return this;
		};

		this.mergeWithPrevious = function() {
			_copy(object, _snapshot);
			if (that._aclFactory) that._aclFactory.merge();
			_mergePrivateFields(_snapshot);
			_removeTags = [];
			_atomicProps = {};
			_multivaluedProps = {};
			_setOps = {};
			return this;
		};

		var _merge = function() {
			_copy(_snapshot, object);
			if (that._aclFactory) that._aclFactory.merge();
			_mergePrivateFields(object);
			_removeTags = [];
			_atomicProps = {};
			_multivaluedProps = {};
			_setOps = {};
		};

		this.rollback = function() {
			object = raw = {};
			_merge();
			return this;
		};

		var _atomic = function(key, amount, multiplier, options) {
			if (!key || !_type.isString(key) || key.length === 0 || key.indexOf('__') === 0) return this;

			key = key.toLowerCase();

			if (_type.isObject(object[key]) || _type.isArray(object[key])) {
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
				object[key] = isNaN(Number(object[key])) ? amount : Number(object[key]) + amount;

				if (!that.isNew()) {
					_atomicProps[key] = {
						value: (_atomicProps[key] ? _atomicProps[key].value : 0) + amount
					};
				}

			} catch (e) {
				throw new Error('Cannot perform increment/decrement operation');
			}

			triggerChangeEvent(key, options);

			return that;
		};

		this.increment = function(key, amount, options) {
			return _atomic(key, amount, 1, options);
		};

		this.decrement = function(key, amount, options) {
			return _atomic(key, amount, -1, options);
		};

		this._findUnsavedChanges = function() {

			var changeSet = {
				object: null,
				isNested: false
			}

			if (!this.id) {

				var clonedObject = that.getObject();

				delete clonedObject.__meta;

				//remove __revision and aggregate poprerties
				for (var p in clonedObject) if (p[0] == '$') delete clonedObject[p];
				
				if (clonedObject["__revision"]) delete clonedObject["__revision"];

				if (that.type == 'object' && that._aclFactory) {
					var acls = that._aclFactory.getChanged();
					if (acls) clonedObject.__acls = acls;
				}

				if (clonedObject.__tags && clonedObject.__tags.length == 0) delete clonedObject.__tags;

				if (Object.isEmpty(clonedObject.__attributes)) delete clonedObject.__attributes;

				if (that.type == 'connection') {
					if (clonedObject.__endpointa.objectid) delete clonedObject.__endpointa.object;
					if (clonedObject.__endpointb.objectid) delete clonedObject.__endpointb.object;
				}

				changeSet.object = clonedObject;
			} else {
				changeSet.object = _getChanged(true);
			}

			return changeSet;
		};

		this.getType = function() {
			var type = that.type;
			if (object.__type && (object.__type.toLowerCase() == 'user' || object.__type.toLowerCase() == 'device')) {
				type = object.__type.toLowerCase()
			}

			return type;
		};

		this._parseOutput = function(options, data) {

			var type = that.getType(), status;
			
			options = options || {};

			if (data && data[type]) {
				if (options && options.parse) data[type] = this.parse(data[type]);

				var isNew = this.isNew();

				_snapshot = Appacitive._decode(_extend({
					__meta: _extend(that.meta, data.__meta)
				}, data[type]));

				that.id = object[that.idAttribute] = data[type][that.idAttribute];

				_merge();

				if (isNew) {
					if (that.type == 'connection') {
						if (!options._batch) {
							if (object.__endpointa.object) object.__endpointa.object.__meta = data.__ameta;
							if (object.__endpointb.object) object.__endpointb.object.__meta = data.__bmeta;
						}
						that.parseConnection(options._batch);
					}
					that.trigger('change:__id', that, that.id, {});

					Appacitive.eventManager.fire(that.entityType + '.' + type + '.created', that, {
						object: that
					});

					that.created = true;
				} else {
					Appacitive.eventManager.fire(that.entityType + '.' + type + "." + that.id + '.updated', that, {
						object: that
					});
				}

				if (!options.silent) that.trigger('sync', that, data[type], options);

			} else {
				data = data || {};
				data.status = data.status || {};
				status = _getOutpuStatus(data.status);

				that._triggerError(options, new Appacitive.Error(status));

				if (that.isNew()) {
					Appacitive.eventManager.fire(that.entityType + '.' + type + '.createFailed', that, {
						error: status
					});
				} else {
					Appacitive.eventManager.fire(that.entityType + '.' + type + "." + that.id + '.updateFailed', that, {
						object: status
					});
				}
			}

			return status;
		};

		/* crud operations  */

		/* save
		   if the object has an id, then it has been created -> update
		   else create */
		this._save = function() {
			if (this.id) return _update.apply(this, arguments);
			else return _create.apply(this, arguments);
		};


		// to create the object
		var _create = function(options) {

			options = options || {};

			var type = that.getType();
			
			var changeSet = that._findUnsavedChanges();

			var request = new Appacitive._Request({
				method: 'PUT',
				type: type,
				op: 'getCreateUrl',
				args: [this.className, _fields],
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
		};

		// to update the object
		var _update = function(options, promise) {

			if (!Appacitive.Promise.is(promise)) promise = Appacitive.Promise.buildPromise(options);

			var changeSet =  that._findUnsavedChanges();

			options = options || {};

			if (!Object.isEmpty(changeSet.object)) {

				var type = that.type;

				var args = [that.className, (that.id) ? that.id : that.id, _fields];

				// for User and Device objects
				if (object && object.__type && (object.__type.toLowerCase() == 'user' || object.__type.toLowerCase() == 'device')) {
					type = object.__type.toLowerCase();
					args.splice(0, 1);
				}

				var request = new Appacitive._Request({
					method: 'POST',
					type: type,
					op: 'getUpdateUrl',
					args: args,
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
			} else {
				promise.fulfill(that);
			}

			return promise;
		};

		var _fetch = function(options) {

			if (!that.id) throw new Error('Please specify id for get operation');

			options = options || {};
			
			// for User and Device objects
			var type = that.getType();

			var request = new Appacitive._Request({
				method: 'GET',
				type: type,
				op: 'getGetUrl',
				args: [this.className, that.id, _fields],
				options: options,
				entity: that,
				onSuccess: function(data) {
					if (data && data[type]) {

						if (options && options.parse) data[type] = that.parse(data[type]);

						_snapshot = Appacitive._decode(_extend({
							__meta: _extend(that.meta, data.__meta)
						}, data[type]));
						_copy(_snapshot, object);
						_mergePrivateFields(object);

						if (that._aclFactory) that._aclFactory._rollback();
						if (data.connection) {
							if (!that.endpoints && (!that.endpointA || !that.endpointB)) {
								that.setupConnection(object.__endpointa, object.__endpointb);
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
		};

		// fetch ( by id )
		this._fetch = function(options) {
			return _fetch.apply(this, [options]);
		};

		// delete the object
		this._destroy = function(opts) {
			opts = opts || {};

			var deleteConnections = opts.deleteConnections;

			if (_type.isBoolean(opts)) {
				deleteConnections = opts;
				opts = {};
			}

			if (!opts.wait) triggerDestroy(opts);

			// if the object does not have id set, 
			// just call success
			// else delete the object

			if (!that.id) return new Appacitive.Promise.buildPromise(opts).fulfill();

			var type = that.getType();

			var request = new Appacitive._Request({
				method: 'DELETE',
				type: type,
				op: 'getDeleteUrl',
				args: [this.className, that.id, deleteConnections],
				options: opts,
				entity: this,
				onSuccess: function(data) {
					if (data && data.status) {
						object = {};
						_snapshot = {};
						if (opts.wait) triggerDestroy(opts);
						request.promise.fulfill(data.status);
					} else {
						data = data || {};
						data.status = data.status || {};
						data.status = _getOutpuStatus(data.status);
						that._triggerError(opts, new Appacitive.Error(data.status));
						request.promise.reject(data.status, that);
					}
				}
			});
			return request.send();
		};
		this.del = this._destroy;

		if (this.type == 'object') {
			this._destroyWithConnections = function(options) {
				return this.destroy(_extend({
					deleteConnections: true
				}, options));
			};
		}

	};

	_BaseObject.prototype.save = function() {
		return this._save.apply(this, arguments);
	};

	_BaseObject.prototype.fetch = function() {
		return this._fetch.apply(this, arguments);
	};

	_BaseObject.prototype.destroy = function() {
		return this._destroy.apply(this, arguments);
	};

	_BaseObject.prototype.destroyWithConnections = function() {
		return this._destroyWithConnections.apply(this, arguments);
	};

	Appacitive.BaseObject = _BaseObject;

	Appacitive.BaseObject._saveAll = function(objects, options, type) {

		var batch = new Appacitive.Batch();

		options = options || {};

		if (!_type.isArray(objects)) throw new Error("Provide an array of objects for Object.saveAll");

		objects.forEach(function(o) {
			if (!(o instanceof Appacitive.BaseObject) && _type.isObject(o)) o = new Appacitive[this.className || type](o);
			batch.add(o);
		});

		return batch.execute(options);
	};

	Appacitive.BaseObject.prototype.toString = function() {
		return JSON.stringify(this.getObject());
	};

	Appacitive.BaseObject.prototype.parse = function(resp, options) {
		return resp;
	};

	// Get the HTML-escaped value of an attribute.
	Appacitive.BaseObject.prototype.escape = function(attr) {
		return _.escape(this.get(attr));
	},

	Appacitive.Events.mixin(Appacitive.BaseObject.prototype);

})(global);