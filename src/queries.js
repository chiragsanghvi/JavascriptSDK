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
		var _orderBy = null;
		var _isAscending = false;

		//define getter/setter for orderby
		this.orderBy =  function() { 
			if (arguments.length === 1 && _type.isString(arguments[0])) {
				_orderBy = arguments[0];
				return this;
			}
			return _orderBy; 
		};

		//define getter for isAscending
		this.isAscending =  function() { 
			if (arguments.length === 1) {
				_isAscending = (arguments[0] === undefined || arguments[0] == null) ? false : arguments[0];
				return this;
			}
			return _isAscending; 
		};

		this.orderBy(options.orderBy);
		this.isAscending(options.isAscending);
	};
	SortQuery.prototype.toString = function() {
		if (this.orderBy() && this.orderBy().length > 0) {
			return 'orderBy=' + this.orderBy() + '&isAsc=' + this.isAscending();
		} else {
			return '';
		}
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
		var _entityType = options.type || options.relation;
		var _etype = (options.relation) ? 'connection' : 'object';
		
		var self = this;

		// 
		if (options.entity) this.entity = options.entity;

		// define getter for type (object/connection)
		this.type = function() { return _etype; };

		// define getter for basetype (type/relation)
		this.entityType = function() { return _entityType; };

		// define getter for querytype (basic,connectedobjects etc)
		this.queryType = function() { return _queryType; };

		// define getter for pagequery 
		this.pageQuery = function() { return _pageQuery; };

		
		// define getter and setter for pageNumber
		this.pageNumber =  function() { 
			if (arguments.length === 1) {
				_pageQuery.pageNumber(arguments[0]);
				return this;
			}
			return _pageQuery.pageNumber(); 
		};

		// define getter and setter for pageSize
		this.pageSize =  function() { 
			if (arguments.length === 1) {
				_pageQuery.pageSize(arguments[0]);
				return this;
			}
			return _pageQuery.pageSize(); 
		};

		// define getter for sortquery
		this.sortQuery = function() { return _sortQuery; };

		// define getter and setter for orderby
		this.orderBy =  function() { 
			if (arguments.length === 1) {
				_sortQuery.orderBy(arguments[0]);
				return this;
			}
			return _sortQuery.orderBy(); 
		};

		// define getter and setter for isAscending
		this.isAscending =  function() { 
			if (arguments.length === 1) {
				_sortQuery.isAscending(arguments[0]);
				return this;
			}
			return _sortQuery.isAscending(); 
		};

		// define getter and setter for filter
		this.filter =  function() { 
			if (arguments.length === 1) {
				_filter = arguments[0];
				return this;
			}
			return _filter; 
		};		
		
		// define getter and setter for freetext
		this.freeText =  function() { 
			if (arguments.length === 1) {
				var value = arguments[0];
				if (_type.isString(value)) _freeText = arguments[0];
				else if (_type.isArray(value) && value.length) _freeText = arguments[0].join(' ');
				return this;
			}
			return _freeText; 
		};		
		
		// define fields
		this.fields = function() {
			if (arguments.length === 1) {
				var value = arguments[0];
				if (_type.isString(value)) _fields = value;
				else if (_type.isArray(value) && value.length) _fields = value.join(',');
				return this;
			} else {
				return _fields;
			}
		};

		// set filters , freetext and fields
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

			var finalUrl = _pageQuery.toString();

			var sortQuery =  _sortQuery.toString();

			if (sortQuery) finalUrl += '&' + sortQuery;

			
			if (this.filter()) {
				var filter = encodeURIComponent(this.filter().toString());
			    if (filter.trim().length > 0) finalUrl += '&query=' + filter;
			}

			if (this.freeText() && this.freeText().trim().length > 0) {
                finalUrl += "&freetext=" + encodeURIComponent(this.freeText()) + "&language=en";
            }

            if (this.fields() && this.fields().trim().length > 0) {
            	finalUrl += "&fields=" + this.fields();
            }

			return finalUrl;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + _etype + '/' + _entityType + '/find/all?' + this.getQueryString();
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
				if (this.hasOwnProperty(key) && !_type.isFunction(this[key])) {
					o[key] = this[key];
				}
			}
			return o;
		};

		this._setPaging = function(pi) {
			if (pi) {
				_pageQuery.pageNumber(pi.pagenumber);
				_pageQuery.pageSize(pi.pagesize);
				
				this.results = this.results || [];

				this.results.isLastPage = false;
				this.results.total = pi.totalrecords;
				this.results.pageNumber = pi.pagenumber;
				this.results.pageSize = pi.pagesize;
				
				if ((pi.pagenumber * pi.pagesize) >= pi.totalrecords) {
					this.results.isLastPage = true;
				}
			}
		};

		var _parse = function(entities) {
			var entityObjects = [];
			if (!entities) entities = [];
			var eType = (_etype === 'object') ? 'Object' : 'Connection';

			return global.Appacitive[eType]._parseResult(entities, options.entity);
		};

		this.fetch = function(callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request = this.toRequest();
			request.onSuccess = function(d) {
			   self.results = _parse(d[_etype + 's']);
			   self._setPaging(d.paginginfo);

			   promise.fulfill(self.results, d.paginginfo);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		this.fetchNext = function(callbacks) {
			var pNum = this.pageNumber();
			this.pageNumber(++pNum);
			return this.fetch(callbacks);
		};

		this.fetchPrev = function(callbacks) {
			var pNum = this.pageNumber();
			pNum -= 1;
			if (pNum <= 0) pNum = 1;
			this.pageNumber(pNum);
			return this.fetch(callbacks);
		};

		this.count = function(callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var _queryRequest = this.toRequest();
			_queryRequest.onSuccess = function(data) {
				data = data || {};
				var pagingInfo = data.paginginfo;

				var count = 0;
				if (!pagingInfo) {
					count = 0;
				} else {
					count = pagingInfo.totalrecords;
				}
				promise.fulfill(count);
			};
			_queryRequest.promise = promise;
			_queryRequest.entity = this;
			return global.Appacitive.http.send(_queryRequest);
		};
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.FindAllQuery = function(options) {

		options = options || {};

		if ((!options.type && !options.relation) || (options.type && options.relation)) 
		    throw new Error('Specify either type or relation for basic filter query');

		options.queryType = 'BasicFilterQuery';

		BasicQuery.call(this, options);

		return this;
	};

	global.Appacitive.Queries.FindAllQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.FindAllQuery.prototype.constructor = global.Appacitive.Queries.FindAllQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.ConnectedObjectsQuery = function(options) {

		options = options || {};

		if (!options.relation) throw new Error('Specify relation for connected objects query');
		if (!options.objectId) throw new Error('Specify objectId for connected objects query');
		if (!options.type) throw new Error('Specify type of object id for connected objects query');
		
		var type = options.type;
		delete options.type;

		options.queryType = 'ConnectedObjectsQuery';

		BasicQuery.call(this, options);

		this.objectId = options.objectId;
		this.relation = options.relation;
		this.type = type;
		if (options.object instanceof global.Appacitive.Object) this.object = options.object;

		this.returnEdge = true;
		if (options.returnEdge !== undefined && options.returnEdge !== null && !options.returnEdge && !this.prev) this.returnEdge = false;
		
		this.label = '';
		var self = this;

		if (_type.isString(options.label) && options.label.length > 0) this.label = '&label=' + options.label;

		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/' + this.type + '/' + this.objectId + '/find?' +
				this.getQueryString() + this.label + '&returnEdge=' + this.returnEdge;
		};


		var parseNodes = function(nodes, endpointA) {
			var objects = [];
			nodes.forEach(function(o) {
				var edge = o.__edge;
				delete o.__edge;

				var tmpObject = global.Appacitive.Object._create(o, true);

				if (edge) {
					edge.__endpointa = endpointA;
					edge.__endpointb = {
						objectid: o.__id,
						label: edge.__label,
						type: o.__type
					};
					delete edge.label;
					tmpObject.connection = global.Appacitive.Connection._create(edge, true);
				}
				objects.push(tmpObject);
			});
			
			if (self.object) self.object.children[self.relation] = objects;

			return objects;
		};

		this.fetch = function(callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);
			
			var request = this.toRequest();
			request.onSuccess = function(d) {
			    var _parse = parseNodes;
			    self.results = _parse(d.nodes ? d.nodes : [], { objectid : options.objectId, type: type, label: d.parent });
		   	    self._setPaging(d.paginginfo);

		   	    promise.fulfill(self.results, d.paginginfo);   
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		return this;
	};

	global.Appacitive.Queries.ConnectedObjectsQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.ConnectedObjectsQuery.prototype.constructor = global.Appacitive.Queries.ConnectedObjectsQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsQuery = function(options) {

		options = options || {};

		if (!options.relation) throw new Error('Specify relation for GetConnectionsQuery query');
		if (!options.objectId) throw new Error('Specify objectId for GetConnectionsQuery query');
		if (!options.label || options.label.trim().length === 0) throw new Error('Specify label for GetConnectionsQuery query');
		if (options.type) delete options.type;

		options.queryType = 'GetConnectionsQuery';

		BasicQuery.call(this, options);

		this.objectId = options.objectId;
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
				'&objectid=' + this.objectId +
				'&label=' + this.label;
		};

		return this;
	};

	global.Appacitive.Queries.GetConnectionsQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.GetConnectionsQuery.prototype.constructor = global.Appacitive.Queries.GetConnectionsQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsBetweenObjectsQuery = function(options, queryType) {

		options = options || {};

		delete options.entity;

		if (!options.objectAId || !_type.isString(options.objectAId) || options.objectAId.length === 0) throw new Error('Specify valid objectAId for GetConnectionsBetweenObjectsQuery query');
		if (!options.objectBId || !_type.isString(options.objectBId) || options.objectBId.length === 0) throw new Error('Specify objectBId for GetConnectionsBetweenObjectsQuery query');
		if (options.type) delete options.type;

		options.queryType = queryType || 'GetConnectionsBetweenObjectsQuery';

		BasicQuery.call(this, options);

		this.objectAId = options.objectAId;
		this.objectBId = options.objectBId;
		this.label = (this.queryType() === 'GetConnectionsBetweenObjectsForRelationQuery' && options.label && _type.isString(options.label) && options.label.length > 0) ? '&label=' + options.label : '';
		this.relation = (options.relation && _type.isString(options.relation) && options.relation.length > 0) ? options.relation + '/' : '';
		
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'get';
			return r;
		};

		this.toUrl = function() {
			return global.Appacitive.config.apiBaseUrl + 'connection/' + this.relation + 'find/' + this.objectAId + '/' + this.objectBId + '?'
				+ this.getQueryString() + this.label;
		};

		return this;
	};

	global.Appacitive.Queries.GetConnectionsBetweenObjectsQuery.prototype = new BasicQuery();

	global.Appacitive.Queries.GetConnectionsBetweenObjectsQuery.prototype.constructor = global.Appacitive.Queries.GetConnectionsBetweenObjectsQuery;

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.GetConnectionsBetweenObjectsForRelationQuery = function(options) {
		
		options = options || {};
		
		if (!options.relation) throw new Error('Specify relation for GetConnectionsBetweenObjectsForRelationQuery query');
		
		var inner = new global.Appacitive.Queries.GetConnectionsBetweenObjectsQuery(options, 'GetConnectionsBetweenObjectsForRelationQuery');

		inner.fetch = function(callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request = this.toRequest();
			request.onSuccess = function(d) {
				promise.fulfill(d.connection ? global.Appacitive.Connection._create(d.connection, true, options.entity) :  null);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};

		return inner;
	};

	/** 
	* @constructor
	**/
	global.Appacitive.Queries.InterconnectsQuery = function(options) {

		options = options || {};

		delete options.entity;

		if (!options.objectAId || !_type.isString(options.objectAId) || options.objectAId.length === 0) throw new Error('Specify valid objectAId for InterconnectsQuery query');
		if (!options.objectBIds || !_type.isArray(options.objectBIds) || !(options.objectBIds.length > 0)) throw new Error('Specify list of objectBIds for InterconnectsQuery query');
		if (options.type) delete options.type;

		options.queryType = 'InterconnectsQuery';

		BasicQuery.call(this, options);

		this.objectAId = options.objectAId;
		this.objectBIds = options.objectBIds;
		
		this.toRequest = function() {
			var r = new global.Appacitive.HttpRequest();
			r.url = this.toUrl();
			r.method = 'post';
			r.data = {
				object1id: this.objectAId,
				object2ids: this.objectBIds
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

		if (placeholders) { 
			this.data.placeholders = placeholders;
			for (var ph in this.data.placeholders) {
				this.data.placeholders[ph] = this.data.placeholders[ph];
			}
		}
		
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

		this.fetch = function(callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request = this.toRequest();
			request.onSuccess = function(d) {
		   		promise.fulfill(d.ids ? d.ids : []);
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
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

		if (placeholders) { 
			this.data.placeholders = placeholders;
			for (var ph in this.data.placeholders) {
				this.data.placeholders[ph] = this.data.placeholders[ph];
			}
		}

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

					var tmpObject = global.Appacitive.Object._create(o, true);
					tmpObject.children = {};
					for (var key in children) {
						tmpObject.children[key] = [];
						tmpObject.children[key] = parseChildren(children[key].values, children[key].parent, tmpObject.id);
					}

					if (edge) {
						edge.__endpointa = {
							objectid : parentId,
							label: parentLabel
						};
						edge.__endpointb = {
							objectid: tmpObject.id(),
							label: edge.__label
						};
						delete edge.__label;
						tmpObject.connection = global.Appacitive.Connection._create(edge, true);
					}
					props.push(tmpObject);
				});
				return props;
			};
			return parseChildren(root.values);
		};

		this.fetch = function(callbacks) {
			
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request = this.toRequest();
			request.onSuccess = function(d) {
		   		promise.fulfill(_parseResult(d));
			};
			request.promise = promise;
			request.entity = this;
			return global.Appacitive.http.send(request);
		};
	};

})(global);