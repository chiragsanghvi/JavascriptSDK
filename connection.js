(function (global) {

	"use strict";

	var parseEndpoint = function(endpoint, type, base) {
		var result = {
			label: endpoint.label
		};

		if (endpoint.articleid) {
			// provided an article id
			result.articleid = endpoint.articleid;
		} 
		if (endpoint.article) {
			if (typeof endpoint.article.getArticle == 'function') {
				// provided an instance of Appacitive.ArticleCollection
				// stick the whole article if there is no __id
				// else just stick the __id
				if (endpoint.article.get('__id')) {
					result.articleid = endpoint.article.get('__id');
				} else {
					result.article = endpoint.article.getArticle();
				}
			} else if (typeof endpoint.article == 'object' && endpoint.article.__schematype) {
				// provided a raw article
				// if there is an __id, just add that
				// else add the entire article
				if (endpoint.article.__id) {
					result.articleid = endpoint.article.__id;
				} else {
					result.article = endpoint.article;
				}
				endpoint.article =  new Appacitive.Article(endpoint.article);
			} 
		} else {
			if (!result.articleid && !result.article)
				throw new Error('Incorrectly configured endpoints provided to setupConnection');
		}

		base["endpoint" + type] = endpoint;
		
		return result;
	};

	var convertEndpoint = function(endpoint, type, base) {
		if ( base.get('__endpoint' + type.toLowerCase()).article && typeof base.get('__endpoint' + type.toLowerCase()).article == 'object') {
			if (!base['endpoint' + type]) {
				base["endpoint" + type] = {};
				base['endpoint' + type].article = new global.Appacitive.Article(base.get('__endpoint' + type.toLowerCase()).article);
			} else {
				if (base['endpoint' + type] && base['endpoint' + type].article && base['endpoint' + type].article.getArticle)
					base["endpoint" + type].article.copy(base.get('__endpointb').article);
				else 
					base['endpoint' + type].article = new global.Appacitive.Article(base.get('__endpoint' + type.toLowerCase()).article);
			}
			base["endpoint" + type].articleid = base.get('__endpoint' + type.toLowerCase()).articleid;
			base["endpoint" + type].label = base.get('__endpoint' + type.toLowerCase()).label;
			base["endpoint" + type].type = base.get('__endpoint' + type.toLowerCase()).type;

			base["endpoint" + type].article.___collection = base.___collection;
			delete base.get('__endpoint' + type.toLowerCase()).article
		} else {
			base["endpoint" + type] = base.get('__endpoint' + type.toLowerCase());
		}
	};

	global.Appacitive.Connection = function(options, doNotSetup) {

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

		var base = new global.Appacitive.BaseObject(options);
		base.type = 'connection';
		base.getConnection = base.getObject;

		// helper method for setting up the connection
		base.setupConnection = function(endpointA, endpointB) {
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
			base.set('__endpointa', parseEndpoint(endpointA, 'A', base));

			// 2
			base.set('__endpointb', parseEndpoint(endpointB, 'B', base));
		};


		base.parseConnection = function() {

			var typeA = 'A', typeB ='B';
			if ( options.__endpointa.label == this.get('__endpointb').label ) {
				if (options.__endpointa.articleid == this.get('__endpointb').articleid)
					typeA = 'B', typeB = 'A';
			}

			convertEndpoint(this.get('__endpointa'), typeA, base);
			convertEndpoint(this.get('__endpointb'), typeB, base);

			base.__defineGetter__('endpoints', function() {
				var endpoints = [];
				endpoints.push(this.endpointA);
				endpoints.push(this.endpointB);
				return endpoints;
			});

			return base;
		};

		if (doNotSetup) {
			base.__defineGetter__('connectedArticle', function() {
				if (!base.___collection.connectedArticle) {
					throw new Error('connectedArticle can be accessed only by using the getConnectedArticles call');
				}
				var articleId = base.___collection.connectedArticle.get('__id');
				if (!articleId) return null;
				var otherArticleId = base.getConnection().__endpointa.articleid;
				if (base.getConnection().__endpointa.articleid == articleId)
					otherArticleId = base.getConnection().__endpointb.articleid;
				return base.___collection.getConnectedArticle(otherArticleId);

			});
			base.parseConnection();
		} else {
			if (options.__endpointa && options.__endpointb)
				base.setupConnection(base.get('__endpointa'), base.get('__endpointb'));
		} 

		return base;
	};

	global.Appacitive.Connection.get = function(relationName, id, onSuccess, onError, fields) {
		if (!relationName) throw new Error("Specify relationName");
		if (!id) throw new Error("Specify id to fetch");
		var obj = new global.Appacitive.Connection({ __relationtype: relationName, __id: id });
		obj.fields = fields;
		obj.fetch(onSuccess, onError);
	};

	//takes relationame, and array of connections ids
	global.Appacitive.Connection.multiDelete = function(relationName, ids, onSuccess, onError) {
		if (!relationName || typeof relationName!= 'string' || relationName.length == 0) throw new Error("Specify relationName");

		if (ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.connection.getMultiDeleteUrl(relationName);
			request.method = 'post';
			request.data = { idlist : ids };
			request.onSuccess = function(d) {
				if (d && d.code == '200') {
					onSuccess();
				} else {
					d = d || {};
					onError(d || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				onError(d || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else onSuccess();
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
			d = d || {};
			if (typeof onError == 'function') onError(d.status || { message : 'Server error', code: 400 });
		};
		global.Appacitive.http.send(request);
	};

	//takes relationname and array of connectionids and returns an array of Appacitive article objects
	global.Appacitive.Connection.multiGet = function(relationName, ids, onSuccess, onError, fields) {
		if (!relationName || typeof relationName!= 'string' || relationName.length == 0) throw new Error("Specify relationName");
		if (!ids || typeof ids !== 'object' || !(ids.length > 0)) throw new Error('Specify list of ids for multiget');
		var request = new global.Appacitive.HttpRequest();
		request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.connection.getMultiGetUrl(relationName, ids.join(','), fields ? fields : '');
		request.method = 'get';
		_fetch(request, onSuccess, onError);
	};

	//takes 1 articleid and multiple aricleids and returns connections between both 
	global.Appacitive.Connection.getInterconnects = function(articleAId, articleBIds, onSuccess, onError, fields) {
		var q = new Appacitive.Queries.InterconnectsQuery({ articleAId :  articleAId, articleBIds: articleBIds });
		q.fields = fields ? fields : '';
		var request = q.toRequest();
		_fetch(request, onSuccess, onError);
	};

	//takes 2 articles and returns connections between them
	global.Appacitive.Connection.getBetweenArticles = function(articleAId, articleBId, onSuccess, onError, fields) {
		var q = new Appacitive.Queries.GetConnectionsBetweenArticlesQuery({ articleAId :  articleAId, articleBId: articleBId });
		q.fields = fields ? fields : '';
		var request = q.toRequest();
		_fetch(request, onSuccess, onError);
	};

	//takes 2 articles and returns connections between them of particluar relationtype
	global.Appacitive.Connection.getBetweenArticlesForRelation = function(articleAId, articleBId, relationName, onSuccess, onError, fields) {
		var q = new Appacitive.Queries.GetConnectionsBetweenArticlesForRelationQuery({ articleAId :  articleAId, articleBId: articleBId, relation: relationName });
		q.fields = fields ? fields : '';
		var request = q.toRequest();
		request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
			   if (typeof onSuccess == 'function') {
			     var conn = d.connection ? new global.Appacitive.Connection(d.connection) : null;
			     onSuccess(conn);
			   }
			} else {
				d = d || {};
				if (typeof onError == 'function') onError(d.status || { message : 'Server error', code: 400 });
			}
		};
		request.onError = function(d) {
			d = d || {};
			if (typeof onError == 'function') onError(d.status || { message : 'Server error', code: 400 });
		};
		global.Appacitive.http.send(request);
	};

})(global);