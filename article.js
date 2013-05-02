(function (global) {

	"use strict";

	var _getFacebookProfile = function(onSuccess, onError) {
		var r = new global.Appacitive.HttpRequest();
		r.method = 'get';
		r.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(this.get('__id'));
		r.onSuccess = function(d) {
			var fbUsername = null;
			if (d && d.identities && d.identities.length > 0) {
				var fb = d.identities.filter(function(identity) {
					return identity.authtype.toLowerCase() == 'facebook';
				});
				if (fb.length == 1) {
					fbUsername = fb[0].username;
				}
			}
			if (fbUsername !== null) {
				FB.api('/' + fbUsername, function(response) {
					if (response) {
						onSuccess(response);
					} else {
						onError();
					}
				});
			} else {
				onError();
			}
		};
		r.onError = function() {
			onError();
		};
		global.Appacitive.http.send(r);
	};

	global.Appacitive.Article = function(options) {
		var base = new global.Appacitive.BaseObject(options);
		base.type = 'article';
		base.connectionCollections = [];

		if (base.get('__schematype') && base.get('__schematype').toLowerCase() == 'user') {
			base.getFacebookProfile = _getFacebookProfile;
		}

		return base;
	};

	global.Appacitive.BaseObject.prototype.getConnectedArticles = function(options) {
		if (this.type != 'article') return null;
		options = options || {};
		options.articleId = this.get('__id');

		var collection = new global.Appacitive.ConnectionCollection({ relation: options.relation });
		collection.connectedArticle = this;
		this.connectionCollections.push(collection);
		var connectedArticlesQuery = new global.Appacitive.queries.ConnectedArticlesQuery(options);
		collection.setQuery(connectedArticlesQuery);

		return collection;
	};

	global.Appacitive.BaseObject.prototype.getConnected = function(options) {
		if (this.type != 'article') return null;
		options = options || {};
		options.onSuccess = options.onSuccess || function(){};
		options.onError = options.onError || function(){};
		options.articleId = this.get('__id');

	};

})(global);