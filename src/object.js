(function (global) {

	"use strict";

	global.Appacitive.Object = function(attrs, options) {
		attrs = attrs || {};
		options = options || {};

		if (this.className) attrs.__type = this.className;
		
		if (_type.isString(attrs)) attrs = { __type : attrs };

		if (!attrs.__type) throw new Error("Cannot set object without __type");

		if (_type.isBoolean(options)) options = { setSnapShot: true };

		global.Appacitive.BaseObject.call(this, attrs, options);

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

		this.typeName = attrs.__type;

		this._aclFactory = new Appacitive._Acl(options.__acls, options.setSnapShot);

		this.acls = this._aclFactory.acls;

		if (_type.isFunction(this.initialize)) {
			this.initialize.apply(this, [attrs]);
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

	global.Appacitive.Object._getClass = _getClass;

	global.Appacitive.Object._create = function(attributes, setSnapshot, typeClass) {
		var entity;
		if (this.className) entity = this;
		else entity = (typeClass) ? typeClass : _getClass(attributes.__type);
		return new entity(attributes).copy(attributes, setSnapshot);
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

	global.Appacitive.Object.multiDelete = function(attrs, options) {
		attrs = attrs || {};
		options = options || {};
		var models = [];
		if (this.className) attrs.type = this.className;

		if (_type.isArray(attrs) && attrs.length > 0) {
			models = attrs;
			attrs = { 
				type:  models[0].className ,
				ids : models.map(function(o) { return o.id(); }).filter(function(o) { return o; }) 
			};
		}
		if (!attrs.type || !_type.isString(attrs.type) || attrs.type.length === 0) throw new Error("Specify valid type");
		if (attrs.type.toLowerCase() === 'user' || attrs.type.toLowerCase() === 'device') throw new Error("Cannot delete user and devices using multidelete");
		if (!attrs.ids || attrs.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'POST',
			data: { idlist : attrs.ids },
			type: 'object',
			op: 'getMultiDeleteUrl',
			args: [attrs.type],
			options: options,
			onSuccess: function(d) {
				if (options && !options.silent) {
					models.forEach(function(m) {
						m.trigger('destroy', m, m.collection, options);
					});
			    }
				request.promise.fulfill();
			}
		});
		
		return request.send();
	};


	//takes typename and array of objectids and returns an array of Appacitive object objects
	global.Appacitive.Object.multiGet = function(attrs, options) {
		attrs = attrs || {};
		if (this.className) {
			attrs.relation = this.className;
			attrs.entity = this;
		}
		if (!attrs.type || !_type.isString(attrs.type) || attrs.type.length === 0) throw new Error("Specify valid type");
		if (!attrs.ids || attrs.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'object',
			op: 'getMultiGetUrl',
			args: [attrs.type, attrs.ids.join(','), attrs.fields],
			options: options,
			onSuccess: function(d) {
				request.promise.fulfill(_parseObjects(d.objects, attrs.entity));
			}
		});
			
		return request.send();
	};

	//takes object id , type and fields and returns that object
	global.Appacitive.Object.get = function(attrs, options) {
		attrs = attrs || {};
		if (this.className) {
			attrs.relation = this.className;
			attrs.entity = this;
		}
		if (!attrs.type) throw new Error("Specify type");
		if (!attrs.id) throw new Error("Specify id to fetch");

		var obj = global.Appacitive.Object._create({ __type: attrs.type, __id: attrs.id });
		obj.fields = attrs.fields;

		return obj.fetch(attrs, options);
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
