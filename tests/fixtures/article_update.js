module('Article Tests - Update');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

test('Update article and verify in model', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	equal(article.get('name'), name, 'Article property value changed in model successfully');
});

asyncTest('Updating article without verification', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	article.save(function() {
		ok(true, 'onSuccess called on article update');
		start();
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Update article and verify in collection', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	article.save(function() {
		var id = article.get('__id');
		var articles = collection.getAll();
		var valueInCollection = articles.filter(function (a) {
			return a.get('__id') == id;
		})[0].get('name');
		equal(name, valueInCollection, 'Value of article in collection and model match after update');
		start();
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Update article and verify in collection after fetching collection again', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
		var name = 'Arathorn' + parseInt(Math.random() * 10000);
		article.set('name', name);
		article.save(function() {
			var id = article.get('__id');
			setTimeout(function() {
				collection.fetch(function() {
					var articles = collection.getAll();
					var valueInCollection
					var articleInCollection = articles.filter(function (a) {
						return a.get('__id') == id;
					});
					if (articleInCollection.length == 0) {
						ok(false, 'Saved article not returned in search call');
						start();
					} else {
						var valueInCollection = articleInCollection[0].get('name');
						equal(name, valueInCollection, 'Value of article in collection and model match after update');
						start();
					}
				}, function() {
					ok(false, 'Could not fetch collection again.');
					start();
				});
			}, 1000);
		}, function() {
			ok(false, 'Could not save article, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Fetch article using search and then update it and verify its value', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
		var id = article.get('__id');
		setTimeout( function() {
			collection.fetch(function() {
				var articles = collection.getAll();
				var valueInCollection
				var articleInCollection = articles.filter(function (a) {
					return a.get('__id') == id;
				});
				if (articleInCollection.length == 0) {
					ok(false, 'Saved article not returned in search call');
					start();
				} else {
					var valueInCollection = articleInCollection[0].get('name');
					equal(name, valueInCollection, 'Value of article in collection and model match after update');
					var name = 'Arathorn' + parseInt(Math.random() * 10000);
					articleInCollection[0].set('name', name);
					articleInCollection[0].save(function() {
						var valueInCollection = articleInCollection[0].get('name');
						equal(name, valueInCollection, 'Value of article in collection and model match after update');
						start();
					}, function() {
						ok(false, 'Could not save article, onError called');
						start();
					});
				}
			}, function() {
				ok(false, 'Could not fetch collection again.');
				start();
			});
		},100);
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Create and Update article and verify by fetching article by id', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
		var name = 'Arathorn' + parseInt(Math.random() * 10000);
		article.set('name', name);
		article.save(function() {
			var id = article.get('__id');
			var sameArticle = collection.createNewArticle();
			sameArticle.set('__id', id);
			sameArticle.fetch(function() {
				var returnedName = sameArticle.get('name');
				equal(returnedName, name, 'Article updated successfully');
				start();
			}, function() {
				ok(false, 'Could not fetch article again');
				start();
			})
		}, function() {
			ok(false, 'Could not save article, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Update article using only appacitive article object not createnew object', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
		var name = 'Arathorn' + parseInt(Math.random() * 10000);

		var updatedArticle = new Appacitive.Article(article.getArticle());
		updatedArticle.set('name', name);
		updatedArticle.save(function() {
			var returnedName = updatedArticle.get('name');
			equal(returnedName, name, 'Article updated successfully');
			start();
		}, function() {
			ok(false, 'Could not save article, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});