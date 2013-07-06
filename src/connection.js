(function (global) {

	"use strict";

	var _parseEndpoint = function(endpoint, type, base) {
		var result = { label: endpoint.label };
		if (endpoint.articleid)  result.articleid = endpoint.articleid;
		if (endpoint.article) {
			if (typeof endpoint.article.getArticle == 'function') {
				// provided an instance of Appacitive.ArticleCollection
				// stick the whole article if there is no __id
				// else just stick the __id
				if (endpoint.article.get('__id')) result.articleid = endpoint.article.get('__id');
				else result.article = endpoint.article.getArticle();
			} else if (typeof endpoint.article == 'object' && endpoint.article.__schematype) {
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
		if ( endpoint.article && typeof endpoint.article == 'object') {
			if (!base['endpoint' + type]) {
				base["endpoint" + type] = {};
				base['endpoint' + type].article = new global.Appacitive.Article(endpoint.article);
			} else {
				if (base['endpoint' + type] && base['endpoint' + type].article && base['endpoint' + type].article.getArticle)
					base["endpoint" + type].article.copy(endpoint.article);
				else 
					base['endpoint' + type].article = new global.Appacitive.Article(endpoint.article);
			}
			base["endpoint" + type].articleid = endpoint.articleid;
			base["endpoint" + type].label = endpoint.label;
			base["endpoint" + type].type = endpoint.type;

			base["endpoint" + type].article.___collection = base.___collection;
		} else {
			base["endpoint" + type] = endpoint;
		}
	};

	global.Appacitive.Connection = function(options, doNotSetup) {
		options = options || {};
		
		if (typeof options == 'string') {
			var rName = options;
			options = { __relationtype : rName };
		}

		if (!options.__relationtype && !options.relation ) throw new error("Cannot set connection without relation");

		if (options.relation) {
			options.__relationtype = options.relation;
			delete options.relation;
		}

		if (options.endpoints && options.endpoints.length == 2) {
			options.__endpointa = options.endpoints[0];
			options.__endpointb = options.endpoints[1];
			delete options.endpoints;
		}

		global.Appacitive.BaseObject.call(this, options);
		this.type = 'connection';
		this.getConnection = this.getObject;

		this.parseConnection = function() {
			
			var typeA = 'A', typeB ='B';
			if ( options.__endpointa.label == this.get('__endpointb').label ) {
				if ((options.__endpointa.label != options.__endpointb.label) && (options.__endpointa.articleid == this.get('__endpointb').articleid || !options.__endpointa.articleid)) {
				 	typeA = 'B', typeB = 'A';
				}
			}

			_convertEndpoint(this.get('__endpointa'), typeA, this);
			_convertEndpoint(this.get('__endpointb'), typeB, this);

			this.__defineGetter__('endpoints', function() {
				var endpoints = [];
				endpoints.push(this.endpointA);
				endpoints.push(this.endpointB);
				return endpoints;
			});

			return this;
		};

		if (doNotSetup) {
			this.__defineGetter__('connectedArticle', function() {
				if (!this.___collection.connectedArticle) {
					throw new Error('connectedArticle can be accessed only by using the getConnectedArticles call');
				}
				var articleId = this.___collection.connectedArticle.get('__id');
				if (!articleId) return null;
				var otherArticleId = this.getConnection().__endpointa.articleid;
				if (this.getConnection().__endpointa.articleid == articleId)
					otherArticleId = this.getConnection().__endpointb.articleid;
				return this.___collection.getConnectedArticle(otherArticleId);

			});
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
	};

	global.Appacitive.Connection.get = function(options, onSuccess, onError) {
		options = options || {};
		if (!options.relation) throw new Error("Specify relation");
		if (!options.id) throw new Error("Specify id to fetch");
		var obj = new global.Appacitive.Connection({ __relationtype: options.relation, __id: options.id });
		obj.fields = options.fields;
		obj.fetch(onSuccess, onError);
	};

    //private function for parsing api connections in sdk connection object
	var _parseConnections = function(connections) {
		var connectionObjects = [];
		if (!connections) connections = [];
		connections.forEach(function(c){
			connectionObjects.push(new global.Appacitive.Connection(c));
		});
		return connectionObjects;
	};

	//private function for firing a request
	var _fetch = function(request, onSuccess, onError) {
		request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
			   if (typeof onSuccess == 'function') onSuccess(_parseConnections(d.connections), d.paginginfo);
			} else {
				d = d || {};
				if (typeof onError == 'function') onError(d.status || { message : 'Server error', code: 400 });
			}
		};
		request.onError = function(d) {
			d = d || { message : 'Server error', code: 400 };
			if (typeof onError == 'function') onError(d);
		};
		global.Appacitive.http.send(request);
	};

	//takes relationname and array of connectionids and returns an array of Appacitive article objects
	global.Appacitive.Connection.multiGet = function(options, onSuccess, onError) {
		options = options || {};
		if (!options.relation || typeof options.relation!= 'string' || options.relation.length == 0) throw new Error("Specify valid relation");
		if (options.ids && options.ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.connection.getMultiGetUrl(options.relation, options.ids.join(','), options.fields);
			request.method = 'get';
			return _fetch(request, onSuccess, onError); 
		} else { 
			if (typeof onSuccess == 'function') onSuccess([]);
		}
	};

	//takes relationame, and array of connections ids
	global.Appacitive.Connection.multiDelete = function(options, onSuccess, onError) {
		options = options || {};
		
		if (!options.relation || typeof options.relation!= 'string' || options.relation.length == 0) throw new Error("Specify valid relation");

		if (options.ids && options.ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.connection.getMultiDeleteUrl(options.relation);
			request.method = 'post';
			request.data = { idlist : options.ids };
			request.onSuccess = function(d) {
				if (d && d.code == '200') {
					if (typeof onSuccess == 'function') onSuccess();
				} else {
					d = d || {};
					if (typeof onError == 'function') onError(d || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError == 'function') onError(d || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else onSuccess();
	};

	//takes 1 articleid and multiple aricleids and returns connections between both 
	global.Appacitive.Connection.getInterconnects = function(options, onSuccess, onError) {
		var q = new Appacitive.Queries.InterconnectsQuery(options);
		_fetch(q.toRequest(), request, onSuccess, onError);
	};

	//takes 2 articleids and returns connections between them
	global.Appacitive.Connection.getBetweenArticles = function(options, onSuccess, onError) {
		var q = new Appacitive.Queries.GetConnectionsBetweenArticlesQuery(options);
		_fetch(q.toRequest(), onSuccess, onError);
	};

	//takes 2 articles and returns connections between them of particluar relationtype
	global.Appacitive.Connection.getBetweenArticlesForRelation = function(options, onSuccess, onError) {
		new Appacitive.Queries.GetConnectionsBetweenArticlesForRelationQuery(options).fetch(onSuccess, onError);
	};

})(global);