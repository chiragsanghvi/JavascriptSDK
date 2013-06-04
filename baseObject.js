(function(global) {

	"use strict";

	//base object for articles and connections
	/**
	* @constructor
	**/
	var _BaseObject = function(raw, setSnapShot) {

		var _snapshot = {};

		raw = raw || {};
		var article = raw;

		//will be used in case of creating an appacitive article for internal purpose
		if (setSnapShot) {
			for (var property in article) {
				if (typeof article[property] == 'string' || typeof article[property] == 'number') {
					_snapshot[property] = article[property];
				} else if (typeof article[property] == 'object')  {
					if (article[property].length >= 0) _snapshot[property] = [];
					else _snapshot[property] = {};
					for (var p in article[property]) {
						_snapshot[property][p] = article[property][p];
					}
				} else {
					_snapshot[property] = obj[property];
				}
			}
		}

		if (!_snapshot.__id && raw.__id) _snapshot.__id = raw.__id;

		//Check whether __schematype or __relationtype is mentioned and set type property
		if (raw.__schematype) { 
			raw.__schematype = raw.__schematype.toLowerCase();
			this.entityType = raw.__schematype;
			//if __schematype is user/device then set specific
			if (raw.__schematype == 'user' || raw.__schematype == 'device') this.type = raw.__schematype;
			else this.type = 'article';
		} else if (raw.__relationtype) {
			raw.__relationtype = raw.__relationtype.toLowerCase();
			this.entityType = raw.__relationtype;
			this.type = 'connection';
		}

		//Fileds to be ignored while update operation
		var _ignoreTheseFields = ["__revision","__endpointa","__endpointb","__createdby","__lastmodifiedby","__schematype","__relationtype","__utcdatecreated","__utclastupdateddate","__tags","__authType","__link"];
		
		var _allowObjectSetOpeerations = ["__link"];

		/* parse api output to get error info
		   TODO: define error objects in future depending on codes and messages */
		var _getOutpuStatus = function(data) {
			data = data || {};
			data.message = data.message || 'Server error';
			data.code = data.code || '500';
			return data;
		};

		//Copy properties to current object
		var _copy = function(obj) {
			for (var property in obj) {
				if (typeof obj[property] == 'string') {
					article[property] = obj[property];
				} else if (typeof obj[property] == 'object')  {
					if (obj[property].length >=0 ) article[property] = [];
					else article[property] = {};
					for (var p in obj[property]) {
						article[property][p] = obj[property][p];
					}
				} else {
					article[property] = obj[property];
				}
			}
		};	

		this.getObject = function() { return article; };

		this.toJSON = function() { return article; };

		// accessor function for the article's attributes
		this.attributes = function() {
			if (arguments.length === 0) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes;
			} else if (arguments.length == 1) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes[arguments[0]];
			} else if (arguments.length == 2) {
				if(typeof(arguments[1]) !== 'string')
					throw new Error('only string values can be stored in attributes.');
				if (!article.__attributes) article.__attributes = {};
				article.__attributes[arguments[0]] = arguments[1];
			} else throw new Error('.attributes() called with an incorrect number of arguments. 0, 1, 2 are supported.');
		};

		// accessor function for the article's aggregates
		this.aggregates = function() {
			var aggregates = {};
			for (var key in article) {
				if (!article.hasOwnProperty(key)) return;
				if (key[0] == '$') {
					aggregates[key] = article[key];
				}
			}
			if (arguments.length === 0) return aggregates;
			else if (arguments.length == 1) return aggregates[arguments[0]];
			else throw new Error('.aggregates() called with an incorrect number of arguments. 0, and 1 are supported.');
		};

		var _removeTags = []; 
		if (!article.__tags) article.__tags = [];

		this.__defineGetter__('tags', function() {
			if (!article.__tags) return [];
			return article.__tags;
		});

		this.addTags = function(tag) {
			if (!tag || typeof tag != 'string' || !tag.length) return this;
		    //tag = tag.toLowerCase();
		    article.__tags.push(tag);
		    article.__tags = Array.distinct(article.__tags);

		    if (!_removeTags || !_removeTags.length) return this;;
			var index = _removeTags.indexOf(tag);
			if (index != -1) _removeTags.splice(index, 1);
			return this;
		};

		this.removeTags = function(tag) {
			if (!tag || typeof tag != 'string' || !tag.length) return this;
			//tag = tag.toLowerCase();
			_removeTags.push(tag);
			_removeTags = Array.distinct(_removeTags);

			if (!article.__tags || !article.__tags.length) return this;
			var index = article.__tags.indexOf(tag);
			if (index != -1) article.__tags.splice(index, 1);
			return this;
		};

		this.get = function(key) { if (key) return article[key]; };

		this.set = function(key, value) {

			if(!key || typeof key != 'string' ||  key.length == 0) return this; 
		 	
		 	if (value == null || value == 'undefined') { article[key] = null;}
		 	else if (typeof value == 'string') { article[key] = value; }
		 	else if (typeof value == 'number') { article[key] = value + ''; }
		 	else if (typeof value == 'object') {
		 		if (value.length >= 0) article[key] = value; 
		 		else if (_allowObjectSetOpeerations.indexOf(key) !== -1) article[key] = value;
			}
		 	
		 	return this;
		};

		this.copy = function(properties) { 
			if(properties) _copy(properties); 
			return this;
		};

		/* crud operations  */

		/* save
		   if the object has an id, then it has been created -> update
		   else create */
		this.save = function(onSuccess, onError) {
			if (article.__id) _update.apply(this, arguments);
			else _create.apply(this, arguments);
			return this;
		};

		// to create the article
		var _create = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};

			// save this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getCreateUrl(article.__schematype || article.__relationtype);

			// for User and Device articles
			if (article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) 
				url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getCreateUrl();

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
					_copy(savedState);

					// if this is an article and there are collections 
					// of connected articles, set the article Id in them
					if (that.connectionCollections && that.connectionCollections.length > 0) {
						that.connectionCollections.forEach(function (collection) {
							collection.getQuery().extendOptions({ articleId: article.__id });
						});
					}

					if (that.type == 'connection') that.parseConnection();

					Appacitive.eventManager.fire((that.__schematype || that.__relationtype) + '.' + that.type + '.created', 'base', { object : that });
					if (typeof onSuccess == 'function') onSuccess(that);
				} else {
					data = data || {};
					data.status =  data.status || {};
					data.status = _getOutpuStatus(data.status);
					Appacitive.eventManager.fire((that.__schematype || that.__relationtype) + '.' + that.type + '.createFailed', 'base', { error: data.status });
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
		var _update = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var isDirty = false;
			var changeSet = JSON.parse(JSON.stringify(_snapshot));
			for (var property in article) {
				if (typeof article[property] == 'undefined' || article[property] === null) {
					changeSet[property] = null;
					isDirty = true;
				} else if (article[property] != _snapshot[property]) {
					changeSet[property] = article[property];
					isDirty = true;
				} else if (article[property] == _snapshot[property]) {
					delete changeSet[property];
				}
			}

			try {
				_ignoreTheseFields.forEach(function(c) {
					if (changeSet[c]) delete changeSet[c];
				});
			} catch(e) {}

			if (article.__tags && article.__tags.length > 0)
				changeSet["__addtags"] = article.__tags;

			if (_removeTags && _removeTags.length > 0)
				changeSet["__removetags"] = _removeTags;

			var that = this;
			if (isDirty) {
				var _updateRequest = new global.Appacitive.HttpRequest();
				var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getUpdateUrl(article.__schematype || article.__relationtype, (_snapshot.__id) ? _snapshot.__id : article.__id);
				
				// for User and Device articles
				if (article && article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) 
					url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getUpdateUrl(_snapshot.__id);
				
				_updateRequest.url = url;
				_updateRequest.method = 'post';
				_updateRequest.data = changeSet;
				_updateRequest.onSuccess = function(data) {
					if (data && (data.article || data.connection || data.user || data.device)) {
						_snapshot = data.article || data.connection || data.user || data.device;
						_copy(_snapshot);
						Appacitive.eventManager.fire(that.type + '.' + article.__id + '.updated', 'base', { object: that });
						if (typeof onSuccess == 'function') onSuccess(that);
					} else {
						data = data || {};
						data.status =  data.status || {};
						data.status = _getOutpuStatus(data.status);
						Appacitive.eventManager.fire(that.type + '.' + article.__id + '.updateFailed', 'base', { object: data.status });
						if (typeof onError == 'function') onError(data.status, that);
					}
				};
				_updateRequest.onError = function(err) {
					err = err || {};
					err.message = err.message || 'Server error';
					err.code = err.code || '500';
					if (typeof onError == 'function') onError(err, that);
				}
				global.Appacitive.http.send(_updateRequest);
			} else {
				if (typeof onSuccess == 'function') onSuccess(that);
			}
			return this;
		};

		// fetch ( by id )
		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function() {};
			onError = onError || function() {};
			if (!article.__id) {
				if (typeof onError == 'function') onError( {code:'400', message: 'Please specify id for get operation'} ,this);
				return;
			}
			// get this article by id
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl  + global.Appacitive.storage.urlFactory[this.type].getGetUrl(article.__schematype || article.__relationtype, article.__id);
			var _getRequest = new global.Appacitive.HttpRequest();
			_getRequest.url = url;
			_getRequest.method = 'get';
			_getRequest.onSuccess = function(data) {
				if (data && (data.article || data.connection || data.user || data.device)) {
					_snapshot = data.article || data.connection || data.user || data.device;
					_copy(_snapshot);
					if (that.___collection && ( that.___collection.collectionType == 'article')) that.___collection.addToCollection(that);
					if (typeof onSuccess == 'function') onSuccess(that);
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
			return this;
		};

		// delete the article
		this.del = function(onSuccess, onError, options) {

			// if the article does not have __id set, 
			// just remove it from the collection
			// else delete the article and remove from collection

			if (!article['__id'] && this.___collection) {
				this.___collection.removeByCId(this.__cid);
				if (typeof onSuccess == 'function') onSuccess(this);
				return;
			}

			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			options = options || {};

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
			if (options.deleteConnections && options.deleteConnections === true) {
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