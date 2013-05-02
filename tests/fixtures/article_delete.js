module('Article Tests - Delete');

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

asyncTest('Delete unsaved article', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	var random = Math.random();
	article.set('random', random);
	article.del(function() {
		var flag = false;
		collection.getAll().forEach(function(article) {
			if (article.get('random') && article.get('random') == random) {
				flag = true;
				ok(false, 'Delete succeeded but article still exists in the collection');
			}
		});
		if (flag == false) {
			ok(true, 'Article deleted and removed from collection successfully');
		}
		start();
	}, function() {
		ok(false, 'Deleting unsaved article failed');
		start();
	});
});


asyncTest('Delete saved article', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.save(function() {
		var _id = article.get('__id');
		article.del(function() {
			var flag = false;
			collection.getAll().forEach(function(article) {
				if (article.get('__id') && article.get('__id') == _id) {
					flag = true;
					ok(false, 'onSuccess called, but article still exists');
				}
			});
			if (flag == false) {
				ok(true, 'Article deleted and removed from collection successfully');
			}
			start();
		}, function() {
			ok(false, 'Deleting unsaved article failed');
			start();
		});
	});
});

asyncTest('Delete non-existent article', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var article = collection.createNewArticle();
	article.set('__id', 0070);
	article.del(function() {
		ok(false, 'onSuccess called after deleting unsaved article');
		start();
	}, function() {
		ok(true, 'Deleting unsaved article failed as expected');
		start();
	});
});
