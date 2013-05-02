(function(global) {

	"use strict";

	//base object for articles and connections
	/**
	* @constructor
	**/
	var _BaseObject = function(raw) {

		var _snapshot = null;

		raw = raw || {};
		var article = raw;

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
				if (data && data.article) {
					_snapshot = data.article;
					article.__id = data.article.__id;
					for (var property in data.article) {
						if (typeof article[property] == 'undefined') {
							article[property] = data.article[property];
						}
					}
					if (that.___collection && that.___collection.collectionType == 'article')
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

			if (!article['__id']) {
				this.___collection.removeByCId(this.__cid);
				onSuccess();
				return;
			}

			// delete this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl;
			url += global.Appacitive.storage.urlFactory[this.type].getDeleteUrl(article.__schematype || article.__relationtype, article.__id);

			// for User articles
			if (article && article.__schematype && article.__schematype.toLowerCase() == 'user') {
				url = global.Appacitive.config.apiBaseUrl;
				url += global.Appacitive.storage.urlFactory.user.getUserDeleteUrl(article.__id);
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
			_deleteRequest.beforeSend = function(r) {
				console.log('DELETE: ' + r.url);
			};
			global.Appacitive.http.send(_deleteRequest);
		};

		this.getArticle = function() { return article; };

		// accessor function for the article's attributes
		this.attributes = function() {
			if (arguments.length === 0) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes;
			} else if (arguments.length == 1) {
				if (!article.__attributes) article.__attributes = {};
				return article.__attributes[arguments[0]];
			} else if (arguments.length == 2) {
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

		// to update the article
		var _update = function(onSuccess, onError) {
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
			}

			if (isDirty) {
				var _updateRequest = new global.Appacitive.HttpRequest();
				_updateRequest.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getUpdateUrl(article.__schematype || article.__relationtype, _snapshot.__id);
				_updateRequest.method = 'post';
				_updateRequest.data = changeSet;
				_updateRequest.onSuccess = function(data) {
					if (data && (data.article || data.connection || data.user)) {
						_snapshot = data.article;
						if (typeof onSuccess == 'function') {
							onSuccess();
						}
					} else {
						if (typeof onError == 'function') {
							onError(data.status);
						}
					}
				};
				global.Appacitive.http.send(_updateRequest);
			}
		};

		// to create the article
		var _create = function(onSuccess, onError) {
			// save this article
			var that = this;
			var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory[this.type].getCreateUrl(article.__schematype || article.__relationtype);

			// user article
			if (article.__schematype && article.__schematype.toLowerCase() == 'user') {
				url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getCreateUserUrl();
			}

			var _saveRequest = new global.Appacitive.HttpRequest();
			_saveRequest.url = url;
			_saveRequest.method = 'put';
			_saveRequest.data = article;
			_saveRequest.onSuccess = function(data) {
				var savedState = null;
				if (data) {
					savedState = data.article || data.connection || data.user;
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


					if (typeof onSuccess == 'function') {
						onSuccess();
					}
				} else {
					if (typeof onError == 'function') {
						onError(data.status);
					}
				}
			};
			global.Appacitive.http.send(_saveRequest);
		};

	};

	global.Appacitive.BaseObject = _BaseObject;

})(global);