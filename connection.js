(function (global) {

	"use strict";

	var parseEndpoint = function(endpoint) {
		var result = {
			label: endpoint.label
		};

		if (endpoint.articleid) {
			// provided an article id
			result.articleid = endpoint.articleid;
		} else if (endpoint.article && typeof endpoint.article.getArticle == 'function'){
			// provided an instance of Appacitive.ArticleCollection
			// stick the whole article if there is no __id
			// else just stick the __id
			if (endpoint.article.get('__id')) {
				result.articleid = endpoint.article.get('__id');
			} else {
				result.article = endpoint.article.getArticle();
			}
		} else if (typeof endpoint.article == 'object' && endpoint.article.__schematype) {
			// provided a raw article
			// if there is an __id, just add that
			// else add the entire article
			if (endpoint.article.__id) {
				result.articleid = endpoint.article.__id;
			} else {
				result.article = endpoint.article;
			}
		} else {
			throw new Error('Incorrectly configured endpoints provided to setupConnection');
		}

		return result;
	};

	global.Appacitive.Connection = function(options) {
		var base = new global.Appacitive.BaseObject(options);
		base.type = 'connection';
		base.getConnection = base.getArticle;

		base.__defineGetter__('connectedArticle', function() {
			if (!base.___collection.connectedArticle) {
				throw new Error('connectedArticle can be accessed only by using the getConnectedArticles call');
			}
			var articleId = base.___collection.connectedArticle.get('__id');
			if (!articleId) return null;
			var otherArticleId = base.getConnection().__endpointa.articleid;
			if (base.getConnection().__endpointa.articleid == articleId)
				otherArticleId = base.getConnection().__endpointb.articleid;
			return base.___collection.getConnectedArticle(otherArticleId);
		});

		// helper method for setting up the connection
		base.setupConnection = function(endpointA, endpointB) {
			// validate the endpoints
			if ((!endpointA || !endpointA.id || endpointA.label) || (!endpointB || !endpointB.id || endpointB.label)) {
				throw new Error('Incorrect endpoints configuration passed.');
			}

			// there are two ways to do this
			// either we are provided the article id
			// or a raw article
			// or an Appacitive.Article instance
			// sigh

			// 1
			base.set('__endpointa', parseEndpoint(endpointA));

			// 2
			base.set('__endpointb', parseEndpoint(endpointB));
		};

		return base;
	};

})(global);