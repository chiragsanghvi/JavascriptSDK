(function (global) {

	"use strict";

	var _parseEndpoint = function(endpoint, type, base) {
		var result = { label: endpoint.label };
		if (endpoint.objectid)  result.objectid = endpoint.objectid;
		if (endpoint.object) {
			if (endpoint.object instanceof global.Appacitive.Object) {
				// provided an instance of Appacitive.ObjectCollection
				// stick the whole object if there is no __id
				// else just stick the __id
				if (endpoint.object.id()) result.objectid = endpoint.object.id();
				else result.object = endpoint.object.getObject();
			} else if (_type.isObject(endpoint.object)) {
				// provided a raw object
				// if there is an __id, just add that
				// else add the entire object
				if (endpoint.object.__id) result.objectid = endpoint.object.__id;
				else result.object = endpoint.object;

				endpoint.object =  global.Appacitive.Object._create(endpoint.object);
			} 
		} else {
			if (!result.objectid && !result.object) throw new Error('Incorrectly configured endpoints provided to parseConnection');
		}

		base["endpoint" + type] = endpoint;
		return result;
	};

	var _convertEndpoint = function(endpoint, type, base) {
		if ( endpoint.object && _type.isObject(endpoint.object)) {
			if (!base['endpoint' + type]) {
				base["endpoint" + type] = {};
				base['endpoint' + type].object = global.Appacitive.Object._create(endpoint.object, true);
			} else {
				if (base['endpoint' + type] && base['endpoint' + type].object && base['endpoint' + type].object instanceof global.Appacitive.Object)
					base["endpoint" + type].object.copy(endpoint.object, true);
				else 
					base['endpoint' + type].object = global.Appacitive.Object._create(endpoint.object, true);
			}
			base["endpoint" + type].objectid = endpoint.object.__id;
			base["endpoint" + type].label = endpoint.label;
			base["endpoint" + type].type = endpoint.type;
		} else {
			base["endpoint" + type] = endpoint;
		}
	};

	global.Appacitive.Connection = function(options, doNotSetup) {
		options = options || {};
		
		if (this.className) {
			options.__relationtype = this.className;
		}

		if (_type.isString(options)) {
			var rName = options;
			options = { __relationtype : rName };
		}

		if (!options.__relationtype && !options.relation ) throw new Error("Cannot set connection without relation");

		if (options.relation) {
			options.__relationtype = options.relation;
			delete options.relation;
		}

		if (options.endpoints && options.endpoints.length === 2) {
			options.__endpointa = options.endpoints[0];
			options.__endpointb = options.endpoints[1];
			delete options.endpoints;
		}

		if (_type.isObject(this.defaults) && !doNotSetup) {
			for (var o in this.defaults) {
				if (!options[o]) options[o] = this.defaults[o];
			}
		}

		global.Appacitive.BaseObject.call(this, options, doNotSetup);
		this.type = 'connection';
		this.getConnection = this.getObject;

		this.parseConnection = function() {
			
			var typeA = 'A', typeB ='B';
			if ( options.__endpointa.label.toLowerCase() === this.get('__endpointb').label.toLowerCase() ) {
				if ((options.__endpointa.label.toLowerCase() != options.__endpointb.label.toLowerCase()) && (options.__endpointa.objectid == this.get('__endpointb').objectid || !options.__endpointa.objectid)) {
				 	typeA = 'B';
				 	typeB = 'A';
				}
			}

			_convertEndpoint(this.get('__endpointa'), typeA, this);
			_convertEndpoint(this.get('__endpointb'), typeB, this);

			this.endpoints = function() {
				if (arguments.length === 1 && _type.isString(arguments[0])) {
					if (this.endpointA.label.toLowerCase() === arguments[0].toLowerCase()) return this.endpointA;
					else if (this.endpointB.label.toLowerCase() === arguments[0].toLowerCase()) return this.endpointB;
					else throw new Error("Invalid label provided");
				}
				var endpoints = [];
				endpoints.push(this.endpointA);
				endpoints.push(this.endpointB);
				return endpoints;
			};

			return this;
		};

		if (doNotSetup) {
			this.parseConnection(options);
		} else {
			if (options.__endpointa && options.__endpointb) this.setupConnection(this.get('__endpointa'), this.get('__endpointb'));
		} 

		this.relationName = options.__relationtype;

		if (_type.isFunction(this.initialize)) {
			this.initialize.apply(this, [options]);
		}

		return this;
	};

	global.Appacitive.Connection.prototype = new global.Appacitive.BaseObject();

	global.Appacitive.Connection.prototype.constructor = global.Appacitive.Connection;

	global.Appacitive.Connection.extend = function(typeName, protoProps, staticProps) {
    
	    if (!_type.isString(typeName)) {
	      throw new Error("Appacitive.Connection.extend's first argument should be the relation-name.");
	    }

	    var entity = null;
    
	    protoProps = protoProps || {};
	    protoProps.className = typeName;

	    entity = global.Appacitive._extend(global.Appacitive.Connection, protoProps, staticProps);

	    // Do not allow extending a class.
	    delete entity.extend;

	    // Set className in entity class
	    entity.className = typeName;

	    entity.relation = typeName;

	    __relationMap[typeName] = entity;

	    return entity;
	};

	var __relationMap = {};

	var _getClass = function(className) {
	    if (!_type.isString(className)) {
	      throw "_getClass requires a string argument.";
	    }
	    var entity = __relationMap[className];
	    if (!entity) {
	      entity = global.Appacitive.Connection.extend(className);
	      __relationMap[className] = entity;
	    }
	    return entity;
	};

	global.Appacitive.Connection._create = function(attributes, setSnapshot, relationClass) {
	    var entity;
		if (this.className) {
			entity = this;
		} else {
			entity = (relationClass) ? relationClass : _getClass(attributes.__relationtype);
		}
	    if (setSnapshot == true) return new entity(attributes).copy(attributes, setSnapshot);
		return new entity(attributes).copy(attributes);
	};

    //private function for parsing api connections in sdk connection object
	var _parseConnections = function(connections, relationClass) {
		var connectionObjects = [];
		if (!connections) connections = [];
		connections.forEach(function(c) {
			connectionObjects.push(global.Appacitive.Connection._create(c, true, relationClass));
		});
		return connectionObjects;
	};

	global.Appacitive.Connection._parseResult = _parseConnections;


	global.Appacitive.Connection.prototype.setupConnection = function(endpointA, endpointB) {
		
		// validate the endpoints
		if (!endpointA || (!endpointA.objectid &&  !endpointA.object) || !endpointA.label || !endpointB || (!endpointB.objectid && !endpointB.object) || !endpointB.label) {
			throw new Error('Incorrect endpoints configuration passed.');
		}

		// there are two ways to do this
		// either we are provided the object id
		// or a raw object
		// or an Appacitive.Object instance
		// sigh
		
		// 1
		this.set('__endpointa', _parseEndpoint(endpointA, 'A', this));

		// 2
		this.set('__endpointb', _parseEndpoint(endpointB, 'B', this));

		// 3
		this.endpoints = function() {

			if (arguments.length === 1 && _type.isString(arguments[0])) {
				if (this.endpointA.label.toLowerCase() === arguments[0].toLowerCase()) return this.endpointA;
				else if (this.endpointB.label.toLowerCase() === arguments[0].toLowerCase()) return this.endpointB;
				else throw new Error("Invalid label provided");
			}

			var endpoints = [];
			endpoints.push(this.endpointA);
			endpoints.push(this.endpointB);
			return endpoints;
		};

	};

	global.Appacitive.Connection.prototype.get = global.Appacitive.Connection.get = function(options, callbacks) {
		options = options || {};
		if (this.className) options.relation = this.className;
		if (!options.relation) throw new Error("Specify relation");
		if (!options.id) throw new Error("Specify id to fetch");
		var obj = global.Appacitive.Connection._create({ __relationtype: options.relation, __id: options.id });
		obj.fields = options.fields;
		return obj.fetch(callbacks);
	};

	//takes relationname and array of connectionids and returns an array of Appacitive object objects
	global.Appacitive.Connection.multiGet = function(options, callbacks) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		if (!options.relation || !_type.isString(options.relation) || options.relation.length === 0) throw new Error("Specify valid relation");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'connection',
			op: 'getMultiGetUrl',
			args: [options.relation, options.ids.join(','), options.fields],
			callbacks: callbacks,
			onSuccess: function(d) {
				request.promise.fulfill(_parseConnections(d.connections, options.entity));
			}
		});
			
		return request.send();
	};

	//takes relationame, and array of connections ids
	global.Appacitive.Connection.multiDelete = function(options, callbacks) {
		options = options || {};
		if (this.className) options.relation = this.className;
		if (!options.relation || !_type.isString(options.relation) || options.relation.length === 0) throw new Error("Specify valid relation");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to get");
		
		var request = new global.Appacitive._Request({
			method: 'POST',
			data: { idlist : options.ids },
			type: 'connection',
			op: 'getMultiDeleteUrl',
			args: [options.relation],
			callbacks: callbacks,
			onSuccess: function(d) {
				request.promise.fulfill();
			}
		});
		
		return request.send();
	};

	//takes relation type and returns all connections for it
	global.Appacitive.Connection.findAll = global.Appacitive.Connection.findAllQuery = function(options) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		return new global.Appacitive.Queries.FindAllQuery(options);
	};

	//takes 1 objectid and multiple aricleids and returns connections between both 
	global.Appacitive.Connection.interconnectsQuery = global.Appacitive.Connection.getInterconnects = function(options) {
		return new global.Appacitive.Queries.InterconnectsQuery(options);
	};

	//takes 2 objectids and returns connections between them
	global.Appacitive.Connection.betweenObjectsQuery = global.Appacitive.Connection.getBetweenObjects = function(options) {
		return new global.Appacitive.Queries.GetConnectionsBetweenObjectsQuery(options);
	};

	//takes 2 objects and returns connections between them of particluar relationtype
	global.Appacitive.Connection.betweenObjectsForRelationQuery = global.Appacitive.Connection.getBetweenObjectsForRelation = function(options) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		return new global.Appacitive.Queries.GetConnectionsBetweenObjectsForRelationQuery(options);
	};

})(global);
