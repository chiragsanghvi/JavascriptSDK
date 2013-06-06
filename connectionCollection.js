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

		var _options = {};

		if (typeof options == 'string') _options.relation = options;
		else _options = options;

		var connectionMap = {};

		this.collectionType = 'connection';

		var that = this;

		if (!options || !options.relation) throw new Error('Must provide relation while initializing ConnectionCollection.');
		
		_relation = options.relation;

		var _parseOptions = function(options) {
			options.type = 'connection';

			if (options.relation) _relation = options.relation;
			else options.relation = _relation;

			_query = new global.Appacitive.Queries.BasicFilterQuery(options);
			_options = options;

			return that;
		};

		this.setFilter = function(filterString) {
			_options.filter = filterString;
			_options.type = 'connection';
			if (_query) _query.filter = filterString;
			else {
				_query = new global.Appacitive.Queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
			return this;
		};

		this.setFreeText = function(tokens) {
            if(!tokens && tokens.trim().length==0)
                _options.freeText = "";
            _options.freeText = tokens;
            _options.type = 'connection';
            if (_query) _query.freeText = tokens;
			else {
				_query = new global.Appacitive.Queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}

			return this;
        };

        this.setFields = function(fields) {
        	if (!fields)
                _options.fields = "";
            _options.fields = fields;
            _options.type = 'connection';
            if (_query) _query.fields = fields;
			else {
				_query = new global.Appacitive.Queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
			return this;
        };

		this.__defineGetter__("query", function() {
			return _query;
		});

		this.getQuery = function() {
			return _query;
		};

		var _supportedQueryType = ["BasicFilterQuery", "ConnectedArticlesQuery","GetConnectionsQuery", "GetConnectionsBetweenArticlesForRelationQuery"];
		
		this.__defineSetter__("query", function(query) {
			if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to connectionCollection');
			if (_supportedQueryType.indexOf(query.queryType) == -1) throw new Error('ConnectionCollection only accepts ' + _supportedQueryType.join(', '));
			_articles.length = 0;
			_connections.length = 0;
			_query = query;
		});

		this.setQuery = function(query) {
			this.query = query;
			return this;
		};

		this.reset = function() {
			_options = null;
			_relation = null;
			_articles.length = 0;
			_connections.length = 0;
			_query = null;
		};

		this.setOptions = _parseOptions;
		_parseOptions(_options);

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
			if (index !== null) _connections.splice(index, 1);
			else _connections.push(connection);
			
			return this;
		};

		this.getConnection = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			var existingConnection = _connections.filter(function (connection) {
				return connection.get('__id') == id;
			});
			if (existingConnection.length == 1) return existingConnection[0];
			return null;
		};

		this.getAll = function() { return Array.prototype.slice.call(_connections); };

		this.getAllConnections = function() {
			return Array.prototype.slice.call(_connections).map(function (c) {
				return c.getConnection();
			});
		};

		this.removeById = function(id) {
			if (!id) return false;
			var index = null;
			_connections.forEach(function(connection, i) {
				if (connection.getConnection().__id && connection.getConnection().__id == id) {
					index = i;
				}
			});
			if (index !== null) _connections.splice(index, 1);
			return this;
		};

		this.removeByCId = function(id) {
			if (!id) return false;
			var index = null;
			_connections.forEach(function(connection, i) {
				if (connection.__cid && connection.__cid == id) {
					index = i;
				}
			});
			if (index !== null) _connections.splice(index, 1);
			return this;
		};

		var parseConnections = function (data, onSuccess, onError, queryType) {
			data = data || {};
			var connections = data.connections;

			if (queryType == 'GetConnectionsBetweenArticlesForRelationQuery' && data.connection)
				connections = [data.connection];

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
				var _c = new global.Appacitive.Connection(connection, true);
				_c.___collection = that;
				
				// if this is a connected articles call...
				if (_c.endpointA.article || _c.endpointB.article) {
					var _a = _c.endpointA.article || _c.endpointB.article;
					_a.___collection = that;
					_articles.push(_a);
				}
				try {
					if (!_c.___collection.connectedArticle)
						delete _c.connectedArticle;
				} catch(e) {}

				_connections.push(_c);
			});

			var pagingInfo = data.paginginfo || {};
			onSuccess(pagingInfo, that);
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
				parseConnections(data, onSuccess, onError, _query.queryType);
			};
			global.Appacitive.http.send(_queryRequest);
			return this;
		};

		this.fetchByPageNumber = function(onSuccess, onError, pageNumber) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber = pageNumber;
			this.fetch(onSuccess, onError);
			return this;
		};

		this.fetchNextPage = function(onSuccess, onError) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber += 1;
			this.fetch(onSuccess, onError);
			return this;
		};

		this.fetchPreviousPage = function(onSuccess, onError) {
			var pInfo = _query.getOptions().pageQuery;
			pInfo.pageNumber -= 1;
			if (pInfo.pageNumber === 0) pInfo.pageNumber = 1;
			this.fetch(onSuccess, onError);
			return this;
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