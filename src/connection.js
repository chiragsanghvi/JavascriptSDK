(function (global) {

	"use strict";
    
    var Appacitive = global.Appacitive;

	var _parseEndpoint = function(endpoint, type, base) {

		var result = { label: endpoint.label };
		if (endpoint.objectid)  result.objectid = endpoint.objectid;
		
		if (endpoint.object) {
			if (endpoint.object instanceof Appacitive.Object) {
				// provided an instance of Appacitive.ObjectCollection
				// stick the whole object if there is no __id
				// else just stick the __id
				if (endpoint.object.id) result.objectid = endpoint.object.id;
				else  result.object = endpoint.object.getObject();
			} else if (_type.isObject(endpoint.object)) {
				// provided a raw object
				// if there is an __id, just add that
				// else add the entire object
				if (endpoint.object.__id) result.objectid = endpoint.object.__id;
				else result.object = endpoint.object;

				endpoint.object =  Appacitive.Object._create(endpoint.object);
			} 
		} else {
			if (!result.objectid && !result.object) throw new Error('Incorrectly configured endpoints provided to parseConnection');
		}

		result.toJSON = function() {
			var d = _extend({}, this);
			if (d.object) {
				d.object = endpoint.object.toJSON();
				if (endpoint.object._aclFactory) {
					var acls = endpoint.object._aclFactory.toJSON();
					if (acls) d.object.__acls = acls;
				}
			}
			delete d.toJSON;
			return d
		};		

		base["endpoint" + type] = endpoint;
		return result;
	};

	var _convertEndpoint = function(endpoint, type, base, isBatch) {
		if (endpoint.object && _type.isObject(endpoint.object)) {

			if (!isBatch) {

				if (!base['endpoint' + type]) {
					base["endpoint" + type] = {};
					base['endpoint' + type].object = Appacitive.Object._create(endpoint.object, true);
				} else {
					if (base['endpoint' + type] && base['endpoint' + type].object && base['endpoint' + type].object instanceof Appacitive.Object)
						base["endpoint" + type].object.copy(endpoint.object, true);
					else 
						base['endpoint' + type].object = Appacitive.Object._create(endpoint.object, true);
				}

				if (base["endpoint" + type]._aclFactory) {
					base["endpoint" + type]._aclFactory.merge();
				}

				var object = base['endpoint' + type].object;
				object.trigger('change:__id', object, object.id, {});
			}

			base["endpoint" + type].objectid = endpoint.object.__id;
			base["endpoint" + type].label = endpoint.label;
			base["endpoint" + type].type = endpoint.type;

		} else {
			base["endpoint" + type] = endpoint;
		}

		endpoint.toJSON = function() {
			var d = _extend({}, this);
			if (d.object) {
				d.object = base['endpoint' + type].object.toJSON();
				if (base['endpoint' + type].object._aclFactory) {
					var acls = base['endpoint' + type].object._aclFactory.toJSON();
					if (acls) d.object.__acls = acls;
				}
			}
			delete d.toJSON;
			return d
		};
	};

	Appacitive.Connection = function(attrs, options) {
		attrs = attrs || {};
		options = options || {};

		if (this.className) attrs.__relationtype = this.className;
		
		if (_type.isString(attrs)) attrs = { __relationtype : attrs };
		
		if (!attrs.__relationtype && !attrs.relation ) throw new Error("Cannot set connection without relation");

		if (attrs.relation) {
			attrs.__relationtype = attrs.relation;
			delete attrs.relation;
		}

		if (_type.isBoolean(options)) options = { setSnapShot: true };

		if (attrs.endpoints && attrs.endpoints.length === 2) {
			attrs.__endpointa = attrs.endpoints[0];
			attrs.__endpointb = attrs.endpoints[1];
			delete attrs.endpoints;
		}

		Appacitive.BaseObject.call(this, attrs, options);
		this.type = 'connection';
		this.getConnection = this.getObject;

		this.parseConnection = function(isBatch) {
			
			var typeA = 'A', typeB ='B';
			if ( attrs.__endpointa.label.toLowerCase() === this.get('__endpointb').label.toLowerCase() ) {
				if ((attrs.__endpointa.label.toLowerCase() != attrs.__endpointb.label.toLowerCase()) && (attrs.__endpointa.objectid == this.get('__endpointb').objectid || !attrs.__endpointa.objectid)) {
				 	typeA = 'B';
				 	typeB = 'A';
				}
			}

			_convertEndpoint(this.get('__endpointa'), typeA, this, isBatch);
			_convertEndpoint(this.get('__endpointb'), typeB, this, isBatch);

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

		if (options.setSnapShot) {
			this.parseConnection(attrs);
		} else {
			if (attrs.__endpointa && attrs.__endpointb) this.setupConnection(this.get('__endpointa'), this.get('__endpointb'));
		} 

		this.relationName = attrs.__relationtype;

		if (_type.isFunction(this.initialize)) {
			this.initialize.apply(this, [attrs]);
		}

		return this;
	};

	Appacitive.Connection.prototype = new Appacitive.BaseObject();

	Appacitive.Connection.prototype.constructor = Appacitive.Connection;

	Appacitive.Connection.extend = function(relationName, protoProps, staticProps) {
    	
    	if (_type.isObject(relationName)) {
    		staticProps = protoProps;
    		protoProps = relationName;
    		relationName = protoProps.relationName;
    	}


	    if (!_type.isString(relationName)) {
	      throw new Error("Appacitive.Connection.extend's first argument should be the relationName.");
	    }

	    var entity = null;
    
	    protoProps = protoProps || {};
	    protoProps.className = relationName;

	    entity = Appacitive._extend(Appacitive.Connection, protoProps, staticProps);

	    // Do not allow extending a class.
	    delete entity.extend;

	    // Set className in entity class
	    entity.className = relationName;

	    entity.relation = relationName;

	    __relationMap[relationName] = entity;

	    return entity;
	};

	var __relationMap = {};

	var _getClass = function(className) {
	    if (!_type.isString(className)) {
	      throw "_getClass requires a string argument.";
	    }
	    var entity = __relationMap[className];
	    if (!entity) {
	      entity = Appacitive.Connection.extend(className);
	      __relationMap[className] = entity;
	    }
	    return entity;
	};

	Appacitive.Connection._getClass = _getClass;

	Appacitive.Connection._create = function(attributes, setSnapshot, relationClass) {
	    var entity;
		if (this.className) entity = this;
		else entity = (relationClass) ? relationClass : _getClass(attributes.__relationtype);
		return new entity(attributes).copy(attributes, setSnapshot);
	};

    //private function for parsing api connections in sdk connection object
	var _parseConnections = function(connections, relationClass, metadata) {
		var connectionObjects = [];
		if (!connections) connections = [];
		connections.forEach(function(c) {
			connectionObjects.push(Appacitive.Connection._create(_extend(c, { __meta : metadata }), true, relationClass));
		});
		return connectionObjects;
	};

	Appacitive.Connection._parseResult = _parseConnections;


	Appacitive.Connection.prototype.setupConnection = function(endpointA, endpointB) {
		
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
		this.set('__endpointa', _parseEndpoint(endpointA, 'A', this), { silent: true });

		// 2
		this.set('__endpointb', _parseEndpoint(endpointB, 'B', this), { silent: true });

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

	Appacitive.Connection.prototype.get = Appacitive.Connection.get = function(attrs, options) {
		attrs = attrs || {};
		if (_type.isString(attrs) && this.className) {
			attrs = {
				id: attrs
			};
		}

		if (this.className) {
			attrs.relation = this.className;
			attrs.entity = this;
		}
		
		if (!attrs.relation) throw new Error("Specify relation");
		if (!attrs.id) throw new Error("Specify id to fetch");
		var obj = Appacitive.Connection._create({ __relationtype: attrs.relation, __id: attrs.id });
		obj.fields = attrs.fields;
		return obj.fetch(options);
	};

	//takes relationname and array of connectionids and returns an array of Appacitive object objects
	Appacitive.Connection.multiGet = function(attrs, options) {
		attrs = attrs || {};
		
		if (_type.isArray(attrs) && attrs.length > 0) {
			if (attrs[0] instanceof Appacitive.Connection) {
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
			attrs.relation = this.className;
			attrs.entity = this;
		}
		
		if (!attrs.relation || !_type.isString(attrs.relation) || attrs.relation.length === 0) throw new Error("Specify valid relation");
		if (!attrs.ids || attrs.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new Appacitive._Request({
			method: 'GET',
			type: 'connection',
			op: 'getMultiGetUrl',
			args: [attrs.relation, attrs.ids.join(','), attrs.fields],
			options: options,
			onSuccess: function(d) {
				request.promise.fulfill(_parseConnections(d.connections, attrs.entity, d.__meta));
			}
		});
			
		return request.send();
	};

	//takes relationame, and array of connections ids
	Appacitive.Connection.multiDelete = function(attrs, options) {
		attrs = attrs || {};
		options = options || {};
		var models = [];
		if (this.className) attrs.relation = this.className;

		if (_type.isArray(attrs) && attrs.length > 0) {
			if (attrs[0] instanceof Appacitive.Connection) {
				models = attrs;
				attrs = { 
					relation:  models[0].className ,
					ids :  models.map(function(o) { return o.id; }).filter(function(o) { return o; }) 
				};
			} else {
				attrs = {
					relation: this.className,
					ids: attrs
				};
			}
		}
		if (!attrs.relation || !_type.isString(attrs.relation) || attrs.relation.length === 0) throw new Error("Specify valid relation");
		if (!attrs.ids || attrs.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new Appacitive._Request({
			method: 'POST',
			data: { idlist : attrs.ids },
			type: 'connection',
			op: 'getMultiDeleteUrl',
			args: [attrs.relation],
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

	
	//takes relation type and returns all connections for it
	Appacitive.Connection.findAll = Appacitive.Connection.findAllQuery = function(options) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		return new Appacitive.Queries.FindAllQuery(options);
	};

	//takes 1 objectid and multiple aricleids and returns connections between both 
	Appacitive.Connection.interconnectsQuery = Appacitive.Connection.getInterconnects = function(options) {
		return new Appacitive.Queries.InterconnectsQuery(options);
	};

	//takes 2 objectids and returns connections between them
	Appacitive.Connection.betweenObjectsQuery = Appacitive.Connection.getBetweenObjects = function(options) {
		return new Appacitive.Queries.GetConnectionsBetweenObjectsQuery(options);
	};

	//takes 2 objects and returns connections between them of particluar relationtype
	Appacitive.Connection.betweenObjectsForRelationQuery = Appacitive.Connection.getBetweenObjectsForRelation = function(options) {
		options = options || {};
		if (this.className) {
			options.relation = this.className;
			options.entity = this;
		}
		return new Appacitive.Queries.GetConnectionsBetweenObjectsForRelationQuery(options);
	};

	Appacitive.Connection.saveAll = function(objects, options) {
		return Appacitive.BaseObject._saveAll(objects, options, 'Connection');
	};

})(global);
