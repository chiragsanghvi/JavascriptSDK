(function (global) {

	"use strict";

	global.Appacitive.Article = function(options, setSnapShot) {
		options = options || {};

		if (_type.isString(options)) {
			var sName = options;
			options = { __schematype : sName };
		}

		if (!options.__schematype && !options.schema ) throw new Error("Cannot set article without __schematype");

		if (options.schema) {
			options.__schematype = options.schema;
			delete options.schema;
		}
		
		global.Appacitive.BaseObject.call(this, options, setSnapShot);

		this.type = 'article';
		this.connectionCollections = [];
		this.getArticle = this.getObject;
		this.children = {};

		this.toJSON = function(recursive) {
			if (recursive) {
				var parseChildren = function(root) {
					var articles = [];
					root.forEach(function(obj) {
						var tmp = obj.getObject();
						if (obj.children && !Object.isEmpty(obj.children)) {
							tmp.children = {};
							for (var c in obj.children) {
								tmp.children[c] = parseChildren(obj.children[c]);
							}
						}
						if (obj.connection) tmp.__connection = obj.connection.toJSON();
						articles.push(tmp);
					});
					return articles;
				};
				return parseChildren([this])[0];
			} else {
				return this.getObject();
			}
		};
		return this;
	};

	global.Appacitive.Article.prototype = new global.Appacitive.BaseObject();

	global.Appacitive.Article.prototype.constructor = global.Appacitive.Article;

	//private function for parsing articles
	var _parseArticles = function(articles) {
		var articleObjects = [];
		articles.forEach(function(a) {
			articleObjects.push(new global.Appacitive.Article(a, true));
		});
		return articleObjects;
	};

	global.Appacitive._parseArticles = _parseArticles;

	global.Appacitive.Article.multiDelete = function(options, callbacks) {
		options = options || {};
		if (!options.schema || !_type.isString(options.schema) || options.schema.length === 0) throw new Error("Specify valid schema");
		if (options.schema.toLowerCase() === 'user' || options.schema.toLowerCase() === 'device') throw new Error("Cannot delete user and devices using multidelete");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var promise = global.Appacitive.Promise.buildPromise(callbacks);

		var request = new global.Appacitive.HttpRequest();
		request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.article.getMultiDeleteUrl(options.schema);
		request.method = 'post';
		request.data = { idlist : options.ids };
		request.onSuccess = function(d) {
			promise.fulfill();
		};
		request.promise = promise;
		return global.Appacitive.http.send(request);
	};


	//takes relationaname and array of articleids and returns an array of Appacitive article objects
	global.Appacitive.Article.multiGet = function(options, callbacks) {
		options = options || {};
		if (!options.schema || !_type.isString(options.schema) || options.schema.length === 0) throw new Error("Specify valid schema");
		if (!options.ids || options.ids.length === 0) throw new Error("Specify ids to delete");

		var promise = global.Appacitive.Promise.buildPromise(callbacks);

		var request = new global.Appacitive.HttpRequest();
		request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.article.getMultiGetUrl(options.schema, options.ids.join(','), options.fields);
		request.method = 'get';
		request.onSuccess = function(d) {
			promise.fulfill(_parseArticles(d.articles));
		};
		request.promise = promise;
		return global.Appacitive.http.send(request);
	};

	//takes article id , type and fields and returns that article
	global.Appacitive.Article.get = function(options, callbacks) {
		options = options || {};
		if (!options.schema) throw new Error("Specify schema");
		if (!options.id) throw new Error("Specify id to fetch");

		var obj = {};
		if (options.schema.toLowerCase() === 'user') obj = new global.Appacitive.User({ __id: options.id });
		else obj = new global.Appacitive.Article({ __schematype: options.schema, __id: options.id });
		
		obj.fields = options.fields;

		return obj.fetch(callbacks);
	};

    //takes relation type and returns query for it
	global.Appacitive.Article.prototype.getConnections = function(options) {
		if (this.isNew()) throw new Error("Cannot fetch connections for new article");
		options.articleId = this.get('__id');
		return new global.Appacitive.Queries.GetConnectionsQuery(options);
	};

	//takes relation type and returns a query for it
	global.Appacitive.Article.prototype.getConnectedArticles = function(options) {
		if (this.isNew()) throw new Error("Cannot fetch connections for new article");
		options = options || {};
		if (_type.isString(options)) options = { relation: options };
		options.schema = this.entityType;
		options.articleId = this.get('__id');
		options.article = this;
		return new global.Appacitive.Queries.ConnectedArticlesQuery(options);
	};
	
	// takes schea type and return a query for it
	global.Appacitive.Article.findAll = function(options) {
		return new global.Appacitive.Queries.FindAllQuery(options)
	};

})(global);
