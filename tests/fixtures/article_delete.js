module('Article Tests - Delete');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Delete unsaved article', function() {
	var article = new Appacitive.Article('profile');
	var random = Math.random();
	article.set('random', random);
	article.destroy().then(function() {
		ok(true, 'Article deleted successfully');
		start();
	}, function() {
		ok(false, 'Deleting unsaved article failed');
		start();
	});
});


asyncTest('Delete saved article', function() {
	var article = new Appacitive.Article('profile');
	var created = false;
	article.save().then(function() {
		return article.destroy();
	}).then(function() {
		ok(true, 'Article deleted successfully');
		start();
	}, function() {
		if (article.created) {
			ok(false, 'Deleting saved article with id ' + article.id() + ' failed');
			start();
		} else {
			ok(false, 'Article create failed');
			start();
		}
	});
});

asyncTest('Delete non-existent article', function() {
	var article = new Appacitive.Article('profile');
	article.set('__id', 0070);
	article.destroy().then(function() {
		ok(false, 'onSuccess called after deleting unsaved article');
		start();
	}, function() {
		ok(true, 'Deleting unsaved article failed as expected');
		start();
	});
});
