(function(global) {

	"use strict";

	//base object for articles and connections
	/**
	* @constructor
	**/
	var _BaseObject = function(objectOptions, setSnapShot) {

		var _snapshot = {};

		//Copy properties to current object
		var _copy = function(src, des) {
			for (var property in src) {
				if (typeof src[property] == 'string') {
					des[property] = src[property];
				} else if (typeof src[property] == 'object')  {
					if (src[property].length >=0 ) des[property] = [];
					else des[property] = {};
					for (var p in src[property]) {
						des[property][p] = src[property][p];
					}
				} else {
					des[property] = src[property];
				}
			}
		};

		var that = this;

		var raw = {};
		_copy(objectOptions, raw);
		var article = raw;

		//will be used in case of creating an appacitive article for internal purpose
		if (setSnapShot) {
			_copy(article, _snapshot);
		}

		if (!_snapshot.__id && raw.__id) _snapshot.__id = raw.__id;

		//Check whether __schematype or __relationtype is mentioned and set type property
		if (raw.__schematype) { 
			raw.__schematype = raw.__schematype.toLowerCase();
			this.entityType = raw.__schematype;
			this.schema = this.entityType;
			//if __schematype is user/device then set specific
			if (raw.__schematype == 'user' || raw.__schematype == 'device') this.type = raw.__schematype;
			else this.type = 'article';
		} else if (raw.__relationtype) {
			raw.__relationtype = raw.__relationtype.toLowerCase();
			this.entityType = raw.__relationtype;
			this.relation = this.entityType;
			this.type = 'connection';
		}

		var __cid = parseInt(Math.random() * 1000000, 10);

		this.cid = __cid;

		//Fileds to be ignored while update operation
		var _ignoreTheseFields = ["__id", "__revision", "__endpointa", "__endpointb", "__createdby", "__lastmodifiedby", "__schematype", "__relationtype", "__schemaid", "__relationid", "__utcdatecreated", "__utclastupdateddate", "__tags", "__authType", "__link"];
		
		var _allowObjectSetOperations = ["__link", "__endpointa", "__endpointb"];

		/* parse api output to get error info
		   TODO: define error objects in future depending on codes and messages */
		var _getOutpuStatus = function(data) {
			data = data || {};
			data.message = data.message || 'Server error';
			data.code = data.code || '500';
			return data;
		};

		this.attributes = this.toJSON = this.getObject = function() { return JSON.parse(JSON.stringify(article)); };

		this.properties = function() {
			var properties = this.attributes();
			delete properties.__attributes;
			delete properties.__tags;
			return properties;
		};

		this.id = function() {
			if (arguments.length === 1) {
				this.set('__id', arguments[0]);
				return this;
			}
			return this.get('__id');	
		};

		if (!article.__attributes) article.__attributes = {};
		if (!_snapshot.__attributes) _snapshot.__attributes = {};

		// accessor function for the article's attributes
		this.attr = function() {
			if (arguments.length === 0) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes;
			} else if (arguments.length == 1) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes[arguments[0]];
			} else if (arguments.length == 2) {
				if (typeof(arguments[1]) !== 'string' && arguments[1] != null)
					throw new Error('only string values can be stored in attributes.');
				if (!article.__attributes) article.__attributes = {};
				article.__attributes[arguments[0]] = arguments[1];
			} else throw new Error('.attr() called with an incorrect number of arguments. 0, 1, 2 are supported.');

			return article.__attributes;
		};

		//accessor function to get changed attributes
		var _getChangedAttributes = function() {
			if (!_snapshot.__attributes) return null;

			var isDirty = false;
			var changeSet = JSON.parse(JSON.stringify(_snapshot.__attributes));
			for (var property in article.__attributes) {
				if (typeof article.__attributes[property] == 'undefined' || article.__attributes[property] === null) {
					changeSet[property] = null;
					isDirty = true;
				} else if (article.__attributes[property] != _snapshot.__attributes[property]) {
					changeSet[property] = article.__attributes[property];
					isDirty = true;
				} else if (article.__attributes[property] == _snapshot.__attributes[property]) {
					delete changeSet[property];
				}
			}
			if (!isDirty) return null;
			return changeSet;
		};

		this.getChangedAttributes = _getChangedAttributes;

		// accessor function for the article's aggregates
		this.aggregate = function() {
			var aggregates = {};
			for (var key in article) {
				if (!article.hasOwnProperty(key)) return;
				if (key[0] == '$') {
					aggregates[key.substring(1)] = article[key];
				}
			}
			if (arguments.length === 0) return aggregates;
			else if (arguments.length == 1) return aggregates[arguments[0]];
			else throw new Error('.aggregates() called with an incorrect number of arguments. 0, and 1 are supported.');
		};

		var _removeTags = []; 
		if (!article.__tags) article.__tags = [];
		if (!_snapshot.__tags) _snapshot.__tags = [];

		this.tags = function()  {
			if (!article.__tags) return [];
			return article.__tags;
		};

		this.addTag = function(tag) {
			if (!tag || typeof tag != 'string' || !tag.length) return this;
		    
		    if (!article.__tags) article.__tags = [];

		    article.__tags.push(tag);
		    article.__tags = Array.distinct(article.__tags);

		    if (!_removeTags || !_removeTags.length) return this;;
			var index = _removeTags.indexOf(tag);
			if (index != -1) _removeTags.splice(index, 1);
			return this;
		};

		this.removeTag = function(tag) {
			if (!tag || typeof tag != 'string' || !tag.length) return this;
			//tag = tag.toLowerCase();
			_removeTags.push(tag);
			_removeTags = Array.distinct(_removeTags);

			if (!article.__tags || !article.__tags.length) return this;
			var index = article.__tags.indexOf(tag);
			if (index != -1) article.__tags.splice(index, 1);
			return this;
		};

		var _getChangedTags = function() {
			if (!article.__tags) return [];
			if (!_snapshot.__tags) return article.__tags;

			var _tags = [];
			article.__tags.every(function(a) {
				if (_snapshot.__tags.indexOf(a) == -1)
					_tags.push(a);
			});
			return _tags;
		};

		this.getChangedTags = _getChangedTags;

		this.getRemovedTags = function() { return _removetags; };

		var _getChanged = function(isInternal) {
			var isDirty = false;
			var changeSet = JSON.parse(JSON.stringify(_snapshot));
			for (var property in article) {
				if (typeof article[property] == 'undefined' || article[property] === null) {
					changeSet[property] = null;
					isDirty = true;
				} else if (article[property] != _snapshot[property]) {
					if (property == '__tags' || property == '__attributes') {
						delete changeSet[property];
					} else {
						changeSet[property] = article[property];
						isDirty = true;
					}
				} else if (article[property] == _snapshot[property]) {
					delete changeSet[property];
				}
			}

			try {
				_ignoreTheseFields.forEach(function(c) {
					if (changeSet[c]) delete changeSet[c];
				});
			} catch(e) {}

			if (isInternal) {
				if (article.__tags && article.__tags.length > 0) { 
					changeSet["__addtags"] = _getChangedTags(); 
					isDirty = true;
				}
				if (_removeTags && _removeTags.length > 0) {
				    changeSet["__removetags"] = _removeTags;
				    isDirty = true;
				}
			} else {
				if (article.__tags && article.__tags.length > 0) { 
					changeSet["__tags"] = _getChangedTags();
					isDirty = true;
			  	}
			}

			var attrs = _getChangedAttributes();
			if (attrs) { 
				changeSet["__attributes"] = attrs;
				isDirty = true;
			}
			else delete changeSet["__attributes"];

			for (var p in changeSet) {
				if (p[0] == '$') delete changeSet[p];
			}

			if (isDirty && !Object.isEmpty(changeSet)) return changeSet;
			return false;
		};

		this.changed = function() {
			return _getChanged();
		};

		this.hasChanged = function() {
			var changeSet = _getChanged(true);
			if (arguments.length === 0) {
				return Object.isEmpty(changeSet) ? false : true;
			} else if (arguments.length == 1 && typeof arguments[0] == 'string' && arguments[0].length > 0) {
				if (changeSet && changeSet[arguments[0]]) {
					return true;
				} return false;
			}
			return false;
		};

		this.changedAttributes  = function() {
			var changeSet = _getChanged(true);
			
			if (arguments.length === 0) {
				return changeSet;
			} else if (arguments.length == 1 && typeof arguments[0] == 'object' && arguments[0].length) {
				var attrs = {};
				arguments[0].forEach(function(c) {
					if (changeSet[c]) attrs.push(changeSet[c]);
				});
				return attrs;
			}
			return false;
		};

		this.previous = function() {
			if (arguments.length == 1 && typeof arguments[0] == 'string' && arguments[0].length) {
				return _snapshot[arguments[0]];	
			}
			return null
		};

		this.previousAttributes = function() { return _snapshot; };

		var _fields = '';

		this.fields = function() {
			if (arguments.length == 1) {
				var value = arguments[0];
				if (typeof value == 'string') _fields = value;
				else if (typeof value == 'object' && value.length) _fields = value.join(',');
				return this;
			} else {
				return _fields;
			}
		};

		var _types = {
			"integer": function(value) { 
				if (value) {
					var res = parseInt(value);
					if (!isNaN(res)) return res;
				}
				return value;
			}, "decimal": function(value) { 
				if (value) {
					var res = parseFloat(value);
					if (!isNaN(res)) return res;
				}
				return value;
			}, "boolean": function(value) { 
				if (value != undefined && value != null && (value.toString().toLowerCase() == 'true' || value == true || value > 0)) return true;
				return false;
			}, "date": function(value) { 
				if (value) {
					var res = global.Appacitive.Date.parseISODate(value);
					if (res) return res;
				}
				return value;
			}, "datetime": function(value) { 
				if (value) {
					var res = global.Appacitive.Date.parseISODate(value);
					if (res) return res;
				}
				return value;
			}, "time": function(value) { 
				if (value) {
					var res = global.Appacitive.Date.parseISOTime(value);
					if (res) return res;
				}
				return value;
			}, "string": function(value) { 
				if (value) return value.toSting();
				return value;
			}
		};

		this.get = function(key, type) { 
			var val = "";
			if (key) { 
				if (type && _types[type.toLowerCase()]) {
					var res = _types[type.toLowerCase()](article[key]);
					return res;
				} 
				return article[key]; 
			}
		};

		this.tryGet = function(key, value, type) {
			var res = this.get(key, type);
			if (res != undefined) return res;
			return value;
		};

		this.set = function(key, value) {

			if(!key || typeof key != 'string' ||  key.length == 0 || key.trim().indexOf('$') == 0) return this; 
		 	
		 	if (value == null || value == 'undefined') { article[key] = null;}
		 	else if (typeof value == 'string') { article[key] = value; }
		 	else if (typeof value == 'number' || typeof value == 'boolean') { article[key] = value + ''; }
		 	else if (typeof value == 'object') {
		 		if (value instanceof Date) {
		 			article[key] = global.Appacitive.Date.toISOString(value);
		 		} else {
			 		if (value.length >= 0) article[key] = value; 
			 		else if (_allowObjectSetOperations.indexOf(key) !== -1) article[key] = value;
			 	}
			}
		 	
		 	return this;
		};

		this.unset = function(key) {
			if (!key || typeof key != 'string' ||  key.length == 0 || key.indexOf('__') == 0) return this; 
		 	try { delete article[key]; } catch(e) {}
			return this;
		};

		this.has = function(key) {
			if (!key || typeof key != 'string' ||  key.length == 0) return false; 
			if (article[key] && typeof article[key] != 'undefined') return true;
			return false;
		};

		this.isNew = function() {
			if (article.__id && article.__id.length) return false;
			return true;
		};

		this.clone = function() {
			if (this.type == 'article') return new global.Appacitive.Article(this.toJSON());
			return new global.Appacitive.connection(article);
		};

		this.copy = function(properties, setSnapShot) { 
			if (properties) { 
				_copy(properties, article);
				if (setSnapShot) {
					_copy(properties,_snapshot);
				}
			}
			return this;
		};

		var _atomicProps = [];

		var _atomic = function(key, amount, multiplier) {
			if (!key || typeof key != 'string' ||  key.length == 0 || key.indexOf('__') == 0) return this;

			if (!amount || isNaN(parseInt(amount))) amount = multiplier;
			else amount = parseInt(amount) * multiplier;

			_atomicProps.push({ key: key.toLowerCase(), amount: amount });
			return that;
		};

		this.increment = function(key, amount) {
			return _atomic(key, amount, 1);
		};

		this.decrement = function(key, amount) {
			return _atomic(key, amount, -1);
		};

		/* crud operations  */

		/* save
		   if the object has an id, then it has been created -> update
		   else create */
		this.save = function() {
			if (article.__id) _update.apply(this, arguments);
			else _create.apply(this, arguments);
			return this;
		};

		// to create the article
		var _create = function(onSuccess, onError, fields) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};

			if (typeof fields == 'string') _fields = value;
			else if (typeof fields == 'object' && fields.length) fields = fields.join(',');
			else fields = _fields;

			// save this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getCreateUrl(article.__schematype || article.__relationtype, fields);

			// for User and Device articles
			if (article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) 
				url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getCreateUrl();

			for (var p in article) {
				if (p[0] == '$') delete article[p];
			}

			var _saveRequest = new global.Appacitive.HttpRequest();
			_saveRequest.url = url;
			_saveRequest.method = 'put';
			if (article["__revision"]) delete article["__revision"];
			_saveRequest.data = article;
			_saveRequest.onSuccess = function(data) {
				var savedState = null;
				if (data && (data.article || data.connection || data.user || data.device)) {
					savedState = data.article || data.connection || data.user || data.device;
				}
				if (data && savedState) {
					_snapshot = savedState;
					article.__id = savedState.__id;
					_copy(savedState, article);

					// if this is an article and there are collections 
					// of connected articles, set the article Id in them
					if (that.connectionCollections && that.connectionCollections.length > 0) {
						that.connectionCollections.forEach(function (collection) {
							collection.getQuery().extendOptions({ articleId: article.__id });
						});
					}

					if (that.type == 'connection') that.parseConnection();
					global.Appacitive.eventManager.fire((that.schema || that.relation) + '.' + that.type + '.created', that, { object : that });
					if (typeof onSuccess == 'function') onSuccess(that);
				} else {
					data = data || {};
					data.status =  data.status || {};
					data.status = _getOutpuStatus(data.status);
					global.Appacitive.eventManager.fire((that.schema || that.relation) + '.' + that.type + '.createFailed', that, { error: data.status });
					if (typeof onError == 'function') onError(data.status, that);
				}
			};
			_saveRequest.onError = function(err) {
				err = _getOutpuStatus(err);
				if (typeof onError == 'function') onError(err, that);
			}
			global.Appacitive.http.send(_saveRequest);
			return this;
		};

		// to update the article
		var _update = function(onSuccess, onError, fields) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var cb = function(revision) {
				var changeSet = _getChanged(true);
				for (var p in changeSet) {
					if (p[0] == '$') delete changeSet[p];
				}

				if (!Object.isEmpty(changeSet)) {

					if (typeof fields == 'string') _fields = value;
					else if (typeof fields == 'object' && fields.length) fields = fields.join(',');
					else fields = _fields;

					var _updateRequest = new global.Appacitive.HttpRequest();
					var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[that.type].getUpdateUrl(article.__schematype || article.__relationtype, (_snapshot.__id) ? _snapshot.__id : article.__id, fields, revision);
					
					var type = that.type;

					// for User and Device articles
					if (article && article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) { 
						type = article.__schematype.toLowerCase();
						url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getUpdateUrl(_snapshot.__id, fields, revision);
					}
					_updateRequest.url = url;
					_updateRequest.method = 'post';
					_updateRequest.data = changeSet;
					_updateRequest.onSuccess = function(data) {
						if (data && data[type]) {
							_atomicProps.length = 0;
							_snapshot = data[that.type];
							_copy(_snapshot, article);
							_removeTags = [];
							global.Appacitive.eventManager.fire((that.schema || that.relation)  + '.' + type + "." + article.__id +  '.updated', that, { object : that });
							if (typeof onSuccess == 'function') onSuccess(that);
						} else {
							data = data || {};
							data.status =  data.status || {};
							data.status = _getOutpuStatus(data.status);
							if (data.status.code == '14008' && _atomicProps.length > 0) {
								_update(onSuccess, onError, fields);
							}  else {
								global.Appacitive.eventManager.fire((that.schema || that.relation)  + '.' + type + "." + article.__id +  '.updateFailed', that, { object : data.status });
								if (typeof onError == 'function') onError(data.status, that);
							}
						}
					};
					_updateRequest.onError = function(err) {
						err = err || {};
						err.message = err.message || 'Server error';
						err.code = err.code || '500';
						if (err.code == '14008' && _atomicProps.length > 0) {
							_update(onSuccess, onError, fields);
						} else {
							if (typeof onError == 'function') onError(err, that);
						}
					}
					global.Appacitive.http.send(_updateRequest);
				} else {
					if (typeof onSuccess == 'function') onSuccess(that);
				}
			}

			if (_atomicProps.length > 0) {
				var props = ['__revision'];
				_atomicProps.forEach(function(p) { 
					props.push(p.key); 
				});

				_fetch(function(obj) {
					var tmp = {};

					_atomicProps.forEach(function(p) {
						var value = _types['integer'](obj[p.key]);
						if (!value) value = 0
						that.set(p.key, value + p.amount);
					});

					cb(obj.__revision);
				}, onError, props, true);
			} else cb();

			return this;
		};

		var _fetch = function (onSuccess, onError, fields, isVersion) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			if (!article.__id) {
				if (typeof onError == 'function') onError( {code:'400', message: 'Please specify id for get operation'}, that);
				return;
			}

			if (typeof fields == 'string') _fields = value;
			else if (typeof fields == 'object' && fields.length) fields = fields.join(',');
			else fields = _fields;

			// get this article by id
			var url = global.Appacitive.config.apiBaseUrl  + global.Appacitive.storage.urlFactory[that.type].getGetUrl(article.__schematype || article.__relationtype, article.__id, fields);
			var _getRequest = new global.Appacitive.HttpRequest();
			_getRequest.url = url;
			_getRequest.method = 'get';
			_getRequest.onSuccess = function(data) {
				if (data && data[that.type]) {
					if (!isVersion) {
						_snapshot = data[that.type];
						_copy(_snapshot, article);
						if (data.connection) {
							if (!that.endpoints && (!that.endpointA || !that.endpointB)) {
								that.setupConnection(article.__endpointa, article.__endpointb);
							}
						}
						if (that.___collection && ( that.___collection.collectionType == 'article')) that.___collection.addToCollection(that);
						if (typeof onSuccess == 'function') onSuccess(that);
					} else {
						if (typeof onSuccess == 'function') onSuccess(data[that.type]);
					}
				} else {
					data = data || {};
					data.status =  data.status || {};
					data.status = _getOutpuStatus(data);
					if (typeof onError == 'function') onError(data.status, that);
				}
			};
			_getRequest.onError = function(err) {
				err = _getOutpuStatus(err);
				if (typeof onError == 'function') onError(err, that);
			}
			global.Appacitive.http.send(_getRequest);
			return that;
		};

		// fetch ( by id )
		this.fetch = function(onSuccess, onError, fields) {
			_fetch(onSuccess, onError, fields);
		};

		// delete the article
		this.del = function(onSuccess, onError, deleteConnections) {

			// if the article does not have __id set, 
			// just remove it from the collection
			// else delete the article and remove from collection

			if (!article['__id']) {
				if (this.___collection) this.___collection.removeByCId(__cid);
				if (typeof onSuccess == 'function') onSuccess(this);
				return;
			}

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			// delete this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl;
			url += global.Appacitive.storage.urlFactory[this.type].getDeleteUrl(article.__schematype || article.__relationtype, article.__id);

			// for User and Device articles
			if (article && article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) {
				url = global.Appacitive.config.apiBaseUrl;
				url += global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getDeleteUrl(article.__id);
			}

			// if deleteConnections is specified
			if (deleteConnections && deleteConnections === true) {
				if (url.indexOf('?') == -1) url += '?deleteconnections=true';
				else url += '&deleteconnections=true';
			}

			var _deleteRequest = new global.Appacitive.HttpRequest();
			_deleteRequest.url = url;
			_deleteRequest.method = 'delete';
			_deleteRequest.onSuccess = function(data) {
				if (data.code == '200') {
					if (that.___collection)
						that.___collection.removeById(article.__id);
					if (typeof onSuccess == 'function') onSuccess(data);
				} else {
					data = _getOutpuStatus(data);
					if (typeof onError == 'function') onError(data, that);
				}
			};
			_deleteRequest.onError = function(err) {
				err = _getOutpuStatus(err);
				if (typeof onError == 'function') onError(err, that);
			}
			global.Appacitive.http.send(_deleteRequest);
		};
	};

	global.Appacitive.BaseObject = _BaseObject;

	global.Appacitive.BaseObject.prototype.toString = function() {
		return JSON.stringify(this.getObject());
	};

})(global);