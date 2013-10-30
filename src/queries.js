(function (global) {

	"use strict";

	global.Appacitive.Queries = {};

	// basic query for contains pagination
	/** 
	* @constructor
	**/
	var PageQuery = function(o) {
		var options = o || {};
		var _pageNumber = 1;
		var _pageSize = 20;

		//define getter and setter for pageNumber
		this.pageNumber =  function() { 
			if (arguments.length == 1) {
				_pageNumber = arguments[0] || 1;
				return this;
			}
			return _pageNumber; 
		};

		//define getter and setter for pageSize
		this.pageSize =  function() { 
			if (arguments.length == 1) {
				_pageSize = arguments[0] || 20;
				return this;
			}
			return _pageSize; 
		};

		this.pageNumber(options.pageNumber);
		this.pageSize(options.pageSize);
	};
	PageQuery.prototype.toString = function() {
		return 'psize=' + this.pageSize() + '&pnum=' + this.pageNumber();
	};

	// sort query
	/** 
	* @constructor
	**/
	var SortQuery = function(o) {
		var options = o || {};
		var _orderBy = '__UtcLastUpdatedDate';
		var _isAscending = false;

		//define getter/setter for orderby
		this.orderBy =  function() { 
			if (arguments.length === 1) {
				_orderBy = arguments[0] || '__UtcLastUpdatedDate';
				return this;
			}
			return _orderBy; 
		};

		//define getter for isAscending
		this.isAscending =  function() { 
			if (arguments.length === 1) {
				_isAscending = typeof arguments[0] === 'undefined' ? false : arguments[0];
				return this;
			}
			return _isAscending; 
		};

		this.orderBy(options.orderBy);
		this.isAscending(options.isAscending);
	};
	SortQuery.prototype.toString = function() {
		return 'orderBy=' + this.orderBy() + '&isAsc=' + this.isAscending();
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

		var self = this;

		//define getter for type (article/connection)
		this.type = function() { return _type; };

		//define getter for basetype (schema/relation)
		this.entityType = function() { return _entityType; };

		//define getter for querytype (basic,connectedarticles etc)
		this.queryType = function() { return _queryType; };

		//define getter for pagequery 
		this.pageQuery = function() { return _pageQuery; };

		
		//define getter and setter for pageNumber
		this.pageNumber =  function() { 
			if (arguments.length === 1) {
				_pageQuery.pageNumber(arguments[0]);
				return this;
			}
			return _pageQuery.pageNumber(); 
		};

		//define getter and setter for pageSize
		this.pageSize =  function() { 
			if (arguments.length === 1) {
				_pageQuery.pageSize(arguments[0]);
				return this;
			}
			return _pageQuery.pageSize(); 
		};

		//define getter for sortquery
		this.sortQuery = function() { return _sortQuery; };

		//define getter and setter for orderby
		this.orderBy =  function() { 
			if (arguments.length === 1) {
				_sortQuery.orderBy(arguments[0]);
				return this;
			}
			return _sortQuery.orderBy(); 
		};

		//define getter and setter for isAscending
		this.isAscending =  function() { 
			if (arguments.length === 1) {
				_sortQuery.isAscending(arguments[0]);
				return this;
			}
			return _sortQuery.isAscending(); 
		};

		//define getter and setter for filter
		this.filter =  function() { 
			if (arguments.length === 1) {
				_filter = arguments[0];
				return this;
			}
			return _filter; 
		};		
		
		//define getter and setter for freetext
		this.freeText =  function() { 
			if (arguments.length === 1) {
				var value = arguments[0];
				if (typeof value === 'string') _freeText = arguments[0];
				else if (typeof value === 'object' && value.length) _freeText = arguments[0].join(' ');
				return this;
			}
			return _freeText; 
		};		
		
		
		this.fields = function() {
			if (arguments.length === 1) {
				var value = arguments[0];
				if (typeof value === 'string') _fields = value;
				else if (typeof value === 'object' && value.length) _fields = value.join(',');
				return this;
			} else {
				return _fields;
			}
		};

		//set filters , freetext and fields
		this.filter(options.filter || '');
		this.freeText(options.freeText || '');
		this.fields(options.fields || '');

		this.setFilter = function() { this.filter(arguments[0]); };
		this.setFreeText = function() { this.freeText(arguments[0]); };
        this.setFields = function() { this.fields(arguments[0]); };

        this.extendOptions = function(changes) {
			for (var key in changes) {
				options[key] = changes[key];
			}
			_pageQuery = new PageQuery(options);
			_sortQuery = new SortQuery(options);
			return this;
		};

		this.getQueryString = function() {

			var finalUrl = _pageQuery.toString() + '&' + _sortQuery.toString();

			if (this.filter()) {
				var filter = this.filter().toString();
			    if (filter.trim().length > 0) finalUrl += '&query=' + filter;
			}

			if (this.freeText() && this.freeText().trim().length > 0) {
                finalUrl += "&freetext=" + this.freeText() + "&language=en";
            }

            if (this.fields() && this.fields().trim().length > 0) {
            	finalUrl += "&fields=" + this.fields();
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

		this._setPaging = function(pi) {
			if (pi) {
				_pageQuery.pageNumber(pi.pagenumber);
				_pageQuery.pageSize(pi.pagesize)
				
				this.results = this.results || [];

				this.results.isLastPage = true;
				this.results.count = pi.totalrecords;
				this.results.pageNumber = pi.pagenumber;
				this.results.pageSize = pi.pagesize;
				
				if ((pi.pagenumber * pi.pagesize) <= pi.totalrecords) {
					this.results.isLastPage = true;
				}
			}
		};

		var _parse = function(entities) {
			var entityObjects = [];
			if (!entities) entities = [];
			var eType = (_type === 'article') ? 'Article' : 'Connection';
			
			if (_entityType && _entityType.toLowerCase() == 'user') eType = 'User';
			
			entities.forEach(function(e) {
				entityObjects.push(new global.Appacitive[eType](e, true));
			});

			return entityObjects;
		};

		this.fetch = function(onSuccess, onError) {
			var request = this.toRequest();
			request.onSuccess = function(d) {
			if (d && d.status && d.status.code == '200') {
				   self.results = _parse(d[_type + 's']);
				   self._setPaging(d.paginginfo);

				   if (typeof onSuccess === 'function') onSuccess(self.results, d.paginginfo);
				} else {
					d = d || {};
					if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
			};
			global.Appacitive.http.send(request);
			return this;
		};

		this.fetchNext = function(onSuccess, onError) {
			var pNum = this.pageNumber();
			this.pageNumber(++pNum);
			this.fetch(onSuccess, onError);
			return this;
		};

		this.fetchPrev = function(onSuccess, onError) {
			var pNum = this.pageNumber();
			pNum -= 1;
			if (pNum <= 0) pNum = 1;
			this.pageNumber(pNum);
			this.fetch(onSuccess, onError);
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
				        if (typeof onError === 'function') onError(d, that);
						return;
					}
				} else {
					count = pagingInfo.totalrecords;
				}
				if (typeof onSuccess === 'function') onSuccess(count);
			};
			_queryRequest.onError = function(d) {
				_restoreOldPaging();
				d = d || { message : 'Server error', code: 400 };
			    if (typeof onError === 'function') onError(d, that);
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
		if (!options.schema) throw new Error('Specify schema of article id for connected articles query');
		

		var schema = options.schema;
		delete options.schema;

		options.queryType = 'ConnectedArticlesQuery';

		BasicQuery.call(this, options);

		this.articleId = options.articleId;
		this.relation = options.relation;
		this.schema = schema;
		this.prev = options.prev;
		
		this.returnEdge = true;
		if ((options.returnEdge !== undefined || options.returnEdge !== null) && !options.returnEdge && !this.prev) this.returnEdge = false;
		
		this.label = '';
		var self = this;

		if (options.label && typeof options.label === 'string' && options.label.length > 0) this.label = '&label=' + options.label;

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/' + this.schema + '/' + this.articleId + '/find?' +
				this.getQueryString() + this.label + '&returnEdge=' + this.returnEdge;
		};


		var parseNodes = function(nodes, endpointA) {
			var articles = [];
			nodes.forEach(function(o) {
				var tmpArticle = null;
				if (o.__edge) {
					var edge = o.__edge;
					delete o.__edge;

					edge.__endpointa = endpointA;
					edge.__endpointb = {
						articleid: o.__id,
						label: edge.__label,
						type: o.__schematype
					};
					delete edge.label;

					var connection = new global.Appacitive.Connection(edge, true);
					tmpArticle = new global.Appacitive.Article(o, true);
					tmpArticle.connection = connection;
				} else {
					tmpArticle = new global.Appacitive.Article(o, true);
				}
				articles.push(tmpArticle);
			});
			return articles;
		};


		var	prevParseNodes = function(nodes, endpointA) {
			var connections = [];
			nodes.forEach(function(o) {
				var edge = o.__edge;
				delete o.__edge;

				edge.__endpointa = endpointA;
				edge.__endpointb = {
					article: o,
					label: edge.__label,
					type: o.__schematype
				};
				delete edge.label;

				var connection = new global.Appacitive.Connection(edge, true);

				connections.push(connection);
			});
			return connections;
		};

		this.fetch = function(onSuccess, onError) {
			var request = this.toRequest();
			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
				    var _parse = parseNodes;
				    if (self.prev) _parse = prevParseNodes;

				    self.results = _parse(d.nodes ? d.nodes : [], { articleid : options.articleId, type: schema, label: d.parent });
			   	    self._setPaging(d.paginginfo);

			   	    if (typeof onSuccess === 'function') onSuccess(self.results, d.paginginfo);   
				} else {
					d = d || {};
					if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
			};
			global.Appacitive.http.send(request);
			return this;
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
		if (!options.label || options.label.trim().length === 0) throw new Error('Specify label for GetConnectionsQuery query');
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
				this.getQueryString() + 
				'&articleid=' + this.articleId +
				'&label=' + this.label;
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

		if (!options.articleAId || typeof options.articleAId !== 'string' || options.articleAId.length === 0) throw new Error('Specify valid articleAId for GetConnectionsBetweenArticlesQuery query');
		if (!options.articleBId || typeof options.articleBId !== 'string' || options.articleBId.length === 0) throw new Error('Specify articleBId for GetConnectionsBetweenArticlesQuery query');
		if (options.schema) delete options.schema;

		options.queryType = queryType || 'GetConnectionsBetweenArticlesQuery';

		BasicQuery.call(this, options);

		this.articleAId = options.articleAId;
		this.articleBId = options.articleBId;
		this.label = (this.queryType() === 'GetConnectionsBetweenArticlesForRelationQuery' && options.label && typeof options.label === 'string' && options.label.length > 0) ? '&label=' + options.label : '';
		this.relation = (options.relation && typeof options.relation === 'string' && options.relation.length > 0) ? options.relation + '/' : '';
		
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
				   if (typeof onSuccess === 'function') onSuccess(d.connection ? new global.Appacitive.Connection(d.connection) :  null);
				} else {
					d = d || {};
					if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
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

		if (!options.articleAId || typeof options.articleAId !== 'string' || options.articleAId.length === 0) throw new Error('Specify valid articleAId for InterconnectsQuery query');
		if (!options.articleBIds || typeof options.articleBIds !== 'object' || !(options.articleBIds.length > 0)) throw new Error('Specify list of articleBIds for InterconnectsQuery query');
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

		if (!name || name.length === 0) throw new Error("Specify name of filter query");
		
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
				   if (typeof onSuccess === 'function') {
				   		onSuccess(d.ids ? d.ids : []);
					}
				} else {
					d = d || {};
					if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
			};
			global.Appacitive.http.send(request);
			return this;
		};

	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GraphProjectQuery = function(name, ids, placeholders) {

		if (!name || name.length === 0) throw new Error("Specify name of project query");
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

					var tmpArticle = new global.Appacitive.Article(o, true);
					tmpArticle.children = {};
					for (var key in children) {
						tmpArticle.children[key] = [];
						tmpArticle.children[key] = parseChildren(children[key].values, children[key].parent, tmpArticle.id);
					}

					if (edge) {
						edge.__endpointa = {
							articleid : parentId,
							label: parentLabel
						};
						edge.__endpointb = {
							articleid: tmpArticle.id(),
							label: edge.__label
						};
						delete edge.__label;
						tmpArticle.connection = new global.Appacitive.Connection(edge);
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
				   if (typeof onSuccess === 'function') {
				   		onSuccess(_parseResult(d));
					}
				} else {
					d = d || {};
					if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
				}
			};
			request.onError = function(d) {
				d = d || {};
				if (typeof onError === 'function') onError(d.status || { message : 'Server error', code: 400 });
			};
			global.Appacitive.http.send(request);
			return this;
		};
	};

})(global);
