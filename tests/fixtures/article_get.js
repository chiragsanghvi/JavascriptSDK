module('Article Tests - Get');

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

asyncTest('Get non-existent article', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle({ __id: 12345 });
	article.fetch(function() {
		ok(false, 'onSuccess called on fetching non-existent article');
		start();
	}, function() {
		ok(true, 'onError called on fetching non-existent article');
		start();
	})
});

asyncTest('Save article and get by id', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	var id = null;
	article.save(function() {
		var id = article.get('__id');
		var sameArticle = collection.createNewArticle();
		sameArticle.set('__id', id);
		sameArticle.fetch(function() {
			var articles = collection.getAll().filter(function(a) {
				return a.get('__id') == id;
			});
			switch (articles.length) {
				case 0:
					ok(false, 'Fetched article does not exist in the collection');
					break;
				case 1:
					ok(true, 'Fetched article exists in the collection');
					break;
				default:
					ok(false, 'Duplicate articles in the collection');
					break;
			}
			start();
		}, function() {
			ok(false, 'Could not fetch created article ( id: ' + id + ' )');
			start();
		});
	}, function() {
		ok(false, 'Article could not be saved!');
		start();
	})
})