(function (global) {

	"use strict";

	//base object for objects and connections
	/**
	* @constructor
	**/
	var _BaseObject = function(objectOptions, optns) {

		var _snapshot = {};

		optns = optns || {};

		if (optns && optns.parse) objectOptions = this.parse(objectOptions);
		
		if (_type.isObject(this.defaults) && !optns.setSnapShot) objectOptions = _extend({}, this.defaults, objectOptions);
		
	    if (optns && optns.collection) this.collection = optns.collection;
	    
		//atomic properties
		var _atomicProps = {};

		//mutlivalued properties
		var _multivaluedProps = {};

	    var _setOps = {};

		//Copy properties from source to destination object
		var _copy = function(src, des) {
			for (var property in src) {

				if (property == '__id') that.id = src[property];

				if (_atomicProps[property]) delete _atomicProps[property];
				if (_multivaluedProps[property]) delete _multivaluedProps[property];
				if (_setOps[property]) delete _setOps[property];

				if (_type.isString(src[property])) {
					des[property] = src[property];
				} else if(src[property] instanceof Date){
					des[property] = global.Appacitive.Date.toISOString(src[property]);
				} else if (_type.isObject(src[property]))  {
					
					if (src[property] instanceof global.Appacitive.GeoCoord) {
		 				des[property] = src[property].toString();
		 			} else {

						if (!des[property]) des[property] = {};

						for (var p in src[property]) {
							des[property][p] = src[property][p];
						}
					}
				} else if (_type.isArray(src[property])) {
					des[property] = [];
				
					src[property].forEach(function(v) {
						if (_type.isString(v)) { des[property].push(v); }
			 			else if (_type.isNumber(v) || _type.isBoolean(v)) { des[property].push(value + ''); }
			 			else if (v instanceof Date) des[property].push(global.Appacitive.Date.toISOString(v));
			 			else if (property == '__link') des[property].push(v);
			 			else throw new Error("Multivalued property cannot have values of property as an object");
					});

					if (property !== '__tags' || property !== '__link') {
						des[property].push = function(v) {
						  	var len = this.length;
						  	if (_type.isString(v)) { this[len] = v; }
				 			else if (_type.isNumber(v) || _type.isBoolean(v)) { this[len] = v + ''; }
				 			else if (v instanceof Date) {
			 					this[len] = global.Appacitive.Date.toISOString(v);
			 				} else {
			 					throw new Error("Multivalued property cannot have values of property as an object");
			 				} 
			 				return this;
						}
					}
				} else {
					des[property] = src[property];
				}
			}
		};

		var that = this;

		this.base = this.prototype;

		var raw = {};
		_copy(objectOptions, raw);
		var object = raw;

		//will be used in case of creating an appacitive object for internal purpose
		if (optns.setSnapShot) _copy(object, _snapshot);
		
		if (!_snapshot.__id && raw.__id) _snapshot.__id = raw.__id;

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

		var __cid = parseInt(Math.random() * 100000000, 10);

		this.cid = __cid;

		this.idAttribute = '__id';

		this.id = _snapshot.__id

		//attributes
		if (!object.__attributes) object.__attributes = {};
		if (!_snapshot.__attributes) _snapshot.__attributes = {};

		//tags
		var _removeTags = []; 
		if (!object.__tags) object.__tags = [];
		if (!_snapshot.__tags) _snapshot.__tags = [];

		this.attributes = object;

		//fields to be returned
		var _fields = '';

		//Fileds to be ignored while update operation
		var _ignoreTheseFields = ["__id", "__revision", "__endpointa", "__endpointb", "__createdby", "__lastmodifiedby", "__type", "__relationtype", "__typeid", "__relationid", "__utcdatecreated", "__utclastupdateddate", "__tags", "__authType", "__link", "__acls"];
		
		var _allowObjectSetOperations = ["__link", "__endpointa", "__endpointb"];

		/* parse api output to get error info
		   TODO: define error objects in future depending on codes and messages */
		var _getOutpuStatus = function(data) {
			data = data || {};
			data.message = data.message || 'Server error';
			data.code = data.code || '500';
			return data;
		};

		this.toJSON = this.getObject = function() { return JSON.parse(JSON.stringify(object)); };

		this.properties = function() {
			var properties = this.attributes();
			delete properties.__attributes;
			delete properties.__tags;
			return properties;
		};

	    this.parse = function(resp, options) {
	      return resp;
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

		this.tags = function()  {
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

		this.getRemovedTags = function() { return _removetags; };

		var setMutliItems = function(key, value, op, options) {

			if (!key || !_type.isString(key) ||  key.length === 0  || key.trim().indexOf('__') == 0 || key.trim().indexOf('$') === 0 || value == undefined || value == null) return this; 
			
			key = key.toLowerCase();

			try {

				var addItem = function(item) {
					var val;
					if (_type.isString(item)) { val = item; }
		 			else if (_type.isNumber(item) || _type.isBoolean(item)) { val = item + ''; }
		 			else throw new Error("Multivalued property cannot have values of property as an object");

	 				if (object[key] && _type.isArray(object[key])) {

	 					var index = object[key].indexOf(val);
	 					if (op == 'additems') {
	 						object[key].push(val);
	 					} else if (index == -1 && op == 'adduniqueitems') {
	 						object[key].push(val);
	 					} else if (op == 'removeitems') {
	 						object[key].removeAll(val);
	 					}
	 				} else {
	 					if (op != 'removeitems') object[key] = [val];
	 				}

	 				if (!_multivaluedProps[key]) _multivaluedProps[key] = { additems: [], adduniqueitems: [], removeitems: [] };

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

			} catch(e) {
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

		var hasChanged = function(property, prevValue, currValue) {
			var changed = undefined;

			if (currValue != prevValue) {
				if (property == '__tags') {
					var changedTags = _getChangedTags();
					if (changedTags) changed = changedTags; 
				} else if (property == '__attributes') {
					var attrs = _getChangedAttributes();
					if (attrs) changed = attrs;
				} else {
					if (_type.isArray(currValue)) {
						if (_multivaluedProps[property] && !_setOps[property]) {
							changed = _multivaluedProps[property];
						} else if (!currValue.equals(prevValue)) {
							changed = currValue;
						} 
					} else if (_atomicProps[property] && !_setOps[property]) {
						changed = { incrementby : _atomicProps[property].value };
					} else {
						changed = currValue;
					}
				}
			} 

			return changed;
		};

		var _getChanged = function(isInternal) {
			var isDirty = false;
			var changeSet = JSON.parse(JSON.stringify(_snapshot));

			for (var p in changeSet) {
				if (p[0] == '$') delete changeSet[p];
			}

			for (var property in object) {
				var changed = hasChanged(property, changeSet[property], object[property]);

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
			} catch(e) {}


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

		this.changedAttributes  = function() {
			if (this.isNew()) return this.toJSON();

			var changeSet = _getChanged(true);
			
			if (arguments.length === 0) {
				return changeSet;
			} else if (arguments.length == 1 && _type.isArray(arguments[0]) && arguments[0].length) {
				var attrs = {};
				arguments[0].forEach(function(c) {
					if (changeSet[c]) attrs.push(changeSet[c]);
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
			return _snapshot; 
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

		var _types = {
			"integer": function(value) { 
				if (value) {
					var res = parseInt(value);
					if (!isNaN(res)) return res;
				}
				return value;
			}, "decimal": function(value) { 
				if (value) {
					var res = parseFloat(value);
					if (!isNaN(res)) return res;
				}
				return value;
			}, "boolean": function(value) { 
				if (value !== undefined && value !== null && (value.toString().toLowerCase() === 'true' || value === true || value > 0)) return true;
				return false;
			}, "date": function(value) { 
				if (value) {
					var res = global.Appacitive.Date.parseISODate(value);
					if (res) return res;
				}
				return value;
			}, "datetime": function(value) { 
				if (value) {
					var res = global.Appacitive.Date.parseISODate(value);
					if (res) return res;
				}
				return value;
			}, "time": function(value) { 
				if (value) {
					var res = global.Appacitive.Date.parseISOTime(value);
					if (res) return res;
				}
				return value;
			}, "string": function(value) { 
				if (value) return value.toString();
				return value;
			}, "geocode": function(value) {
				// value is not string or its length is 0, return false
				if (!_type.isString(value) || value.trim().length == 0) return false;
				  
				// Split value string by ,
				var split = value.split(',');

				// split length is not equal to 2 so return false
				if (split.length !== 2 ) return false;

				// validate the value
				return new global.Appacitive.GeoCoord(split[0], split[1]);
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

		var getDateValue = function(type, value) {
			if (type == 'date') {
	 			return global.Appacitive.Date.toISODate(value);
	 		} else if (type == 'time') {
	 			return global.Appacitive.Date.toISOTime(value);
	 		} 
	 		return global.Appacitive.Date.toISOString(value);
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

      	var set = function(key, value, options) {

      		if (!key || !_type.isString(key) ||  key.length === 0 || key.trim().indexOf('$') === 0) return this; 
			
			options = options || {};

			var oType = options.dataType;

			key = key.toLowerCase();

			try {

			 	if (value == undefined || value == null) { object[key] = null;}
			 	else if (_type.isString(value)) { object[key] = value; }
			 	else if (_type.isNumber(value) || _type.isBoolean(value)) { object[key] = value + ''; }
			 	else if (value instanceof Date) {
			 		object[key] = getDateValue(oType, value);
			 	} else if (_type.isObject(value)) {
			 		if (_allowObjectSetOperations.indexOf(key) !== -1) {
			 		 	object[key] = value;
			 		} else {
			 			if (value instanceof global.Appacitive.GeoCoord) {
			 				object[key] = value.toString();
			 			} else {
			 				throw new Error("Property cannot have value as an object");
			 			}
			 		}
				} else if (_type.isArray(value)) {
					object[key] = [];

					value.forEach(function(v) {
						if (_type.isString(v)) { object[key].push(v); }
			 			else if (_type.isNumber(v) || _type.isBoolean(v)) { object[key].push(v + ''); }
			 			else if (value instanceof Date) throw new Error("Multivalued property cannot have values of property as date");
			 			else throw new Error("Multivalued property cannot have values of property as an object");
					});

					if (key !== 'tags' || key !== '__link') {
						object[key].push = function(v) {
						  	var len = this.length;
						  	if (_type.isString(v)) { this[len] = v; }
				 			else if (_type.isNumber(v) || _type.isBoolean(v)) { this[len] = v + ''; }
				 			else if (value instanceof Date) throw new Error("Multivalued property cannot have values of property as date");
			 				else throw new Error("Multivalued property cannot have values of property as an object");
			 			
			 				return this; 
						}
					}
				}

				delete _atomicProps[key];
				delete _multivaluedProps[key];
				delete _setOps[key];

				if (object[key] !== _snapshot[key]) {
					if ((_type.isArray(object[key]) && !object[key].equals(_snapshot[key])) || _type.isString(object[key]) || _type.isObject(object[key])) {
						_setOps[key] = true;
					}
				}

				if (key == '__id') that.id = value; 

			 	return this;
			} catch(e) {
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

			var changed = false;

			// For each `set` attribute, update or delete the current value.
			for (attr in attrs) {
				val = attrs[attr];
				set.apply(this, [ attr, val, _extend({}, options, { ignoreChange: true }) ]);
			}

			if (options && !options.silent) {
				for (attr in attrs) {
					var changedValue = hasChanged(attr, _snapshot[attr], object[attr]);
					if (changedValue || (_ignoreTheseFields.indexOf(attr) != -1)) {
						changed = true;
						var value = changedValue || object[key];
						// Trigger relevant attribute change event.
					    that.trigger('change:' + key, that, value, {});
					}
				}
			}

			if (changed) this.trigger('change', this, options);

			return this;
		};

		this.unset = function(key, options) {
			if (!key || !_type.isString(key) ||  key.length === 0 || key.indexOf('__') === 0) return this; 
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
			this.trigger('invalid', this, error, _extend(options, {validationError: error}));
			return false;
	    };

	     // Check if the model is currently in a valid state.
	    this.isValid = function(options) {
	    	return this._validate({}, _extend(options || {}, { validate: true }));
	    };

		this.has = function(key) {
			if (!key || !_type.isString(key) ||  key.length === 0) return false; 
			if (object[key] && !_type.isUndefined(object[key])) return true;
			return false;
		};

		this.isNew = function() {
			if (this.id && this.id.length) return false;
			return true;
		};

		this.clone = function() {
			if (this.type == 'object') return global.Appacitive.Object._create(this.toJSON());
			return new global.Appacitive.connection._create(this.toJSON());
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
			_removeTags = [];
			_atomicProps = {};
			_multivaluedProps = {};
			_setOps = {};
			return this;
		};

		var _merge = function() {
			_copy(_snapshot, object);
			if (that._aclFactory) that._aclFactory.merge();
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
			if (!key || !_type.isString(key) ||  key.length === 0 || key.indexOf('__') === 0) return this;

			key = key.toLowerCase();

			if (_type.isObject(object[key]) ||  _type.isArray(object[key])) {
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
					_atomicProps[key] = { value : (_atomicProps[key] ? _atomicProps[key].value : 0) + amount };
				}

			} catch(e) {
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

			var type = that.type;
			if (object.__type &&  (object.__type.toLowerCase() == 'user' ||  object.__type.toLowerCase() == 'device')) {
				type = object.__type.toLowerCase()
			}

			var clonedObject = JSON.parse(JSON.stringify(object));

			//remove __revision and aggregate poprerties
			for (var p in clonedObject) {
				if (p[0] == '$') delete clonedObject[p];
			}
			if (clonedObject["__revision"]) delete clonedObject["__revision"];
			
			if (type == 'object' && that._aclFactory) {
				var acls = that._aclFactory.getChanged();
				if (acls) clonedObject.__acls = acls;
			}

			if (clonedObject.__tags && clonedObject.__tags.length == 0) delete clonedObject.__tags;

			if (Object.isEmpty(clonedObject.__attributes)) delete clonedObject.__attributes;

			var request = new global.Appacitive._Request({
				method: 'PUT',
				type: type,
				op: 'getCreateUrl',
				args: [this.className, _fields],
				data: clonedObject,
				options: options,
				entity: that,
				onSuccess: function(data) {
					var savedState = null;

					if (data && data[type]) {
						savedState = data[type];

						_snapshot = savedState;
						
						object.__id = savedState.__id;
						that.id = savedState.__id;

						_merge();

						if (that.type == 'connection') that.parseConnection();


						that.trigger('change:__id', that, object.__id, { });

						global.Appacitive.eventManager.fire(that.entityType + '.' + type + '.created', that, { object : that });

						that.created = true;

						if (!options.silent) that.trigger('sync', that, data[type], options);

						request.promise.fulfill(that);
					} else {
						if (!options.silent) that.trigger('error', that, data.status, options);

						global.Appacitive.eventManager.fire(that.entityType + '.' + type + '.createFailed', that, { error: data.status });
						request.promise.reject(data.status, that);
					}
				}
			});
				
			return request.send();
		};

		// to update the object
		var _update = function(options, promise) {

			if (!global.Appacitive.Promise.is(promise)) promise = global.Appacitive.Promise.buildPromise(options);

			var changeSet = _getChanged(true);

			options = options || {};

			if (!Object.isEmpty(changeSet)) {

				var type = that.type;
				
				var args = [that.className, (that.id) ? that.id : that.id, _fields];

				// for User and Device objects
				if (object && object.__type &&  ( object.__type.toLowerCase() == 'user' ||  object.__type.toLowerCase() == 'device')) { 
					type = object.__type.toLowerCase();
					args.splice(0, 1);
				}

				var request = new global.Appacitive._Request({
					method: 'POST',
					type: type,
					op: 'getUpdateUrl',
					args: args,
					data: changeSet,
					options: options,
					entity: that,
					onSuccess: function(data) {
						if (data && data[type]) {
							
							_snapshot = data[type];
							
							_merge();
							
							delete that.created;

							if (!options.silent) that.trigger('sync', that, data[type], options);

							global.Appacitive.eventManager.fire(that.entityType  + '.' + type + "." + that.id +  '.updated', that, { object : that });
							request.promise.fulfill(that);
						} else {
							data = data || {};
							data.status =  data.status || {};
							data.status = _getOutpuStatus(data.status);
							if (!options.silent) that.trigger('error', that, data.status, options);
							global.Appacitive.eventManager.fire(that.entityType  + '.' + type + "." + that.id +  '.updateFailed', that, { object : data.status });
							request.promise.reject(data.status, that);
						}
					}
				});
				
				return request.send();
			} else {
				promise.fulfill(that);
			}
			
			return promise;
		};

		var _fetch = function (options) {

			if (!that.id) throw new Error('Please specify id for get operation');
			
			options = options || [];

			var type = this.type;

			// for User and Device objects
			if (object && object.__type &&  ( object.__type.toLowerCase() == 'user' ||  object.__type.toLowerCase() == 'device')) { 
				type = object.__type.toLowerCase();
			}

			var request = new global.Appacitive._Request({
				method: 'GET',
				type: type,
				op: 'getGetUrl',
				args: [this.className, that.id, _fields],
				options: options,
				entity: that,
				onSuccess: function(data) {
					if (data && data[type]) {
						_snapshot = data[type];
						_copy(_snapshot, object);
						if (that._aclFactory) that._aclFactory._rollback();
						if (data.connection) {
							if (!that.endpoints && (!that.endpointA || !that.endpointB)) {
								that.setupConnection(object.__endpointa, object.__endpointb);
							}
						}

						if (!options.silent) that.trigger('sync', that, data[type], options);

						global.Appacitive.eventManager.fire(that.entityType  + '.' + type + "." + that.id +  '.updated', that, { object : that });
						request.promise.fulfill(that);
					} else {
						data = data || {};
						data.status =  data.status || {};
						data.status = _getOutpuStatus(data.status);
						request.promise.reject(data.status, that);
					}
				}
			});
			return request.send();
		};

		// fetch ( by id )
		this._fetch = function(options) {
			return _fetch.apply(this ,[options]);
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

			// if the object does not have __id set, 
	        // just call success
	        // else delete the object

	        if (!that.id) return new global.Appacitive.Promise.buildPromise(opts).fulfill();

	        var type = this.type;
			if (object.__type &&  (object.__type.toLowerCase() == 'user' ||  object.__type.toLowerCase() == 'device')) type = object.__type.toLowerCase()
			
			var request = new global.Appacitive._Request({
				method: 'DELETE',
				type: type,
				op: 'getDeleteUrl',
				args: [this.className, that.id, deleteConnections],
				options: opts,
				entity: this,
				onSuccess: function(data) {
					request.promise.fulfill(data);

					if (data && data.status) {
						if (opts.wait) triggerDestroy(opts);
						request.promise.fulfill(data.status);
					} else {
						data = data || {};
						data.status =  data.status || {};
						data.status = _getOutpuStatus(data.status);
						request.promise.reject(data.status, that);
					}
				}
			});
			return request.send();
		};
		this.del = this._destroy;

		if (this.type == 'object') {
			this._destroyWithConnections = function(options) {
				return this.destroy(_extend({ deleteConnections: true}, options));
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

	global.Appacitive.BaseObject = _BaseObject;

	global.Appacitive.BaseObject._saveAll = function(objects, options, type) {
	    var unsavedObjects = [], tasks = [];
	    
    	options = options || [];

		if (!_type.isArray(objects)) throw new Error("Provide an array of objects for Object.saveAll");	    

	    objects.forEach(function(o) {
	    	if (!(o instanceof global.Appacitive.BaseObject) && _type.isObject(o)) o = new global.Appacitive[type](o);
	    	if (unsavedObjects.find(function(x) { return x.id == o.id; })) return;
	    	unsavedObjects.push(o);

	    	tasks.push(o.save());
	    });

	    return Appacitive.Promise.when(tasks);
	};

	global.Appacitive.BaseObject.prototype.toString = function() {
		return JSON.stringify(this.getObject());
	};


	global.Appacitive.Events.mixin(global.Appacitive.BaseObject.prototype);

})(global);
