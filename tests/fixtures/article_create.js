module('Article Tests - Create');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.session.resetSession();
	var _sessionOptions = { "apikey": testConstants.apiKey, app: testConstants.appName };
	var subscriberId = Appacitive.eventManager.subscribe('session.success', function() {
		ok(true, 'Session created successfully.');
		start();
		Appacitive.eventManager.unsubscribe(subscriberId);
	})
	Appacitive.session.create(_sessionOptions);
});

asyncTest('Save article', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
			ok(true, 'Created article successfully, id: ' + JSON.stringify(article.getArticle()));
			start();
		});
});

asyncTest('Save article with properties', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	var name = 'Aragorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	article.save(function() {
		equal(article.get('name'), name, 'Created article successfully ' + JSON.stringify(article.getArticle()));
		start();
	}, function() {
		ok(false, 'Article save failed');
	});
});

asyncTest('Save article and verify', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
			var _id = article.get('__id');
			setTimeout(function() {
				collection.fetch(function() {
					var articles = collection.getAll();
					var createdArticle = articles.filter(function(article) {
						return article.get('__id') == _id;
					});
					if (createdArticle.length == 1) {
						ok(true, 'Article with id (' + _id + ') saved and retrieved successfully.');
					} else {
						debugger;
						ok(false, 'Article could not be saved');
					}
					start();
				}, function() {
					ok(false, 'Could not fetch articles.');
					start();
				});
			}, 1000);
	});
});