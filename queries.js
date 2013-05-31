(function(global) {

	"use strict";

	global.Appacitive.Queries = {};

	// basic query for contains pagination
	/** 
	* @constructor
	**/
	var PageQuery = function(o) {
		var options = o || {};
		var _pageNumber = 1;
		var _pageSize = 200;

		//define getter for pageNumber
		this.__defineGetter__('pageNumber', function() { return _pageNumber; });

		//define setter for pageNumber
		this.__defineSetter__('pageNumber', function(value) {  _pageNumber = value || 1; });

		//define getter for pageSize
		this.__defineGetter__('pageSize', function() { return _pageSize; });

		//define setter for pagenumber
		this.__defineSetter__('pageSize', function(value) { _pageSize = value || 200; });

		this.pageNumber = options.pageNumber;
		this.pageSize = options.pageSize;
	};
	PageQuery.prototype.toString = function() {
		return 'psize=' + this.pageSize + '&pnum=' + this.pageNumber;
	};

	// sort query
	/** 
	* @constructor
	**/
	var SortQuery = function(o) {
		var options = o || {};
		var _orderBy = '__UtcLastUpdatedDate';
		var _isAscending = false;

		//define getter for pagenumber
		this.__defineGetter__('orderBy', function() { return _orderBy; });

		//define setter for pagenumber
		this.__defineSetter__('orderBy', function(value) { _orderBy = value || '__UtcLastUpdatedDate'; });

		//define getter for pagenumber
		this.__defineGetter__('isAscending', function() { return _isAscending; });

		//define setter for pagenumber
		this.__defineSetter__('isAscending', function(value) {  _isAscending = typeof value == 'undefined' ? false : value; });

		this.orderBy = options.orderBy;
		this.isAscending = options.isAscending;
	};
	SortQuery.prototype.toString = function() {
		return 'orderBy=' + this.orderBy + '&isAsc=' + this.isAscending;
	};

	// base query
	/** 
	* @constructor
	**/
	var BaseQuery = function(o) {

		var options = o || {};

		//set filters , freetext and fields
		var _filter = '';
		var _freeText = '';
		var _fields = '';
		var _queryType = o.queryType;
		var _pageQuery = new PageQuery(o);
		var _sortQuery = new SortQuery(o);
		var _entityType = o.schema || o.relation;
		var _type = (o.schema) ? 'article' : 'connection';



		//define getter for type (article/connection)
		this.__defineGetter__('type', function() { return _type; });

		//define getter for basetype (schema/relation)
		this.__defineGetter__('entityType', function() { return _entityType; });

		//define getter for querytype (basic,connectedarticles etc)
		this.__defineGetter__('queryType', function() { return _queryType; });



		//define getter for pagequery 
		this.__defineGetter__('pageQuery', function() { return _pageQuery; });

		//define getter for sortquery
		this.__defineGetter__('sortQuery', function() { return _sortQuery; });



		//define getter for filter
		this.__defineGetter__('filter', function() { return _filter; });

		//define setter for filter
		this.__defineSetter__('filter', function(value) { _filter = value; });



		//define getter for freetext
		this.__defineGetter__('freeText', function() { return _freeText; });

		//define setter for freetext
		this.__defineSetter__('freeText', function(value) {
			if (typeof value == 'string') _freeText = value;
			else if (typeof value == 'object' && value.length) _freeText = value.join(' ');
		});



		//define getter for fields
		this.__defineGetter__('fields', function() { return _fields; });

		//define setter for fields
		this.__defineSetter__('fields', function(value) {
			if (typeof value == 'string') _fields = value;
			else if (typeof value == 'object' && value.length) _fields = value.join(',');
		});


		//set filters , freetext and fields
		this.filter = options.filter || '';
		this.freeText = options.freeText || '';
		this.fields = options.fields || '';

		this.setFilter = function() { this.filter = arguments[0]; };
		this.setFreeText = function() { this.freeText = arguments[0]; };
        this.setFields = function() { this.fields = arguments[0]; };

        this.extendOptions = function(changes) {
			for (var key in changes) {
				options[key] = changes[key];
			}
			_pageQuery = new PageQuery(options);
			_sortQuery = new SortQuery(options);
		};

		this.getQueryString = function() {

			var finalUrl = this.pageQuery.toString() + '&' + this.sortQuery.toString();

			if (this.filter && this.filter.trim().length > 0) {
				finalUrl += '&query=' + this.filter;
			}

			if (this.freeText && this.freeText.trim().length > 0) {
                finalUrl += "&freetext=" + this.freeText + "&language=en";
            }

            if (this.fields && this.fields.trim().length > 0) {
            	finalUrl += "&fields=" + this.fields;
            }

			return finalUrl;
		};

		this.getOptions = function() {
			var o = {};
			for (var key in this) {
				if (this.hasOwnProperty(key) && typeof this[key] != 'function') {
					o[key] = this[key];
				}
			}
			return o;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.BasicFilterQuery = function(options) {

		options = options || {};

		if ((!options.schema && !options.relation) || (options.schema && options.relation)) 
			throw new Error('Specify either schema or relation for basic filter query');

		options.queryType = 'BasicFilterQuery';

		var inner = new BaseQuery(options);
		
		inner.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
            r.method = 'get';
			return r;
		};
		
		inner.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl +
				   this.type + '.svc/' +
				   this.entityType + '/find/all?' + this.getQueryString();
		};

		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.ConnectedArticlesQuery = function(options) {

		options = options || {};

		if (!options.relation) throw new Error('Specify relation for connected articles query');
		if (!options.articleId) throw new Error('Specify articleId for connected articles query');
		if (options.schema) delete options.schema;

		options.queryType = 'ConnectedArticlesQuery';

		var inner = new BaseQuery(options);

		inner.articleId = options.articleId;
		inner.relation = options.relation;
		inner.label = '';
		if (options.label && typeof options.label == 'string' && options.label.length > 0) inner.label = '&label=' + options.label;

		inner.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		inner.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/' + this.articleId + '/find?' +
				this.getQueryString() + this.label;
		};

		return inner;
	};


	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsQuery = function(options) {

		options = options || {};

		if (!options.relation) throw new Error('Specify relation for GetConnectionsQuery query');
		if (!options.articleId) throw new Error('Specify articleId for GetConnectionsQuery query');
		if (!options.label || options.label.trim().length == 0) throw new Error('Specify label for GetConnectionsQuery query');
		if (options.schema) delete options.schema;

		options.queryType = 'GetConnectionsQuery';

		var inner = new BaseQuery(options);

		inner.articleId = options.articleId;
		inner.relation = options.relation;
		inner.label = options.label;

		inner.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		inner.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + inner.relation + '/find/all?' +
				'articleid=' + this.articleId +
				'&label=' +this.label +
				inner.getQueryString();
		};

		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery = function(options, queryType) {

		options = options || {};

		if (!options.articleAId || typeof options.articleAId != 'string' || options.articleAId.length == 0) throw new Error('Specify valid articleAId for GetConnectionsBetweenArticlesQuery query');
		if (!options.articleBId || typeof options.articleBId != 'string' || options.articleBId.length == 0) throw new Error('Specify articleBId for GetConnectionsBetweenArticlesQuery query');
		if (options.schema) delete options.schema;

		options.queryType = queryType || 'GetConnectionsBetweenArticlesQuery';

		var inner = new BaseQuery(options);

		inner.articleAId = options.articleAId;
		inner.articleBId = options.articleBId;
		inner.label = (inner.queryType == 'GetConnectionsBetweenArticlesForRelationQuery' && options.label && typeof options.label == 'string' && options.label.length > 0) ? '&label=' + options.label : '';;
		inner.relation = (options.relation && typeof options.relation == 'string' && options.relation.length > 0) ? options.relation + '/' : '';
		
		inner.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		inner.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + 'find/' + this.articleAId + '/' + this.articleBId + '?'
				+ this.getQueryString() + this.label;
		};

		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsBetweenArticlesForRelationQuery = function(options) {
		options = options || {};
		if (!options.relation) throw new Error('Specify relation for GetConnectionsBetweenArticlesForRelationQuery query');
		var inner = new global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery(options, 'GetConnectionsBetweenArticlesForRelationQuery');
		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GraphQuery = function(options) {

		options = options || {};
		
		if (!options.graphQuery)
			throw new Error('graphQuery object is mandatory');

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = global.Appacitive.config.apiBaseUrl;
			r.url += global.Appacitive.storage.urlFactory.article.getProjectionQueryUrl();
			r.method = 'post';
			r.data = options.graphQuery;
			return r;
		};
	};

})(global);