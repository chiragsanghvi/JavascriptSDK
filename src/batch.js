(function(global) {

  	"use strict";

  	var Appacitive = global.Appacitive;

	Appacitive.Batch = function() {
		this.objects = [];
		this.connections = [];
	};

	var _addConnection = function(con) {
		if (this.connections.indexOf(con) == -1) this.connections.push(con);	
	};

	var _addObject = function(obj) {
		if (this.objects.indexOf(obj) == -1) this.objects.push(obj);	
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
			
			var obj = o._findUnsavedChanges();
			if (obj.object) {

				obj.object.__type = o.className;

				var exists = objs.find(function(k) { return  ((o.id && (o.id == k.object.__id)) || (o.cid == k.name)) });
				if (exists) {
					exists.object = obj.object;
					obj = exists;
				} 

				delete obj.isNested;
				if (o.isNew()) obj.name = "" + o.cid;
				else obj.object.__id = o.id;
				
				if (!exists) objs.push(obj);
			}
			
		});

		return objs;
	};

	var _getConnections = function() {
		var that = this, cons = [];
		this.connections.forEach(function(c) {
			
				var con = c._findUnsavedChanges().object;
				if (con) {
					con.__relationtype = c.className;

					if (con.__endpointa) delete con.__endpointa.object;
					if (con.__endpointb) delete con.__endpointb.object
				}

				var epA = c.endpointA.object;
				if (_type.isObject(epA)) {

					if (c.isNew()) {
						if (epA.isNew()) {
							con.__endpointa.name = "" + c.endpointA.object.cid;
						} else {
							con.__endpointa.objectid = c.endpointA.object.id;
						}
					}
					_addEntity.apply(that, [epA]);
				}
				
				var epB = c.endpointB.object;
				if (_type.isObject(epB)) {

					if (c.isNew()) {
						if (epB.isNew()) {
							con.__endpointb.name = "" + c.endpointB.object.cid;
						} else {
							con.__endpointb.objectid = c.endpointB.object.id;
						}
					}

					_addEntity.apply(that, [epB]);
				}

				if (con) {
					var exists = cons.find(function(k) { return  ((c.id && (c.id == k.connection.__id)) || (c.cid == k.name)) });

					var obj = { connection: con };

					if (exists) {
						exists.connection = con;
						obj = exists;
					} 

					if (c.isNew()) obj.name = "" + c.cid;
					else obj.connection.__id = c.id;

					if (!exists) cons.push(obj);
				}
		});

		return cons;
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

	// parse api output to get error info
	var _getOutpuStatus = function(data) {
		data = data || {};
		data.message = data.message || 'Server error';
		data.code = data.code || '500';
		return data;
	};

	var _parseNodes = function(nodes, meta, options) {
		var that = this;
		nodes.forEach(function(n) {
			var obj = n.object;
			var existing = that.objects.forEach(function(o) {
				if (o.cid == n.name || o.id == obj.__id || o.get('__id') == obj.__id) {
					var output = { __meta: meta[o.className] };
					output[o.getType()] = obj;
					o._parseOutput(options, output);
				}
			});
		});
	};

	var _parseEdges = function(edges, meta, options) {
		var that = this;
		edges.forEach(function(e) {
			var con = e.connection;
			var existing = that.connections.forEach(function(c) {
				if (c.cid == e.name || c.id == con.__id || c.get('__id') == con.__id) {
					var output = { __meta: meta[c.className] };
					output[c.getType()] = con;
					c._parseOutput(options, output);
				}
			});
		});
	};

	var _parseOutput = function(data, options) {
		var status;
		if (data && data["edges"] && data["nodes"] && (data["edges"].length >= 0) && (data["nodes"].length >= 0)) {
			_parseNodes.call(this, data["nodes"], data["__meta"]["__type"], options);
			_parseEdges.call(this, data["edges"], data["__meta"]["__rel"], options);

			if (!options.silent) this.trigger('sync', this, { objects: this.objects, connections: this.connections }, options);
		} else {
			data = data || {};
			data.status = data.status || {};
			status = _getOutpuStatus(data.status);

			this._triggerError(options, new Appacitive.Error(status));
		}

		return status;
	};

	Appacitive.Batch.prototype._triggerError = function(options, status) {
		if (!options.silent) this.trigger('error', this, status, options);	
	};

	Appacitive.Batch.prototype.execute = function(options) {
		var data = this.toJSON();
		options = _extend({ _batch: true }, options);
		
		if (data.nodes.length == 0 && data.edges.length == 0) {
			if (!options.silent) this.trigger('sync', this, { objects: this.objects, connections: this.connections }, options);
			return (new Appacitive.Promise()).fulfill(this);
		}

		var that = this;
		var request = new Appacitive._Request({
			method: 'PUT',
			type: 'multi',
			op: 'getBatchUrl',
			data: data,
			options: options,
			entity: this,
			onSuccess: function(response) {
				var status = _parseOutput.apply(that, [response, options]);
				if (!status) {
					request.promise.fulfill(that);
				} else {
					request.promise.reject(status, that)
				}
			}
		});

		return request.send();

	};

	Appacitive.Events.mixin(Appacitive.Batch.prototype);

})(global);

