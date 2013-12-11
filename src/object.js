(function (global) {

	"use strict";

	global.Appacitive.Object = function(options, setSnapShot) {
		options = options || {};

		if (_type.isString(options)) {
			var sName = options;
			options = { __type : sName };
		}

		if (!options.__type) throw new Error("Cannot set object without __type");
		
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
		return this;
	};

	global.Appacitive.Object.prototype = new global.Appacitive.BaseObject();

	global.Appacitive.Object.prototype.constructor = global.Appacitive.Object;

	//private function for parsing objects
	var _parseObjects = function(objects) {
		var tmpObjects = [];
		objects.forEach(function(a) {
			tmpObjects.push(new global.Appacitive.Object(a, true));
		});
		return tmpObjects;
	};

	global.Appacitive._parseObjects = _parseObjects;

	global.Appacitive.Object.multiDelete = function(options, callbacks) {
		options = options || {};
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


	//takes relationaname and array of objectids and returns an array of Appacitive object objects
	global.Appacitive.Object.multiGet = function(options, callbacks) {
		options = options || {};
		if (!options.type || !_type.isString(options.type) || options.type.length === 0) throw new Error("Specify valid type");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'object',
			op: 'getMultiGetUrl',
			args: [options.type, options.ids.join(','), options.fields],
			callbacks: callbacks,
			onSuccess: function(d) {
				request.promise.fulfill(_parseObjects(d.objects));
			}
		});
			
		return request.send();
	};

	//takes object id , type and fields and returns that object
	global.Appacitive.Object.get = function(options, callbacks) {
		options = options || {};
		if (!options.type) throw new Error("Specify type");
		if (!options.id) throw new Error("Specify id to fetch");

		var obj = {};
		if (options.type.toLowerCase() === 'user') obj = new global.Appacitive.User({ __id: options.id });
		else obj = new global.Appacitive.Object({ __type: options.type, __id: options.id });
		
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
	global.Appacitive.Object.findAll = function(options) {
		return new global.Appacitive.Queries.FindAllQuery(options);
	};

})(global);
