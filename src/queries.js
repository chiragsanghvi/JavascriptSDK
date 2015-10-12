(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    Appacitive.Queries = {};

    // page query for contains pagination
    /** 
     * @constructor
     **/
    var PageQuery = function(o) {
        var options = o || {};
        this._pageNumber = 1;
        this._pageSize = null;
        this.isPageDefault = true;
        this.pageNumber(options.pageNumber);
        this.pageSize(options.pageSize);
    };

    //define getter and setter for pageNumber
    PageQuery.prototype.pageNumber = function() {
        if (arguments.length == 1 && !_type.isNullOrUndefined(arguments[0])) {
            this._pageNumber = arguments[0] || 1;
            this.isPageDefault = false;
            return this;
        }
        return this._pageNumber;
    };
    //define getter and setter for pageSize
    PageQuery.prototype.pageSize = function() {
        if (arguments.length == 1 && !_type.isNullOrUndefined(arguments[0])) {
            this._pageSize = arguments[0];
            this.isPageDefault = false;
            return this;
        }
        return this._pageSize;
    };

    PageQuery.prototype.resetPaging = function() {
        this._pageSize = null;
        this._pageNumber = 1;
        this.isPageDefault = true;
        return this;
    };


    //define method for getting final API pageString
    PageQuery.prototype.pageString = function() {
        return 'pnum=' + this._pageNumber + (this._pageSize ? '&psize=' + this._pageSize : '');
    };

    // sort query
    /** 
     * @constructor
     **/
    var SortQuery = function(o) {
        var options = o || {};
        this._isAscending = false;
        this._order = [];
        this.isSortSet = false;

        if (!_type.isNullOrUndefined(options.isAscending)) this.isAscending(options.isAscending);
        this.orderBy(options.orderBy);
        if (options.ascending) this.ascending(options.ascending);
        if (options.descending) this.descending(options.descending);
    };

    //define getter/setter for orderby
    SortQuery.prototype.orderBy = function() {
        if (arguments.length === 1 && _type.isString(arguments[0])) {
            this._order = [{
                orderBy: arguments[0],
                isAscending: this._isAscending
            }];
            this.isSortSet = true;
            return this;
        }
        return this._order[0] ? this._order[0].orderBy : null;
    };

    //define getter/setter for isAscending
    SortQuery.prototype.isAscending = function() {
        if (arguments.length === 1) {
            var _isAscending = (arguments[0] === undefined || arguments[0] == null) ? false : arguments[0];
            this._order.forEach(function(o) {
                o.isAscending = _isAscending;
            });
            this._isAscending = _isAscending;
            this.isSortSet = true;
            return this;
        }
        return this._order.length > 0 ? order[0].isAscending : this._isAscending;
    };


    SortQuery.prototype.resetSorting = function() {
        this._order = [];
        this._isAscending = false;
        this.isSortSet = false;
        return this;
    };

    SortQuery.prototype._setSorting = function(keys, isAscending) {
        if (arguments.length > 1) {
            var that = this;

            keys.forEach(function(key) {
                if (Array.isArray(key)) key = key.join();

                key.replace(/\s/g, '').split(',').forEach(function(k) {
                    var obj = that._order.findWhere({
                        orderBy: k.toLowerCase()
                    });
                    if (obj) obj.isAscending = isAscending;
                    else {
                        that._order.push({
                            orderBy: k.toLowerCase(),
                            isAscending: isAscending
                        });
                    }
                });
            });

            this.isSortSet = true;
        }

        return this;
    };

    SortQuery.prototype.ascending = function() {
        return this._setSorting(Array.prototype.slice.call(arguments), true);
    };

    SortQuery.prototype.descending = function() {
        return this._setSorting(Array.prototype.slice.call(arguments), false);
    };

    SortQuery.prototype.sortString = function() {
        if (this._order && this._order.length > 0) {
            return 'orderBy=' + (this._order.map(function(o) {
                return o.orderBy + " " + (o.isAscending ? 'asc' : 'desc');
            })).join(',');
        } else {
            return '';
        }
    };


    var CommonQueryHelper = function() {};

    CommonQueryHelper.prototype._setPaging = function(pi) {
        if (pi) {
            this.pageNumber(pi.pagenumber);
            this.pageSize(pi.pagesize);

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

    // define fields
    CommonQueryHelper.prototype.fields = function() {
        if (arguments.length === 1) {
            var value = arguments[0];
            if (_type.isString(value)) this._fields = [value];
            else if (_type.isArray(value) && value.length) this._fields = value;
            return this;
        }
        return this._fields;
    };


    CommonQueryHelper.prototype._parse = function(entities, metadata, options) {
        var entityObjects = [];
        if (!entities) entities = [];
        var eType = (this.type() === 'object') ? 'Object' : 'Connection';

        return Appacitive[eType]._parseResult(entities, options.entity, metadata);
    };

    /**
     * Returns a new instance of Appacitive.Collection backed by this query.
     * @param {Array} items An array of instances of <code>Appacitive.Object</code>
     *     with which to start this Collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>model: The Appacitive.Object subclass that this collection contains.
     *   <li>query: An instance of Appacitive.Queries to use when fetching items.
     *   <li>comparator: A string property name or function to sort by.
     * </ul>
     * @return {Appacitive.Collection}
     */
    CommonQueryHelper.prototype.collection = function(items, opts) {
        opts = opts || {};
        items = items;
        if (_type.isObject(items)) opts = items, items = null;

        if (!items) items = this.results ? this.results : [];

        var model = options.entity;

        if (!model && items.length > 0 && items[0] instanceof Appacitive.BaseObject) {
            var eType = items[0].type == 'object' ? 'Object' : 'Connection';
            model = Appacitive[eType]._getClass(items[0].className);
        }

        if (!model) {
            var eType = (_etype === 'object') ? 'Object' : 'Connection';
            model = Appacitive[eType]._getClass(this[eType]);
        }

        return new Appacitive.Collection(items, _extend(opts, {
            model: model,
            query: this
        }));
    };

    CommonQueryHelper.prototype.fetchNext = function(options) {
        var pNum = this.pageNumber();
        if (!pNum || pNum <= 0) pNum = 1;
        this.pageNumber(++pNum);
        return this.fetch(options);
    };

    CommonQueryHelper.prototype.fetchPrev = function(options) {
        var pNum = this.pageNumber();
        pNum -= 1;
        if (!pNum || pNum <= 0) pNum = 1;
        this.pageNumber(pNum);
        return this.fetch(options);
    };

    CommonQueryHelper.prototype.count = function(options) {
        var promise = Appacitive.Promise.buildPromise(options);

        var _queryRequest = this.toRequest(options);
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
        return Appacitive.http.send(_queryRequest);
    };

    // base query
    /** 
     * @constructor
     **/
    var BasicQuery = function(o) {

        var options = o || {};

        PageQuery.call(this, o);
        SortQuery.call(this, o);
        CommonQueryHelper.call(this, o);

        //set filters , freetext and fields
        var _filter = '';
        var _freeText = '';
        var _queryType = options.queryType || 'BasicQuery';
        var _entityType = options.type || options.relation;
        var _etype = (options.relation) ? 'connection' : 'object';

        var self = this;
        this._fields = [];

        // 
        if (options.entity) this.entity = options.entity;

        // define getter for type (object/connection)
        this.type = function() {
            return _etype;
        };

        // define getter for basetype (type/relation)
        this.entityType = function() {
            return _entityType;
        };

        // define getter for querytype (basic,connectedobjects etc)
        this.queryType = function() {
            return _queryType;
        };

        // define getter and setter for filter
        this.filter = function() {
            if (arguments.length === 1) {
                _filter = arguments[0];
                return this;
            }
            return _filter;
        };

        // define getter and setter for freetext
        this.freeText = function() {
            if (arguments.length === 1) {
                var value = arguments[0];
                if (_type.isString(value)) _freeText = arguments[0];
                else if (_type.isArray(value) && value.length) _freeText = arguments[0].join(' ');
                return this;
            }
            return _freeText;
        };

        // set filters , freetext and fields
        this.filter(options.filter || '');
        this.freeText(options.freeText || '');
        this.fields(options.fields || []);

        this.setFilter = function() {
            this.filter(arguments[0]);
        };
        this.setFreeText = function() {
            this.freeText(arguments[0]);
        };
        this.setFields = function() {
            this.fields(arguments[0]);
        };

        this.extendOptions = function(changes) {
            for (var key in changes) {
                options[key] = changes[key];
            }
            PageQuery.call(this, options);
            SortQuery.call(this, options);
            return this;
        };

        this.getQueryString = function() {

            var finalUrl = this.pageString();

            var sortQuery = this.sortString();

            if (sortQuery) finalUrl += '&' + sortQuery;

            if (this.filter()) {
                var filter = encodeURIComponent(this.filter().toString());
                if (filter.trim().length > 0) finalUrl += '&query=' + filter;
            }

            if (this.freeText() && this.freeText().trim().length > 0) {
                finalUrl += "&freetext=" + encodeURIComponent(this.freeText()) + "&language=en";
            }

            if (this._fields && this._fields.length > 0) {
                finalUrl += "&fields=" + this._fields.join(',');
            }

            return finalUrl;
        };

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + _etype + '/' + _entityType + '/find/all?' + this.getQueryString(),
                description: 'FindAll ' + _entityType + ' ' + _etype + 's'
            }
        };

        this.toRequest = function(options) {
            var r = new Appacitive.HttpRequest();
            var obj = this.toUrl();
            r.url = obj.url;
            r.options = options;
            r.description = obj.description;
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

        this.fetch = function(opts) {
            var promise = Appacitive.Promise.buildPromise(opts);

            var request = this.toRequest(opts);
            request.onSuccess = function(d) {
                self.results = self._parse(d[_etype + 's'], d.__meta, options);
                self._setPaging(d.paginginfo);

                promise.fulfill(self.results, d.paginginfo);
            };
            request.promise = promise;
            request.entity = this;
            return Appacitive.http.send(request);
        };

        this.fetch = function(opts) {
            var promise = Appacitive.Promise.buildPromise(opts);

            var request = this.toRequest(opts);
            request.onSuccess = function(d) {
                self.results = self._parse(d[_etype + 's'], d.__meta, options);
                self._setPaging(d.paginginfo);

                promise.fulfill(self.results, d.paginginfo);
            };
            request.promise = promise;
            request.entity = this;
            return Appacitive.http.send(request);
        };

    };

    _extend(BasicQuery.prototype, CommonQueryHelper.prototype, SortQuery.prototype, PageQuery.prototype);

    /** 
     * @constructor
     **/
    Appacitive.Queries.FindAllQuery = function(options) {

        options = options || {};

        if (!options.type && !options.relation) throw new Error('Specify either type or relation for basic filter query');

        options.queryType = 'FindAllQuery';

        BasicQuery.call(this, options);

        return this;
    };

    Appacitive.Queries.FindAllQuery.prototype = new BasicQuery();

    Appacitive.Queries.FindAllQuery.prototype.constructor = Appacitive.Queries.FindAllQuery;

    /** 
     * @constructor
     **/
    Appacitive.Query = Appacitive.Queries.FindAllQuery;

    /** 
     * @constructor
     **/
    Appacitive.Queries.ConnectedObjectsQuery = function(options) {

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
        if (options.object instanceof Appacitive.Object) this.object = options.object;

        this.returnEdge = true;
        if (options.returnEdge !== undefined && options.returnEdge !== null && !options.returnEdge) this.returnEdge = false;

        this.label = '';
        var self = this;

        if (_type.isString(options.label) && options.label.length > 0) this.label = '&label=' + options.label;

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/' + this.type + '/' + this.objectId + '/find?' +
                    this.getQueryString() + this.label + '&returnEdge=' + this.returnEdge,
                description: 'GetConnectedObjects for relation ' + this.relation + ' of type ' + this.type + ' for object ' + this.objectId
            };
        };

        var parseNodes = function(nodes, endpointA, nodeMeta, edgeMeta) {
            var objects = [];
            nodes.forEach(function(o) {
                var edge = o.__edge;
                delete o.__edge;

                var tmpObject = Appacitive.Object._create(_extend({
                    __meta: nodeMeta
                }, o), true);

                if (edge) {
                    edge.__endpointa = endpointA;
                    edge.__endpointb = {
                        objectid: o.__id,
                        label: edge.__label,
                        type: o.__type
                    };
                    delete edge.label;
                    tmpObject.connection = Appacitive.Connection._create(_extend({
                        __meta: edgeMeta
                    }, edge), true);
                }
                objects.push(tmpObject);
            });

            if (self.object) self.object.children[self.relation] = objects;

            return objects;
        };

        this.fetch = function(opts) {
            var promise = Appacitive.Promise.buildPromise(opts);

            var request = this.toRequest(opts);
            request.onSuccess = function(d) {
                var _parse = parseNodes;
                self.results = _parse(d.nodes ? d.nodes : [], {
                    objectid: options.objectId,
                    type: type,
                    label: d.parent
                }, d.__nodemeta, d.__edgemeta);
                self._setPaging(d.paginginfo);

                promise.fulfill(self.results, d.paginginfo);
            };
            request.promise = promise;
            request.entity = this;
            return Appacitive.http.send(request);
        };

        return this;
    };

    Appacitive.Queries.ConnectedObjectsQuery.prototype = new BasicQuery();
    Appacitive.Queries.ConnectedObjectsQuery.prototype.constructor = Appacitive.Queries.ConnectedObjectsQuery;

    /** 
     * @constructor
     **/
    Appacitive.Queries.GetConnectionsQuery = function(options) {

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

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + 'connection/' + this.relation + '/find/all?' +
                    this.getQueryString() +
                    '&objectid=' + this.objectId +
                    '&label=' + this.label,
                description: 'FindAllConnections for relation ' + this.relation + ' from object id ' + this.objectId
            };
        };

        return this;
    };

    Appacitive.Queries.GetConnectionsQuery.prototype = new BasicQuery();
    Appacitive.Queries.GetConnectionsQuery.prototype.constructor = Appacitive.Queries.GetConnectionsQuery;

    /** 
     * @constructor
     **/
    Appacitive.Queries.GetConnectionsBetweenObjectsQuery = function(options, queryType) {

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

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + 'connection/' + this.relation + 'find/' + this.objectAId + '/' + this.objectBId + '?' + this.getQueryString() + this.label,
                description: 'FindConnectionBetween for relation ' + this.relation + ' between object ids ' + this.objectAId + ' and ' + this.objectBId
            };
        };

        return this;
    };

    Appacitive.Queries.GetConnectionsBetweenObjectsQuery.prototype = new BasicQuery();
    Appacitive.Queries.GetConnectionsBetweenObjectsQuery.prototype.constructor = Appacitive.Queries.GetConnectionsBetweenObjectsQuery;

    /** 
     * @constructor
     **/
    Appacitive.Queries.GetConnectionsBetweenObjectsForRelationQuery = function(options) {

        options = options || {};

        if (!options.relation) throw new Error('Specify relation for GetConnectionsBetweenObjectsForRelationQuery query');

        var inner = new Appacitive.Queries.GetConnectionsBetweenObjectsQuery(options, 'GetConnectionsBetweenObjectsForRelationQuery');

        inner.fetch = function(opts) {
            var promise = Appacitive.Promise.buildPromise(opts);

            var request = this.toRequest(opts);
            request.onSuccess = function(d) {
                inner.results = d.connection ? [Appacitive.Connection._create(_extend({
                    __meta: d.__meta
                }, d.connection), true, options.entity)] : null
                promise.fulfill(inner.results ? inner.results[0] : null);
            };
            request.promise = promise;
            request.entity = this;
            return Appacitive.http.send(request);
        };

        return inner;
    };

    /** 
     * @constructor
     **/
    Appacitive.Queries.InterconnectsQuery = function(options) {

        options = options || {};

        delete options.entity;

        if (!options.objectAId || !_type.isString(options.objectAId) || options.objectAId.length === 0) throw new Error('Specify valid objectAId for InterconnectsQuery query');
        if (!options.objectBIds || !_type.isArray(options.objectBIds) || !(options.objectBIds.length > 0)) throw new Error('Specify list of objectBIds for InterconnectsQuery query');
        if (options.type) delete options.type;

        options.queryType = 'InterconnectsQuery';

        BasicQuery.call(this, options);

        this.objectAId = options.objectAId;
        this.objectBIds = options.objectBIds;

        this.toRequest = function(options) {
            var r = new Appacitive.HttpRequest();
            var obj = this.toUrl();
            r.url = obj.url;
            r.options = options;
            r.description = obj.description;
            r.method = 'post';
            r.data = {
                object1id: this.objectAId,
                object2ids: this.objectBIds
            };
            return r;
        };

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + 'connection/interconnects?' + this.getQueryString(),
                description: 'GetInterConnections between objects'
            };
        };

        return this;
    };

    Appacitive.Queries.InterconnectsQuery.prototype = new BasicQuery();
    Appacitive.Queries.InterconnectsQuery.prototype.constructor = Appacitive.Queries.InterconnectsQuery;


    /** 
     * @constructor
     **/
    Appacitive.Queries.GraphQuery = function(name, placeholders, options) {


        if (_type.isObject(name)) {
            options = name;
            options.returnObjects = name.returnObjects || options.returnObjects;
            placeholders = name.placeholders || {};
            name = options.name;
        }

        if (!name || name.length === 0) throw new Error("Specify name of filter query");

        options = options || {};

        this.returnObjects = options.returnObjects;

        PageQuery.call(this, options);
        SortQuery.call(this, options);
        CommonQueryHelper.call(this, options);

        this.name = name;
        this.data = {};
        this.queryType = 'GraphQuery';
        this.fields(options.fields || []);
        var self = this;

        if (placeholders) {
            this.data.placeholders = placeholders;
            for (var ph in this.data.placeholders) {
                this.data.placeholders[ph] = this.data.placeholders[ph];
            }
        }

        this.type = function() {
            return 'object';
        }

        this.toRequest = function(options) {
            var r = new Appacitive.HttpRequest();
            var obj = this.toUrl();
            r.url = obj.url;
            r.options = options;
            r.description = obj.description;
            r.method = 'post';
            r.data = this.data;
            return r;
        };

        this.getQueryString = function() {
            var urls = [];

            if (!this.isPageDefault) urls.push(this.pageString());
            if (this.isSortSet) urls.push(this.sortString());
            if (this._fields && this._fields.length > 0) urls.push('fields=' + this._fields.join(','));
            return urls.join('&');
        };

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + 'search/' + this.name + '/' + (this.returnObjects ? 'graphquery' : 'filter') + '?' + this.getQueryString(),
                description: 'Filter Query with name ' + this.name
            };
        };

        this.fetch = function(opts) {
            var promise = Appacitive.Promise.buildPromise(opts);
            var request = this.toRequest(opts);
            request.onSuccess = function(d) {
                var response;

                if (self.returnObjects) {
                    self.results = self._parse(d['objects'], d.__meta, options);
                    response = self.results;
                } else {
                    response = d.ids ? d.ids : [];
                    this.results = response;
                }

                if (d.paginginfo) self._setPaging(d.paginginfo);

                promise.fulfill(response, d.paginginfo);
            };
            request.promise = promise;
            request.entity = this;
            return Appacitive.http.send(request);
        };

    };
    _extend(Appacitive.Queries.GraphQuery.prototype, CommonQueryHelper.prototype, SortQuery.prototype, PageQuery.prototype);

    /** 
     * @constructor
     **/
    Appacitive.Queries.GraphAPI = function(name, ids, placeholders) {

        if (!name || name.length === 0) throw new Error("Specify name of project query");
        if (!ids || !ids.length) throw new Error("Specify ids to project");

        this.name = name;
        this.data = {
            ids: ids
        };
        this.queryType = 'GraphApi';
        var self = this;

        if (placeholders) {
            this.data.placeholders = placeholders;
            for (var ph in this.data.placeholders) {
                this.data.placeholders[ph] = this.data.placeholders[ph];
            }
        }

        this.toRequest = function(options) {
            var r = new Appacitive.HttpRequest();
            var obj = this.toUrl();
            r.url = obj.url;
            r.description = obj.description;
            r.method = 'post';
            r.data = this.data;
            r.options = options;
            return r;
        };

        this.toUrl = function() {
            return {
                url: Appacitive.config.apiBaseUrl + 'search/' + this.name + '/project',
                description: 'Project Query with name ' + this.name
            };
        };

        var _parseResult = function(result) {
            var root;
            for (var key in result) {
                if (key !== 'status') {
                    root = result[key];
                    break;
                }
            }
            var parseChildren = function(obj, parentLabel, parentId, nodeMeta, edgeMeta) {
                var props = [];
                obj.forEach(function(o) {
                    var children = o.__children;
                    delete o.__children;

                    var edge = o.__edge;
                    delete o.__edge;

                    var tmpObject = Appacitive.Object._create(_extend({
                        __meta: nodeMeta
                    }, o), true);
                    tmpObject.children = {};
                    for (var key in children) {
                        tmpObject.children[key] = [];
                        tmpObject.children[key] = parseChildren(children[key].values, children[key].parent, tmpObject.id, children[key].__nodemeta, children[key].__edgemeta);
                    }

                    if (edge) {
                        edge.__endpointa = {
                            objectid: parentId,
                            label: parentLabel
                        };
                        edge.__endpointb = {
                            objectid: tmpObject.id,
                            label: edge.__label
                        };
                        delete edge.__label;
                        tmpObject.connection = Appacitive.Connection._create(_extend({
                            __meta: edgeMeta
                        }, edge), true);
                    }
                    props.push(tmpObject);
                });
                return props;
            };
            return parseChildren(root.values, null, null, root.__nodemeta);
        };


        this.collection = function(items, opts) {
            opts = opts || {};
            items = items;
            if (_type.isObject(items)) opts = items, items = null;

            if (!items) items = this.results ? ths.results : [];

            var model;

            if (items.length > 0 && items[0] instanceof Appacitive.BaseObject) {
                model = Appacitive.Object._getClass(items[0].className);
            }

            return new Appacitive.Collection(items, _extend(opts, {
                model: model,
                query: this
            }));
        };

        this.fetch = function(options) {

            var promise = Appacitive.Promise.buildPromise(options);

            var request = this.toRequest(options);
            request.onSuccess = function(d) {
                self.results = _parseResult(d);
                promise.fulfill(self.results);
            };
            request.promise = promise;
            request.entity = this;
            return Appacitive.http.send(request);
        };
    };

})(global);
