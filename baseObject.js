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

		//will be used in case of 
		if (setSnapShot) {
			for (var property in article) {
				_snapshot[property] = article[property];
			}
		}
		if (!_snapshot.__id && raw.__id)
			_snapshot.__id = raw.__id;

		// crud operations
		// fetch ( by id )
		this.fetch = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			if (!article.__id) {
				onError();
				return;
			}
			// get this article by id
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl  + global.Appacitive.storage.urlFactory[this.type].getGetUrl(article.__schematype || article.__relationtype, article.__id);
			var getRequest = new global.Appacitive.HttpRequest();
			getRequest.url = url;
			getRequest.method = 'get';
			getRequest.onSuccess = function(data) {
				if (data && (data.article || data.connection || data.user || data.device)) {
					_snapshot = data.article || data.connection || data.user || data.device;
					var obj = data.article || data.connection || data.user || data.device;

					article.__id = obj.__id;
					for (var property in obj) {
						if (typeof article[property] == 'undefined') {
							article[property] = obj[property];
						}
					}
					if (that.___collection && ( that.___collection.collectionType == 'article'))
						that.___collection.addToCollection(that);
					onSuccess();
				} else {
					onError(data.status);
				}
			};
			global.Appacitive.http.send(getRequest);
		};

		// delete the article
		this.del = function(onSuccess, onError, options) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			options = options || {};

			// if the article does not have __id set, 
			// just remove it from the collection
			// else delete the article and remove from collection

			if (!article['__id'] && this.___collection) {
				this.___collection.removeByCId(this.__cid);
				onSuccess();
				return;
			}

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
					onSuccess();
				} else {
					onError(data);
				}
			};
			_deleteRequest.onError = function(err) {
				onError(err);
			}
			global.Appacitive.http.send(_deleteRequest);
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
			} else {
				throw new Error('.attributes() called with an incorrect number of arguments. 0, 1, 2 are supported.');
			}
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
			if (arguments.length === 0) {
				return aggregates;
			} else if (arguments.length == 1) {
				return aggregates[arguments[0]];
			} else {
				throw new Error('.aggregates() called with an incorrect number of arguments. 0, and 1 are supported.');
			}
		};

		this.get = function(key) {
			if (key) {
				return article[key];
			}
		};

		this.set = function(key, value) {
			if (key) {
				article[key] = value;
			}
			return value;
		};

		// save
		// if the object has an id, then it has been created -> update
		// else create
		this.save = function(onSuccess, onError) {
			if (article.__id)
				_update.apply(this, arguments);
			else
				_create.apply(this, arguments);
		};

		this.copy = function(properties) {
			for (var property in properties) {
				article[property] = properties[property];
			}
		};

		// to update the article
		var _update = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			var isDirty = false;
			var fieldList = [];
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
				if (changeSet["__revision"]) delete changeSet["__revision"];
			}

			if (isDirty) {
				var _updateRequest = new global.Appacitive.HttpRequest();
				var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getUpdateUrl(article.__schematype || article.__relationtype, (_snapshot.__id) ? _snapshot.__id : article.__id);
				
				// for User and Device articles
				if (article && article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) {
					url = global.Appacitive.config.apiBaseUrl;
					url += global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getUpdateUrl(_snapshot.__id);
				}

				_updateRequest.url = url;
				_updateRequest.method = 'post';
				_updateRequest.data = changeSet;
				_updateRequest.onSuccess = function(data) {
					if (data && (data.article || data.connection || data.user || data.device)) {
						_snapshot = data.article || data.connection || data.user || data.device;
						if (typeof onSuccess == 'function') {
							onSuccess();
						}
					} else {
						if (typeof onError == 'function') {
							onError(data.status);
						}
					}
				};
				_updateRequest.onError = function(err) {
					onError(err);
				}
				global.Appacitive.http.send(_updateRequest);
			} else {
				onSuccess();
			}
		};

		// to create the article
		var _create = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			// save this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getCreateUrl(article.__schematype || article.__relationtype);

			// for User and Device articles
			if (article.__schematype &&  ( article.__schematype.toLowerCase() == 'user' ||  article.__schematype.toLowerCase() == 'device')) {
				url = global.Appacitive.config.apiBaseUrl;
				url += global.Appacitive.storage.urlFactory[article.__schematype.toLowerCase()].getCreateUrl();
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
					for (var property in savedState) {
						if (typeof article[property] == 'undefined') {
							article[property] = savedState[property];
						}
					}

					// if this is an article and there are collections 
					// of connected articles, set the article Id in them
					if (that.connectionCollections && that.connectionCollections.length > 0) {
						that.connectionCollections.forEach(function (collection) {
							collection.getQuery().extendOptions({ articleId: article.__id });
						});
					}

					if (that.type == 'connection') {
						that.parseConnection();
					}

					if (typeof onSuccess == 'function') {
						onSuccess(that);
					}
				} else {
					if (typeof onError == 'function') {
						onError(data.status);
					}
				}
			};
			_saveRequest.onError = function(err) {
				onError(err);
			}
			global.Appacitive.http.send(_saveRequest);
		};

	};

	global.Appacitive.BaseObject = _BaseObject;

	global.Appacitive.BaseObject.prototype.toString = function() {
		return JSON.stringify(this.getObject());
	};

})(global);