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

		//define getter for orderby
		this.__defineGetter__('orderBy', function() { return _orderBy; });

		//define setter for orderby
		this.__defineSetter__('orderBy', function(value) { _orderBy = value || '__UtcLastUpdatedDate'; });

		//define getter for isAscending
		this.__defineGetter__('isAscending', function() { return _isAscending; });

		//define setter for isAscending
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
	var BasicQuery = function(o) {

		var options = o || {};

		//set filters , freetext and fields
		var _filter = '';
		var _freeText = '';
		var _fields = '';
		var _queryType = options.queryType || 'BasicQuery';
		var _pageQuery = new PageQuery(o);
		var _sortQuery = new SortQuery(o);
		var _entityType = options.schema || options.relation;
		var _type = (options.relation) ? 'connection' : 'article';


		//define getter for type (article/connection)
		this.__defineGetter__('type', function() { return _type; });

		//define getter for basetype (schema/relation)
		this.__defineGetter__('entityType', function() { return _entityType; });

		//define getter for querytype (basic,connectedarticles etc)
		this.__defineGetter__('queryType', function() { return _queryType; });



		//define getter for pagequery 
		this.__defineGetter__('pageQuery', function() { return _pageQuery; });

		//define getter for pageNumber
		this.__defineGetter__('pageNumber', function() { return _pageQuery.pageNumber; });

		//define setter for pageNumber
		this.__defineSetter__('pageNumber', function(value) {  _pageQuery.pageNumber = value; });

		//define getter for pageSize
		this.__defineGetter__('pageSize', function() { return _pageQuery.pageSize; });

		//define setter for pagenumber
		this.__defineSetter__('pageSize', function(value) { _pageQuery.pageSize = value; });


		//define getter for sortquery
		this.__defineGetter__('sortQuery', function() { return _sortQuery; });

		//define getter for orderby
		this.__defineGetter__('orderBy', function() { return _sortQuery.orderBy; });

		//define setter for orderby
		this.__defineSetter__('orderBy', function(value) { _sortQuery.orderBy = value; });

		//define getter for isAscending
		this.__defineGetter__('isAscending', function() { return _sortQuery.isAscending; });

		//define setter for isAscending
		this.__defineSetter__('isAscending', function(value) {  _sortQuery.isAscending = value; });


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
			return this;
		};

		this.getQueryString = function() {

			var finalUrl = this.pageQuery.toString() + '&' + this.sortQuery.toString();

			if (this.filter && this.filter.trim().length > 0) {
				finalUrl += '&query=' + this.filter.toString();
			}

			if (this.freeText && this.freeText.trim().length > 0) {
                finalUrl += "&freetext=" + this.freeText + "&language=en";
            }

            if (this.fields && this.fields.trim().length > 0) {
            	finalUrl += "&fields=" + this.fields;
            }

			return finalUrl;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + _type + '/' + _entityType + '/find/all?' + this.getQueryString();
		};

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
            r.method = 'get';
			return r;
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

		var _parse = function(entities) {
			var entityObjects = [];
			if (!entities) entities = [];
			var eType = (_type == 'article') ? 'Article' : 'Connection';
			entities.forEach(function(e) {
				entityObjects.push(new global.Appacitive[eType](e, true));
			});
			return entityObjects;
		};

		this.fetch = function(onSuccess, onError) {
			var request = this.toRequest();
			request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
				   if (typeof onSuccess == 'function') onSuccess(_parse(d[_type + 's']), d.paginginfo);
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
			return this;
		};

		this.count = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};

			var _pSize = _pageQuery.pageSize;
			var _pNum = _pageQuery.pageNumber;

			_pageQuery.pageSize = 1;
			_pageQuery.pageNumber = 999999999;

			var that = this;

			var _restoreOldPaging = function() {
				_pageQuery.pageSize = _pSize;
				_pageQuery.pageNumber = _pNum;
			};

			var _queryRequest = this.toRequest();
			_queryRequest.onSuccess = function(data) {

				_restoreOldPaging();

				data = data || {};
				var pagingInfo = data.paginginfo;

				var count = 0;
				if (!pagingInfo) {
					if (data.status && data.status.code && data.status.code == '200') {
						count = 0;
					} else {
						var d = data.status || { message : 'Server error', code: 400 };
				        if (typeof onError == 'function') onError(d, that);
						return;
					}
				} else {
					count = pagingInfo.totalrecords;
				}
				if (typeof onSuccess == 'function') onSuccess(count);
			};
			_queryRequest.onError = function(d) {
				_restoreOldPaging();
				d = d || { message : 'Server error', code: 400 };
			    if (typeof onError == 'function') onError(d, that);
			};
			global.Appacitive.http.send(_queryRequest);

			return this;
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.FindAllQuery = function(options) {

		options = options || {};

		if ((!options.schema && !options.relation) || (options.schema && options.relation)) 
		    throw new Error('Specify either schema or relation for basic filter query');

		options.queryType = 'BasicFilterQuery';

		BasicQuery.call(this, options);

		return this;
	};

	global.Appacitive.Queries.FindAllQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.FindAllQuery.prototype.constructor = global.Appacitive.Queries.FindAllQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.ConnectedArticlesQuery = function(options) {

		options = options || {};

		if (!options.relation) throw new Error('Specify relation for connected articles query');
		if (!options.articleId) throw new Error('Specify articleId for connected articles query');
		if (options.schema) delete options.schema;

		options.queryType = 'ConnectedArticlesQuery';

		BasicQuery.call(this, options);

		this.articleId = options.articleId;
		this.relation = options.relation;
		this.label = '';
		if (options.label && typeof options.label == 'string' && options.label.length > 0) this.label = '&label=' + options.label;

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/' + this.articleId + '/find?' +
				this.getQueryString() + this.label;
		};

		return this;
	};

	global.Appacitive.Queries.ConnectedArticlesQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.ConnectedArticlesQuery.prototype.constructor = global.Appacitive.Queries.ConnectedArticlesQuery;

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

		BasicQuery.call(this, options);

		this.articleId = options.articleId;
		this.relation = options.relation;
		this.label = options.label;

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/find/all?' +
				'articleid=' + this.articleId +
				'&label=' +this.label +
				this.getQueryString();
		};

		return this;
	};

	global.Appacitive.Queries.GetConnectionsQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.GetConnectionsQuery.prototype.constructor = global.Appacitive.Queries.GetConnectionsQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery = function(options, queryType) {

		options = options || {};

		if (!options.articleAId || typeof options.articleAId != 'string' || options.articleAId.length == 0) throw new Error('Specify valid articleAId for GetConnectionsBetweenArticlesQuery query');
		if (!options.articleBId || typeof options.articleBId != 'string' || options.articleBId.length == 0) throw new Error('Specify articleBId for GetConnectionsBetweenArticlesQuery query');
		if (options.schema) delete options.schema;

		options.queryType = queryType || 'GetConnectionsBetweenArticlesQuery';

		BasicQuery.call(this, options);

		this.articleAId = options.articleAId;
		this.articleBId = options.articleBId;
		this.label = (this.queryType == 'GetConnectionsBetweenArticlesForRelationQuery' && options.label && typeof options.label == 'string' && options.label.length > 0) ? '&label=' + options.label : '';;
		this.relation = (options.relation && typeof options.relation == 'string' && options.relation.length > 0) ? options.relation + '/' : '';
		
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + 'find/' + this.articleAId + '/' + this.articleBId + '?'
				+ this.getQueryString() + this.label;
		};

		return this;
	};

	global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery.prototype.constructor = global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsBetweenArticlesForRelationQuery = function(options) {
		
		options = options || {};
		
		if (!options.relation) throw new Error('Specify relation for GetConnectionsBetweenArticlesForRelationQuery query');
		
		var inner = new global.Appacitive.Queries.GetConnectionsBetweenArticlesQuery(options, 'GetConnectionsBetweenArticlesForRelationQuery');

		inner.fetch = function(onSuccess, onError) {
			var request = this.toRequest();
			request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
				   if (typeof onSuccess == 'function') onSuccess(new global.Appacitive.Connection(d.connection));
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
			return this;
		};

		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.InterconnectsQuery = function(options) {

		options = options || {};

		if (!options.articleAId || typeof options.articleAId != 'string' || options.articleAId.length == 0) throw new Error('Specify valid articleAId for InterconnectsQuery query');
		if (!options.articleBIds || typeof options.articleBIds != 'object' || !(options.articleBIds.length > 0)) throw new Error('Specify list of articleBIds for InterconnectsQuery query');
		if (options.schema) delete options.schema;

		options.queryType = 'InterconnectsQuery';

		BasicQuery.call(this, options);

		this.articleAId = options.articleAId;
		this.articleBIds = options.articleBIds;
		
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'post';
			r.data = {
				article1id: this.articleAId,
				article2ids: this.articleBIds
			};
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/interconnects?' + this.getQueryString();
		};

		return this;
	};

	global.Appacitive.Queries.InterconnectsQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.InterconnectsQuery.prototype.constructor = global.Appacitive.Queries.InterconnectsQuery;


	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GraphFilterQuery = function(name, placeholders) {

		if (!name || name.length == 0) throw new Error("Specify name of filter query");
		
		this.name = name;
		this.data = { };
		this.queryType = 'GraphFilterQuery';

		if (placeholders) this.data.placeholders = placeholders;

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'post';
			r.data = this.data;
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'search/' + this.name + '/filter';
		};

		this.fetch = function(onSuccess, onError) {
			
			var request = this.toRequest();
			request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
				   if (typeof onSuccess == 'function') {
				   		onSuccess(d.ids ? d.ids : []);
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
			return this;
		};

	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GraphProjectQuery = function(name, ids, placeholders) {

		if (!name || name.length == 0) throw new Error("Specify name of project query");
		if (!ids || !ids.length) throw new Error("Specify ids to project");
		
		this.name = name;
		this.data = { ids: ids };
		this.queryType = 'GraphProjectQuery';

		if (placeholders) this.data.placeholders = placeholders;

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'post';
			r.data = this.data;
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'search/' + this.name + '/project';
		};

		var _parseResult = function(result) {
			var root;
			for (var key in result) {
				if (key !== 'status') {
					root = result[key];
					break;
				}
			}
			var parseChildren = function(obj, parentLabel, parentId) {
				var props = [];
				obj.forEach(function(o) {
					var children = o.__children;
					delete o.__children;
					
					var edge = o.__edge;
					delete o.__edge;

					var tmpArticle = new Appacitive.Article(o, true);
					tmpArticle.projections = {};
					for (var key in children) {
						tmpArticle.projections[key] = { parent : children[key].parent };
						tmpArticle.projections[key].values = parseChildren(children[key].values, children[key].parent, tmpArticle.id);
					}

					if (edge) {
						edge.__endpointa = {
							articleid : parentId,
							label: parentLabel
						};
						edge.__endpointb = {
							articleid: tmpArticle.id,
							label: edge.label
						};
						delete edge.label;
						tmpArticle.connection = new Appacitive.Connection(edge);
					}
					props.push(tmpArticle);
				});
				return props;
			};
			return parseChildren(root.values);
		};

		this.fetch = function(onSuccess, onError) {
			
			var request = this.toRequest();
			request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
				   if (typeof onSuccess == 'function') {
				   		onSuccess(_parseResult(d));
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
			return this;
		};
	};

})(global);