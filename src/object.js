(function (global) {

	"use strict";

	global.Appacitive.Object = function(options, setSnapShot) {
		options = options || {};

		if (this.className) {
			options.__type = this.className;
		}

		if (_type.isString(options)) {
			var sName = options;
			options = { __type : sName };
		}

		if (!options.__type) throw new Error("Cannot set object without __type");
		

		if (_type.isObject(this.defaults) && !setSnapShot) {
			for (var o in this.defaults) {
				if (!options[o]) options[o] = this.defaults[o];
			}
		}

		global.Appacitive.BaseObject.call(this, options, setSnapShot);

		this.type = 'object';
		this.getObject = this.getObject;
		this.children = {};

		this.toJSON = function(recursive) {
			if (recursive) {
				var parseChildren = function(root) {
					var objects = [];
					root.forEach(function(obj) {
						var tmp = obj.getObject();
						if (obj.children && !Object.isEmpty(obj.children)) {
							tmp.children = {};
							for (var c in obj.children) {
								tmp.children[c] = parseChildren(obj.children[c]);
							}
						}
						if (obj.connection) tmp.__connection = obj.connection.toJSON();
						objects.push(tmp);
					});
					return objects;
				};
				return parseChildren([this])[0];
			} else {
				return this.getObject();
			}
		};

		this.typeName = options.__type;

		if (_type.isFunction(this.initialize)) {
			this.initialize.apply(this, [options]);
		}

		return this;
	};

	global.Appacitive.Object.prototype = new global.Appacitive.BaseObject();

	global.Appacitive.Object.prototype.constructor = global.Appacitive.Object;

	global.Appacitive.Object.extend = function(typeName, protoProps, staticProps) {
    
	    if (!_type.isString(typeName)) {
	      throw new Error("Appacitive.Object.extend's first argument should be the type-name.");
	    }

	    var entity = null;
    
	    protoProps = protoProps || {};
	    protoProps.className = typeName;

	    entity = global.Appacitive._extend(global.Appacitive.Object, protoProps, staticProps);

	    // Do not allow extending a class.
	    delete entity.extend;

	    // Set className in entity class
	    entity.className = typeName;

	    entity.type = typeName;

	    __typeMap[typeName] = entity;

	    return entity;
	};

	var __typeMap = {};

	var _getClass = function(className) {
	    if (!_type.isString(className)) {
	      throw "_getClass requires a string argument.";
	    }
	    var entity = __typeMap[className];
	    if (!entity) {
	      entity = global.Appacitive.Object.extend(className);
	      __typeMap[className] = entity;
	    }
	    return entity;
	};

	global.Appacitive.Object._create = function(attributes, setSnapshot, typeClass) {
		var entity;
		if (this.className) {
			entity = this;
		} else {
			entity = (typeClass) ? typeClass : _getClass(attributes.__type);
		}
	    if (setSnapshot == true) return new entity(attributes).copy(attributes, setSnapshot);
		return new entity(attributes).copy(attributes);
	};

	//private function for parsing objects
	var _parseObjects = function(objects, typeClass) {
		var tmpObjects = [];
		objects.forEach(function(a) {
			var obj = global.Appacitive.Object._create(a, true, typeClass);
			tmpObjects.push(obj);
		});
		return tmpObjects;
	};

	global.Appacitive.Object._parseResult = _parseObjects;

	global.Appacitive.Object.multiDelete = function(options, callbacks) {
		options = options || {};
		if (this.className) options.type = this.className;
		if (!options.type || !_type.isString(options.type) || options.type.length === 0) throw new Error("Specify valid type");
		if (options.type.toLowerCase() === 'user' || options.type.toLowerCase() === 'device') throw new Error("Cannot delete user and devices using multidelete");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'POST',
			data: { idlist : options.ids },
			type: 'object',
			op: 'getMultiDeleteUrl',
			args: [options.type],
			callbacks: callbacks,
			onSuccess: function(d) {
				request.promise.fulfill();
			}
		});
		
		return request.send();
	};


	//takes typename and array of objectids and returns an array of Appacitive object objects
	global.Appacitive.Object.multiGet = function(options, callbacks) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		if (!options.type || !_type.isString(options.type) || options.type.length === 0) throw new Error("Specify valid type");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'object',
			op: 'getMultiGetUrl',
			args: [options.type, options.ids.join(','), options.fields],
			callbacks: callbacks,
			onSuccess: function(d) {
				request.promise.fulfill(_parseObjects(d.objects, options.entity));
			}
		});
			
		return request.send();
	};

	//takes object id , type and fields and returns that object
	global.Appacitive.Object.get = function(options, callbacks) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		if (!options.type) throw new Error("Specify type");
		if (!options.id) throw new Error("Specify id to fetch");

		var obj = global.Appacitive.Object._create({ __type: options.type, __id: options.id });
		obj.fields = options.fields;

		return obj.fetch(callbacks);
	};

    //takes relation type and returns query for it
	global.Appacitive.Object.prototype.getConnections = function(options) {
		if (this.isNew()) throw new Error("Cannot fetch connections for new object");
		options.objectId = this.get('__id');
		return new global.Appacitive.Queries.GetConnectionsQuery(options);
	};

	//takes relation type and returns a query for it
	global.Appacitive.Object.prototype.getConnectedObjects = function(options) {
		if (this.isNew()) throw new Error("Cannot fetch connections for new object");
		options = options || {};
		if (_type.isString(options)) options = { relation: options };
		options.type = this.get('__type');
		options.objectId = this.get('__id');
		options.object = this;
		return new global.Appacitive.Queries.ConnectedObjectsQuery(options);
	};
	global.Appacitive.Object.prototype.fetchConnectedObjects = global.Appacitive.Object.prototype.getConnectedObjects;
	
	// takes type and return a query for it
	global.Appacitive.Object.findAll = global.Appacitive.Object.findAllQuery = function(options) {
		options = options || {};
		if (this.className) {
			options.type = this.className;
			options.entity = this;
		}
		return new global.Appacitive.Queries.FindAllQuery(options);
	};

})(global);
