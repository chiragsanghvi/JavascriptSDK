(function(global) {

	"use strict";

	/** 
	* @constructor
	**/
	var _ConnectionCollection = function(options) {

		var _relation = null;
		var _schema = null;

		var _query = null;

		var _connections = [];
		var _articles = [];

		var _options = options;
		var connectionMap = {};

		this.collectionType = 'connection';

		if (!options || !options.relation) {
			throw new Error('Must provide relation while initializing ConnectionCollection.');
		}

		var _parseOptions = function(options) {
			_relation = options.relation;
			options.type = 'connection';
			_query = new global.Appacitive.queries.ConnectedArticlesQuery(options);
			_options = options;
		};

		this.setQuery = function(query) {
			if (!query) throw new Error('Invalid query passed to connectionCollection');
			_connections.length = 0;
			_query = query;
		};
		
		this.reset = function() {
			_options = null;
			_relation = null;
			articles.length = 0;
			_connections.length = 0;
			_query = null;
		};

		this.getQuery = function() {
			return _query;
		};

		this.setOptions = _parseOptions;
		_parseOptions(options);

		// getters
		this.get = function(index) {
			if (index != parseInt(index, 10)) return null;
			index = parseInt(index, 10);
			if (typeof index != 'number') return null;
			if (index >= _connections.length)  return null;
			return _connections.slice(index, index + 1)[0];
		};

		this.addToCollection = function(connection) {
			if (!connection || connection.get('__relationtype') != _relation)
				throw new Error('Null connection passed or relation type mismatch');
			var index =  null;
			_connections.forEach(function(c, i) {
				if (c.get('__id') == connection.get('__id')) {
					index = i;
				}
			});
			if (index !== null) {
				_connections.splice(index, 1);
			} else {
				_connections.push(connection);
			}
		};

		this.getConnection = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			var existingConnection = _connections.filter(function (connection) {
				return connection.get('__id') == id;
			});
			if (existingConnection.length == 1) {
				onSuccess(Array.prototype.slice.call(existingConnection)[0]);
			} else {
				onError();
			}
		};

		this.getAll = function() { return Array.prototype.slice.call(_connections); };

		this.removeById = function(id) {
			if (!id) return false;
			var index = null;
			_connections.forEach(function(connection, i) {
				if (connection.getConnection().__id && connection.getConnection().__id == id) {
					index = i;
				}
			});
			if (index !== null) {
				_connections.splice(index, 1);
				return true;
			} else { return false; }
		};

		this.removeByCId = function(id) {
			if (!id) return false;
			var index = null;
			_connections.forEach(function(connection, i) {
				if (connection.__cid && connection.__cid == id) {
					index = i;
				}
			});
			if (index !== null) {
				_connections.splice(index, 1);
				return true;
			} else { return false; }
		};

		var that = this;
		var parseConnections = function (data, onSuccess, onError) {
			data = data || {};
			var connections = data.connections;
			if (!connections) {
				if (data.status && data.status.code && data.status.code == '200') {
					connections = [];
				} else {
					onError(data.status);
					return;
				}
			}
			if (!connections.length || connections.length === 0) connections = [];
			connections.forEach(function (connection) {
				var _c = new global.Appacitive.Connection(connection);
				_c.___collection = that;
				_connections.push(_c);

				// if this is a connected articles call...
				if (connection.__endpointa.article || connection.__endpointb.article) {
					var article = connection.__endpointa.article || connection.__endpointb.article;
					var _a = new global.Appacitive.Article(article);
					_a.___collection = that;
					_articles.push(_a);
				}
			});

			onSuccess();
		};

		this.getConnectedArticle = function(articleId) {
			if (!_articles || _articles.length === 0) return null;
			var article = _articles.filter(function(a) { return a.get('__id') == articleId; });
			if (article.length > 0) return article[0];
			return null;
		};

		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			_connections.length = 0;
			var _queryRequest = _query.toRequest();
			_queryRequest.onSuccess = function(data) {
				parseConnections(data, onSuccess, onError);
			};
			global.Appacitive.http.send(_queryRequest);
		};

		this.createNewConnection = function(values) {
			values = values || {};
			values.__relationtype = _relation;
			var _a = new global.Appacitive.Connection(values);
			_a.___collection = that;
			_a.__cid = parseInt(Math.random() * 1000000, 10);
			_connections.push(_a);
			return _a;
		};

		this.map = function() { return _connections.map.apply(this, arguments); };

		this.forEach = function(delegate, context) {
			context = context || this;
			return _connections.forEach(delegate, context);
		};

		this.filter = function() { return _connections.filter.apply(this, arguments); };

	};

	global.Appacitive.ConnectionCollection = _ConnectionCollection;

})(global);