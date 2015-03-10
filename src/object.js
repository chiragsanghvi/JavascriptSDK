(function (global) {

	"use strict";

	var Appacitive = global.Appacitive;

	Appacitive.Object = function(attrs, options) {
		attrs = attrs || {};
		options = options || {};

		if (this.className) attrs.__type = this.className;
		
		if (_type.isString(attrs)) attrs = { __type : attrs };

		if (!attrs.__type) throw new Error("Cannot set object without __type");

		if (_type.isBoolean(options)) options = { setSnapShot: true };

		Appacitive.BaseObject.call(this, attrs, options);

		this.type = 'object';
		this.getObject = this.getObject;
		this.children = {};

		this.typeName = attrs.__type;

		this._aclFactory = new Appacitive._Acl(options.__acls, options.setSnapShot);

		this.acls = this._aclFactory.acls;

		if (_type.isFunction(this.initialize)) {
			this.initialize.apply(this, [attrs]);
		}

		return this;
	};

	Appacitive.Object.prototype = new Appacitive.BaseObject();

	Appacitive.Object.prototype.constructor = Appacitive.Object;

	Appacitive.Object.extend = function(typeName, protoProps, staticProps) {
    	
    	if (_type.isObject(typeName)) {
    		staticProps = protoProps;
    		protoProps = typeName;
    		typeName = protoProps.typeName;
    	}

	    if (!_type.isString(typeName) || typeName.length == 0) {
	      throw new Error("Appacitive.Object.extend's first argument should be the type-name.");
	    }

	    var entity = null;
    
	    protoProps = protoProps || {};
	    protoProps.className = typeName;

	    entity = Appacitive._extend(Appacitive.Object, protoProps, staticProps);

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
	      entity = Appacitive.Object.extend(className);
	      __typeMap[className] = entity;
	    }
	    return entity;
	};

	Appacitive.Object._getClass = _getClass;

	Appacitive.Object._create = function(attributes, setSnapshot, typeClass) {
		var entity;
		if (this.className) entity = this;
		else entity = (typeClass) ? typeClass : _getClass(attributes.__type);
		return new entity(attributes).copy(attributes, setSnapshot);
	};

	//private function for parsing objects
	var _parseObjects = function(objects, typeClass, metadata) {
		var tmpObjects = [];
		objects.forEach(function(a) {
			var obj = Appacitive.Object._create(_extend(a, { __meta : metadata }), true, typeClass);
			tmpObjects.push(obj);
		});
		return tmpObjects;
	};

	Appacitive.Object._parseResult = _parseObjects;

	Appacitive.Object.multiDelete = function(attrs, options) {
		attrs = attrs || {};
		options = options || {};
		var models = [];
		if (this.className) attrs.type = this.className;

		if (_type.isArray(attrs) && attrs.length > 0) {
			if (attrs[0] instanceof Appacitive.Object) {
				models = attrs;
				attrs = { 
					type:  models[0].className ,
					ids :  models.map(function(o) { return o.id; }).filter(function(o) { return o; }) 
				};
			} else {
				attrs = {
					type: this.className,
					ids: attrs
				};
			}
		}
		if (!attrs.type || !_type.isString(attrs.type) || attrs.type.length === 0) throw new Error("Specify valid type");
		if (attrs.type.toLowerCase() === 'user' || attrs.type.toLowerCase() === 'device') throw new Error("Cannot delete user and devices using multidelete");
		if (!attrs.ids || attrs.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new Appacitive._Request({
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
	Appacitive.Object.multiGet = function(attrs, options) {
		attrs = attrs || {};
		if (_type.isArray(attrs) && attrs.length > 0) {
			if (attrs[0] instanceof Appacitive.Object) {
				models = attrs;
				attrs = { 
					ids :  models.map(function(o) { return o.id; }).filter(function(o) { return o; }) 
				};
			} else {
				attrs = {
					ids: attrs
				};
			}
		}

		if (this.className) {
			attrs.type = this.className;
			attrs.entity = this;
		}


		if (!attrs.type || !_type.isString(attrs.type) || attrs.type.length === 0) throw new Error("Specify valid type");
		if (!attrs.ids || attrs.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new Appacitive._Request({
			method: 'GET',
			type: 'object',
			op: 'getMultiGetUrl',
			args: [attrs.type, attrs.ids.join(','), attrs.fields],
			options: options,
			onSuccess: function(d) {
				request.promise.fulfill(_parseObjects(d.objects, attrs.entity, d.__meta));
			}
		});
			
		return request.send();
	};

	//takes object id , type and fields and returns that object
	Appacitive.Object.get = function(attrs, options) {
		attrs = attrs || {};
		
		if (_type.isString(attrs) && this.className) {
			attrs = {
				id: attrs
			};
		}

		if (this.className) {
			attrs.type = this.className;
			attrs.entity = this;
		}

		if (!attrs.type) throw new Error("Specify type");
		if (!attrs.id) throw new Error("Specify id to fetch");

		var obj = Appacitive.Object._create({ __type: attrs.type, __id: attrs.id });
		obj.fields = attrs.fields;

		return obj.fetch(options);
	};

    //takes relation type and returns query for it
	Appacitive.Object.prototype.getConnections = function(options) {
		if (this.isNew()) throw new Error("Cannot fetch connections for new object");
		options.objectId = this.get('__id');
		return new Appacitive.Queries.GetConnectionsQuery(options);
	};

	//takes relation type and returns a query for it
	Appacitive.Object.prototype.getConnectedObjects = function(options) {
		if (this.isNew()) throw new Error("Cannot fetch connections for new object");
		options = options || {};
		if (_type.isString(options)) options = { relation: options };
		options.type = this.get('__type');
		options.objectId = this.get('__id');
		options.object = this;
		return new Appacitive.Queries.ConnectedObjectsQuery(options);
	};
	Appacitive.Object.prototype.fetchConnectedObjects = Appacitive.Object.prototype.getConnectedObjects;
	
	// takes type and return a query for it
	Appacitive.Object.findAll = Appacitive.Object.findAllQuery = function(options) {
		options = options || {};
		if (this.className) {
			options.type = this.className;
			options.entity = this;
		}
		return new Appacitive.Queries.FindAllQuery(options);
	};

	Appacitive.Object.saveAll = function(objects, options) {
		return Appacitive.BaseObject._saveAll(objects, options, 'Object');
	};
 
})(global);