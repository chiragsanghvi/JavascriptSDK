(function (global) {

	"use strict";

	var _parseEndpoint = function(endpoint, type, base) {
		var result = { label: endpoint.label };
		if (endpoint.articleid)  result.articleid = endpoint.articleid;
		if (endpoint.article) {
			if (_type.isFunction(endpoint.article.getArticle)) {
				// provided an instance of Appacitive.ArticleCollection
				// stick the whole article if there is no __id
				// else just stick the __id
				if (endpoint.article.get('__id')) result.articleid = endpoint.article.get('__id');
				else result.article = endpoint.article.getArticle();
			} else if (_type.isObject(endpoint.article)) {
				// provided a raw article
				// if there is an __id, just add that
				// else add the entire article
				if (endpoint.article.__id) result.articleid = endpoint.article.__id;
				else result.article = endpoint.article;

				endpoint.article =  new global.Appacitive.Article(endpoint.article);
			} 
		} else {
			if (!result.articleid && !result.article) throw new Error('Incorrectly configured endpoints provided to setupConnection');
		}

		base["endpoint" + type] = endpoint;
		return result;
	};

	var _convertEndpoint = function(endpoint, type, base) {
		if ( endpoint.article && _type.isObject(endpoint.article)) {
			if (!base['endpoint' + type]) {
				base["endpoint" + type] = {};
				base['endpoint' + type].article = new global.Appacitive.Article(endpoint.article, true);
			} else {
				if (base['endpoint' + type] && base['endpoint' + type].article && base['endpoint' + type].article instanceof global.Appacitive.Article)
					base["endpoint" + type].article.copy(endpoint.article, true);
				else 
					base['endpoint' + type].article = new global.Appacitive.Article(endpoint.article, true);
			}
			base["endpoint" + type].articleid = endpoint.article.__id;
			base["endpoint" + type].label = endpoint.label;
			base["endpoint" + type].type = endpoint.type;
		} else {
			base["endpoint" + type] = endpoint;
		}
	};

	global.Appacitive.Connection = function(options, doNotSetup) {
		options = options || {};
		
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

		global.Appacitive.BaseObject.call(this, options, doNotSetup);
		this.type = 'connection';
		this.getConnection = this.getObject;

		this.parseConnection = function() {
			
			var typeA = 'A', typeB ='B';
			if ( options.__endpointa.label.toLowerCase() === this.get('__endpointb').label.toLowerCase() ) {
				if ((options.__endpointa.label.toLowerCase() != options.__endpointb.label.toLowerCase()) && (options.__endpointa.articleid == this.get('__endpointb').articleid || !options.__endpointa.articleid)) {
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

		return this;
	};

	global.Appacitive.Connection.prototype = new global.Appacitive.BaseObject();

	global.Appacitive.Connection.prototype.constructor = global.Appacitive.Connection;

	global.Appacitive.Connection.prototype.setupConnection = function(endpointA, endpointB) {
		
		// validate the endpoints
		if (!endpointA || (!endpointA.articleid &&  !endpointA.article) || !endpointA.label || !endpointB || (!endpointB.articleid && !endpointB.article) || !endpointB.label) {
			throw new Error('Incorrect endpoints configuration passed.');
		}

		// there are two ways to do this
		// either we are provided the article id
		// or a raw article
		// or an Appacitive.Article instance
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

	global.Appacitive.Connection.get = function(options, callbacks) {
		options = options || {};
		if (!options.relation) throw new Error("Specify relation");
		if (!options.id) throw new Error("Specify id to fetch");
		var obj = new global.Appacitive.Connection({ __relationtype: options.relation, __id: options.id });
		obj.fields = options.fields;
		return obj.fetch(callbacks);
	};

    //private function for parsing api connections in sdk connection object
	var _parseConnections = function(connections) {
		var connectionObjects = [];
		if (!connections) connections = [];
		connections.forEach(function(c){
			connectionObjects.push(new global.Appacitive.Connection(c, true));
		});
		return connectionObjects;
	};

	global.Appacitive.Connection._parseConnections = _parseConnections;

	//takes relationname and array of connectionids and returns an array of Appacitive article objects
	global.Appacitive.Connection.multiGet = function(options, callbacks) {
		options = options || {};
		if (!options.relation || !_type.isString(options.relation) || options.relation.length === 0) throw new Error("Specify valid relation");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var request = new global.Appacitive._Request({
			method: 'GET',
			type: 'connection',
			op: 'getMultiGetUrl',
			args: [options.relation, options.ids.join(','), options.fields],
			callbacks: callbacks,
			onSuccess: function(d) {
				request.promise.fulfill(_parseConnections(d.connections));
			}
		});
			
		return request.send();
	};

	//takes relationame, and array of connections ids
	global.Appacitive.Connection.multiDelete = function(options, callbacks) {
		options = options || {};
		
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
	global.Appacitive.Connection.findAll = function(options) {
		return new global.Appacitive.Queries.FindAllQuery(options);
	};

	//takes 1 articleid and multiple aricleids and returns connections between both 
	global.Appacitive.Connection.getInterconnects = function(options) {
		return new global.Appacitive.Queries.InterconnectsQuery(options);
	};

	//takes 2 articleids and returns connections between them
	global.Appacitive.Connection.getBetweenArticles = function(options) {
		return new global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery(options);
	};

	//takes 2 articles and returns connections between them of particluar relationtype
	global.Appacitive.Connection.getBetweenArticlesForRelation = function(options) {
		return new global.Appacitive.Queries.GetConnectionsBetweenArticlesForRelationQuery(options);
	};

})(global);
