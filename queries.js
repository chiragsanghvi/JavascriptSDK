(function(global) {

	"use strict";

	global.Appacitive.queries = {};

	// basic query for contains pagination
	/** 
	* @constructor
	**/
	var PageQuery = function(o) {
		var options = o || {};
		this.pageNumber = options.pageNumber || 1;
		this.pageSize = options.pageSize || 200;
	};
	PageQuery.prototype.toString = function() {
		return 'psize=' + this.pageSize + '&pnum=' + this.pageNumber;
	};

	// sort query
	/** 
	* @constructor
	**/
	var SortQuery = function(o) {
		o = o || {};
		this.orderBy = o.orderBy || '__UtcLastUpdatedDate';
		this.isAscending = typeof o.isAscending == 'undefined' ? false : o.isAscending;
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
			else if (typeof value == 'object' && value.length) _freeText = value.join(',');
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
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.BasicFilterQuery = function(options) {

		options = options || {};

		if (!options.schema && !options.relation) throw new Error('Specify either schema or relation name for basic filter query');

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

		inner.getOptions = function() {
			var o = {};
			for (var key in this) {
				if (this.hasOwnProperty(key) && typeof this[key] != 'function') {
					o[key] = this[key];
				}
			}
			return o;
		};

		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.GraphQuery = function(options) {

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

	/** 
	* @constructor
	**/
	global.Appacitive.queries.ConnectedArticlesQuery = function(options) {

		options = options || {};

		if (!options.relation) throw new Error('Specify relation for connected articles query');
		if (!options.articleId) throw new Error('Specify articleId for connected articles query');

		options.queryType = 'ConnectedArticlesQuery';

		var inner = new BaseQuery(options);

		inner.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			return r;
		};

		inner.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + options.relation + '/' + options.articleId + '/find?' +
				inner.getQueryString();
		};

		inner.getOptions = function() {
			var o = {};
			for (var key in this) {
				if (this.hasOwnProperty(key) && typeof this[key] != 'function') {
					o[key] = this[key];
				}
			}
			return o;
		};

		return inner;
	};

})(global);