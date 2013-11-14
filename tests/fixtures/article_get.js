module('Article Tests - Get');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Get non-existent article', function() {
	var article = new Appacitive.Article('profile');
	article.id('12345')
	article.fetch().then(function() {
		ok(false, 'onSuccess called on fetching non-existent article');
		start();
	}, function() {
		ok(true, 'onError called on fetching non-existent article');
		start();
	})
});

asyncTest('Save 2 articles and multiget them', function() {
	var article = new Appacitive.Article('profile');
	var profile = new Appacitive.Article('profile');

	var tasks = [];
	tasks.push(article.save());
	tasks.push(profile.save());

	var promise = Appacitive.Promise.when(tasks);

	promise.then(function() {
		var ids = [];
		ids.push(profile.get('__id'));
		ids.push(article.get('__id'));
		return Appacitive.Article.multiGet({ schema: 'profile', ids: ids });
	}).then(function(articles) {
		equal(articles.length, 2, 'Articles fetched successfully  using multiget');
		start();
	}, function() {
		if (article.isNew()) {
			ok(false, 'First Article could not be saved!');
		} else if (profile.isNew()) {
			ok(false, 'Second Article could not be saved!');
		} else {
			ok(false, 'Could not multiget articles of type profile');
		}
	});
})