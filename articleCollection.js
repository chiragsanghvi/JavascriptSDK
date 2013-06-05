(function(global) {

	"use strict";

	/** 
	* @constructor
	**/
	var _ArticleCollection = function(options) {

		var _schema = null;
		var _query = null;
		var _articles = [];
		var _options = options;

		this.collectionType = 'article';

		if (!options || !options.schema) throw new Error('Must provide schema while initializing ArticleCollection.');
		
		_schema = options.schema;
		
		var that = this;
		var _parseOptions = function(options) {
			options.type = 'article';

			if (options.schema) _schema = options.schema;
			else options.schema = _schema;

			_query = new global.Appacitive.Queries.BasicFilterQuery(options);
			_options = options;
			that.extendOptions = _query.extendOptions;
		};

		this.setFilter = function(filterString) {
			_options.filter = filterString;
			_options.type = 'article';
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
            _options.type = 'article';
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
            _options.type = 'article';
            if (_query) _query.fields = fields;
			else {
				_query = new global.Appacitive.Queries.BasicFilterQuery(_options);
				that.extendOptions = _query.extendOptions;
			}
			return this;
        };

		this.reset = function() {
			_options = null;
			_schema = null;
			_articles.length = 0;
			_query = null;
		};

		this.__defineGetter__("query", function() {
			return _query;
		});

		this.getQuery = function() {
			return _query;
		};

		var _supportedQueryType = ["BasicFilterQuery"];

		this.__defineSetter__("query", function(query) {
			if (!query || !query.toRequest) throw new Error('Invalid  appacitive query passed to articleCollection');
			if (_supportedQueryType.indexOf(query.queryType) == -1) throw new Error('ArticleCollection only accepts ' + _supportedQueryType.join(', '));
			_articles.length = 0;
			_query = query;
		});

		this.setQuery = function(query) {
			this.query = query;
			return this;
		};

		this.setOptions = _parseOptions;
		
		_parseOptions(options);

		// getters
		this.get = function(index) {
			if (index != parseInt(index, 10)) return null;
			index = parseInt(index, 10);
			if (typeof index != 'number') return null;
			if (index >= _articles.length)  return null;
			return _articles.slice(index, index + 1)[0];
		};

		this.addToCollection = function(article) {
			if (!article || article.get('__schematype') != _schema)
				throw new Error('Null article passed or schema type mismatch');
			var index =  null;
			_articles.forEach(function(a, i) {
				if (a.get('__id') == article.get('__id')) {
					index = i;
				}
			});
			if (index !=+ null) {
				_articles.splice(index, 1);
			} else {
				_articles.push(article);
			}
			return this;
		};

		this.getArticleById = function(id) {
			var existingArticle = _articles.filter(function (article) {
				return article.get('__id') == id;
			});
			if (existingArticle.length == 1) return existingArticle[0];
			return null;
		};

		this.getAll = function() { return Array.prototype.slice.call(_articles); };

		this.getAllArticles = function() {
			return Array.prototype.slice.call(_articles).map(function (a) {
				return a.getArticle();
			});
		};

		this.removeById = function(id) {
			if (!id) return false;
			var index = null;
			_articles.forEach(function(article, i) {
				if (article.getArticle().__id && article.getArticle().__id == id) {
					index = i;
				}
			});
			if (index !== null) {
				_articles.splice(index, 1);
			}
			return this;
		};

		this.removeByCId = function(id) {
			if (!id) return false;
			var index = null;
			_articles.forEach(function(article, i) {
				if (article.__cid && article.__cid == id) {
					index = i;
				}
			});
			if (index !== null) _articles.splice(index, 1);
			return this;
		};

		var parseArticles = function (data, onSuccess, onError) {
			var articles = data.articles;
			if (!articles) {
				onError(data.status);
				return;
			}
			if (!articles.length || articles.length === 0) articles = [];
			articles.forEach(function (article) {
				var _a = new global.Appacitive.Article(article, true);
				_a.___collection = that;
				_articles.push(_a);
			});
			var pagingInfo = data.paginginfo || {};
			onSuccess(pagingInfo, that);
		};

		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			_articles.length = 0;
			var _queryRequest = _query.toRequest();
			_queryRequest.onSuccess = function(data) {
				parseArticles(data, onSuccess, onError);
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

		this.createNewArticle = function(values) {
			values = values || {};
			values.__schematype = _schema;
			var _a = new global.Appacitive.Article(values);
			_a.___collection = that;
			_a.__cid = parseInt(Math.random() * 1000000, 10);
			_articles.push(_a);
			return _a;
		};

		this.map = function() { return _articles.map.apply(this, arguments); };
		this.forEach = function() { return _articles.forEach.apply(this, arguments); };
		this.filter = function() { return _articles.filter.apply(this, arguments); };
	};

	global.Appacitive.ArticleCollection = _ArticleCollection;

	global.Appacitive.ArticleCollection.prototype.toString = function() {
		return JSON.stringify(this.getAllArticles());
	};

	global.Appacitive.ArticleCollection.prototype.toJSON = function() {
		return this.getAllArticles();
	};

	global.Appacitive.ArticleCollection.prototype.__defineGetter__('articles', function() {
		return this.getAll();
	});


})(global);