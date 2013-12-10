module('Article Tests - Create');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Save article', function() {
	var article = new Appacitive.Article('profile');
	article.save().then(function() {
		ok(true, 'Created article successfully, id: ' + JSON.stringify(article.getArticle()));
		start();
	}, function() {
		ok(false, 'Article create failed');
		start();
	});
});

asyncTest('Save article with properties', function() {
	var article = new Appacitive.Article('profile');
	var name = 'Aragorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	article.save().then(function() {
		equal(article.get('name'), name, 'Created article successfully ' + JSON.stringify(article.getArticle()));
		start();
	}, function() {
		ok(false, 'Article create failed');
		start();
	});
});

asyncTest('Save article and verify', function() {
	var article = new Appacitive.Article('profile');
	article.save().then(function() {
			var _id = article.get('__id');
			Appacitive.Article.get({
				schema: 'profile',
				id: _id
			}).then(function(createdArticle) {
				if (createdArticle && createdArticle instanceof Appacitive.Article) {
					ok(true, 'Article with id (' + _id + ') saved and retrieved successfully.');
				} else {
					ok(false, 'Article not found');
				}
				start();
			}, function() {
				ok(false, 'Could not fetch article with id .' + _id);
				start();
			});
	});
});