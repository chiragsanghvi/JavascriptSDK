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

		this.pageQuery = new PageQuery(o);
		this.sortQuery = new SortQuery(o);
		this.baseType = o.schema || o.relation;
		if (!this.baseType)
			throw new Error('schema or relation name is mandatory');
		this.type = (o.schema) ? 'article' : 'connection';

		this.filter = o.filter || '';
		this.freeText = o.freeText || '';
		this.fields = o.fields || '';

		this.extendOptions = function(changes) {
			for (var key in changes) {
				options[key] = changes[key];
			}
			this.pageQuery = new PageQuery(options);
			this.sortQuery = new SortQuery(options);
		};

        this.toUrl = function() {
			var finalUrl = global.Appacitive.config.apiBaseUrl +
				this.type + '.svc/' +
				this.baseType + '/find/all?' + this.pageQuery.toString() + '&' + this.sortQuery.toString();

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

		this.toString = function() {

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

	// search all type query
	/** 
	* @constructor
	**/
	global.Appacitive.queries.SearchAllQuery = function(options) {

		options = options || {};
		var inner = new BaseQuery(options);

		// simple query
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = inner.toUrl();
			r.method = 'get';
			return r;
		};

		this.extendOptions = function() {
			inner.extendOptions.apply(inner, arguments);
		};

		this.getOptions = function() {
			var o = {};
			for (var key in inner) {
				if (inner.hasOwnProperty(key) && typeof inner[key] != 'function') {
					o[key] = inner[key];
				}
			}
			return o;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.BasicFilterQuery = function(options) {

		options = options || {};
		var inner = new BaseQuery(options);

		// just append the filters/properties parameter to the query string
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = inner.toUrl();
            r.method = 'get';
			return r;
		}; 

		this.setFilter = function() {
			inner.filter = arguments[0];
		};

		this.setFreeText = function() {
            inner.freeText = arguments[1];
        };

        this.__defineGetter__('filter', function() {
			return inner.filter;
		});

		this.__defineSetter__('filter', function(value) {
			return inner.filter = value;
		});

		this.__defineGetter__('freeText', function() {
			return inner.freetext;
		});

		this.__defineSetter__('freeText', function(value) {
			return inner.freeText = value;
		});

		this.__defineGetter__('fields', function() {
			return inner.fields;
		});

		this.__defineSetter__('fields', function(value) {
			return inner.fields = value;
		});

		this.extendOptions = function() {
			inner.extendOptions.apply(inner, arguments);
		};

		this.getOptions = function() {
			var o = {};
			for (var key in inner) {
				if (inner.hasOwnProperty(key) && typeof inner[key] != 'function') {
					o[key] = inner[key];
				}
			}
			return o;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.queries.GraphQuery = function(options) {

		options = options || {};
		
		if (!options.graphQuery)
			throw new Error('graphQuery object is mandatory');

		// just append the filters/properties parameter to the query string
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
		var inner = new BaseQuery(options);

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = global.Appacitive.config.apiBaseUrl + 'connection/' + options.relation + '/' + options.articleId + '/find?' +
				inner.toString();
			return r;
		};

		this.extendOptions = function() {
			inner.extendOptions.apply(inner, arguments);
		};
		
		this.setFilter = function() {
			inner.filter = arguments[0];
		};

		this.setFreeText = function() {
            inner.freeText = arguments[1];
        };

        this.__defineGetter__('filter', function() {
			return inner.filter;
		});

		this.__defineSetter__('filter', function(value) {
			return inner.filter = value;
		});

		this.__defineGetter__('freeText', function() {
			return inner.freetext;
		});

		this.__defineSetter__('freeText', function(value) {
			return inner.freeText = value;
		});

		this.__defineGetter__('fields', function() {
			return inner.fields;
		});

		this.__defineSetter__('fields', function(value) {
			return inner.fields = value;
		});

		this.getOptions = function() {
			var o = {};
			for (var key in inner) {
				if (inner.hasOwnProperty(key) && typeof inner[key] != 'function') {
					o[key] = inner[key];
				}
			}
			return o;
		};
	};

})(global);