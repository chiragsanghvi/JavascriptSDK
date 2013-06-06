(function (global) {

	"use strict";

	var _getFacebookProfile = function(onSuccess, onError) {
		onSuccess = onSuccess || function() {};
		onError = onError || function(){};
		
		var r = new global.Appacitive.HttpRequest();
		r.method = 'get';
		r.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(this.get('__id'));
		r.onSuccess = function(d) {
			var fbUsername = null;
			if (d && d.identities && d.identities.length > 0) {
				var fb = d.identities.filter(function(identity) {
					return identity.authtype.toLowerCase() == 'facebook';
				});
				if (fb.length == 1) fbUsername = fb[0].username;
			}
			if (fbUsername !== null) {
				FB.api('/' + fbUsername, function(response) {
					if (response) onSuccess(response);
					else onError();
				});
			} else  onError();
		};
		r.onError = onError;
		global.Appacitive.http.send(r);
	};

	global.Appacitive.Article = function(options, setSnapShot) {
		options = options || {};

		if (typeof options == 'string') {
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

		if (this.get('__schematype').toLowerCase() == 'user') this.getFacebookProfile = _getFacebookProfile;

		return this;
	};

	global.Appacitive.Article.prototype = new global.Appacitive.BaseObject();

	global.Appacitive.Article.prototype.constructor = global.Appacitive.Article;

	global.Appacitive.Article.prototype.getConnections = function(options) {

		if (this.type != 'article') return null;
		
		options = options || {};
		options.articleId = this.get('__id');
		var collection = new global.Appacitive.ConnectionCollection({ relation: options.relation });
		this.connectionCollections.push(collection);
		
		collection.query = new global.Appacitive.Queries.GetConnectionsQuery(options);
		
		return collection;
	};

	global.Appacitive.Article.prototype.getConnectedArticles = function(options) {

		options = options || {};
		if (typeof options == 'string') {
			rName = options;
			options = { relation: rName };
		}	

		options.articleId = this.get('__id');
		var collection = new global.Appacitive.ConnectionCollection({ relation: options.relation });
		collection.connectedArticle = this;
		this.connectionCollections.push(collection);
		collection.query  = new global.Appacitive.Queries.ConnectedArticlesQuery(options);
		
		return collection;
	};

	global.Appacitive.Article.multiDelete = function(options, onSuccess, onError) {
		options = options || {};

		if (!options.schema || typeof options.schema!= 'string' || options.schema.length == 0) throw new Error("Specify valid schema");

		if (options.schema.toLowerCase() == 'user' || options.schema.toLowerCase() == 'device') throw new Error("Cannot delete user and devices using multidelete");

		if (options.ids && options.ids.length > 0) {

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.article.getMultiDeleteUrl(options.schema);
			request.method = 'post';
			request.data = { idlist : options.ids };
			request.onSuccess = function(d) {
				if (d && d.code == '200') {
					if (typeof onSuccess == 'function') onSuccess();
				} else {
					d = d || {};
					if (typeof onError == 'function') onError (d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError == 'function') onError (d.status || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else onSuccess();
	};

	var _parseArticles = function(articles) {
		var articleObjects = [];
		articles.forEach(function(a){
			articleObjects.push(new global.Appacitive.Article(a));
		});
		return articleObjects;
	};

	//takes relationaname and array of articleids and returns an array of Appacitive article objects
	global.Appacitive.Article.multiGet = function(options, onSuccess, onError) {
		options = options || {};
		if (!options.schema || typeof options.schema!= 'string' || options.schema.length == 0) throw new Error("Specify valid schema");
		if (options.ids && options.ids.length > 0) {
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.article.getMultiGetUrl(options.schema, options.ids.join(','), options.fields);
			request.method = 'get';
			request.onSuccess = function(d) {
				if (d && d.articles) {
				   if (typeof onSuccess == 'function') onSuccess(_parseArticles(d.articles), d.paginginfo);
				} else {
					d = d || {};
					if (typeof onError == 'function') onError(d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError == 'function') onError(d.status || { message : 'Server error', code: 400 });
			}
			global.Appacitive.http.send(request);
		} else {
			if (typeof onSuccess == 'function') onSuccess([]);
		}
	};

	global.Appacitive.Article.get = function(options, onSuccess, onError) {
		options = options || {};
		if (!options.schema) throw new Error("Specify schema");
		if (!options.id) throw new Error("Specify id to fetch");

		var obj = {};
		if (schemaName.toLowerCase() == 'user') obj = new global.Appacitive.User({ __id: options.id });
		else obj = new global.Appacitive.Article({ __schematype: options.schema, __id: options.id });
		
		obj.fields = options.fields;
		obj.fetch(onSuccess, onError);

		return obj;
	};

})(global);