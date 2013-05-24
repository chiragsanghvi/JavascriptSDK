(function (global) {

	"use strict";

	var parseEndpoint = function(endpoint, type, base) {
		var result = {
			label: endpoint.label
		};

		if (endpoint.articleid) {
			// provided an article id
			result.articleid = endpoint.articleid;
		} else if (endpoint.article && typeof endpoint.article.getArticle == 'function') {
			// provided an instance of Appacitive.ArticleCollection
			// stick the whole article if there is no __id
			// else just stick the __id
			if (endpoint.article.get('__id')) {
				result.articleid = endpoint.article.get('__id');
			} else {
				result.article = endpoint.article.getArticle();
			}
			base["endpoint" + type] = endpoint;
		} else if (typeof endpoint.article == 'object' && endpoint.article.__schematype) {
			// provided a raw article
			// if there is an __id, just add that
			// else add the entire article
			if (endpoint.article.__id) {
				result.articleid = endpoint.article.__id;
			} else {
				result.article = endpoint.article;
			}
		} else {
			throw new Error('Incorrectly configured endpoints provided to setupConnection');
		}

		return result;
	};

	global.Appacitive.Connection = function(options, doNotParse) {

		if (!options.__relationtype && !options.relation )
			throw new error("Cannot set connection without schema");

		if (options.schema) {
			options.__schematype = options.schema;
			delete options.schema;
		}

		if (options.endpoints && options.endpoints.length == 2) {
			options.__endpointa = options.endpoints[0];
			options.__endpointb = options.endpoints[1];
			delete options.endpoints;
		}

		if (!options.__endpointa || !options.__endpointb)
			throw new Error('Provide both endpoints.');

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
			if ( options.__endpointa.articleid == this.get('__endpointa').articleid ) {
				typeA = 'B', typeB = 'A';
			}

			if (typeof this.get('__endpointa').article == 'object') {
				if (!this.endpointa) {
					this["endpoint" + typeA] = new global.Appacitive.Article(this.get('__endpointa').article);
				} else {
					this["endpoint" + typeA].copy(this.get('__endpointb').getArticle());
				}
				this["endpoint" + typeA].___collection = this.___collection;
			} else {
				this["endpoint" + typeA] = this.get('__endpointa');
			}

			if (typeof this.get('__endpointb').article == 'object') {
				if (!this.endpointb) {
					this["endpoint" + typeB] = new global.Appacitive.Article(this.get('__endpointb').article);
				} else {
					this["endpoint" + typeB].copy(this.get('__endpointb').getArticle());
				}
				this["endpoint" + typeB].___collection = this.___collection;
			} else {
				this["endpoint" + typeB] = this.get('__endpointb');
			}

			base.__defineGetter__('endpoints', function() {
				var endpoints = [];
				endpoints.push(this.endpointA);
				endpoints.push(this.endpointB);
				return endpoints;
			});

			return base;
		};

		if (doNotParse) {

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
			base.setupConnection(base.get('__endpointa'), base.get('__endpointb'));
		} 

		return base;
	};

	global.Appacitive.Connection.multiDelete = function(relationName, ids, onSuccess, onError) {
		if (!relationName)
			throw new Error("Specify relationName");

		if (ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.connection.getMultideleteUrl(relationName);
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

})(global);