(function(global) {

  	"use strict";

  	var Appacitive = global.Appacitive;

	Appacitive.Batch = function() {
		this.objects = [];
		this.connections = [];
	};

	var _addConnection = function(con) {
		if (!this.connections.indexOf(obj)) this.connections.push(con);	
	};

	var _addObject = function(obj) {
		if (!this.objects.indexOf(obj)) this.objects.push(obj);	
	};

	var _addEntity = function(entity) {
		if (_type.isObject(entity)) {
			if (entity instanceof Appacitive.Object) {
				return _addObject.apply(this, [entity]);
			} else if (entity instanceof Appacitive.Connection) {
				return _addConnection.apply(this, [entity]);
			}
		}
		throw new Error("Batch accepts only Appacitive.Object and Appacitive.Connection instances");
	};

	var _getObjects = function() {
		var objs = [];
		var that = this;

		this.objects.forEach(function(o, i) {
			if (!objs.find(function(k) { return  (o.__id == k.__id) })) {
				var obj = o._findUnsavedChanges();
				if (obj.object) {
					delete obj.isNested;
					if (o.isNew()) obj.name = o.cid;
					objs.push(obj);
				}
			}
		});

	};

	var _getConnections = function() {
		var that = this;
		var cons = [];
		this.connections.forEach(function(c) {
			var con = c._findUnsavedChanges().object;
			if (con) {
				delete con.__endpointb.object;
				delete con.__endpointb.object
					
				var epA = c.endpointA.object;
				if (_type.isObject(epA) {

					delete con.__endpointa.object;
					if (epA.isNew()) {
						con.__endpointa.name = c.endpointA.object.cid;
					}

					_addEntity(epA);
				}
				
				var epB = c.endpointB.object;
				if (_type.isObject(epB) {

					delete con.__endpointa.object;
					if (epA.isNew()) {
						con.__endpointb.name = c.endpointB.object.cid;
					}

					_addEntity(epB);
				}

				var obj = { connection: con };
				if (c.isNew()) obj.name = c.cid;

				this.connections.push(obj);
			}
		});
	};

	Appacitive.Batch.prototype.add = function() {

		var that = this;

		if (_type.isArray(arguments[0])) {
			arguments[0].forEach(function(entity) {
				_addEntity.apply(that, [entity]);
			});
		} else {
			_addEntity.apply(this, arguments);
		}

		return this;
	};

	Appacitive.Batch.prototype.toJSON = function() {
		var json = { nodes: [], edges: [] };

		json.edges = _getConnections.apply(this, []);
		json.nodes = _getObjects.apply(this, []);

		return json;
	};

	Appacitive.Batch.prototype.execute = function(options) {
		var data = this.toJSON();

		var request = new Appacitive._Request({
			method: 'PUT',
			type: 'object',
			op: 'getBatchUrl',
			data: data,
			options: options,
			entity: this,
			onSuccess: function(data) {
				var status = _parseOutput(options, data);
				if (!status) {
					promise.fulfill(that);
				} else {
					promise.reject(status, that)
				}
			}
		});

		return request.send();

	};


})(global);

