module('Article Tests - Update');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

test('Update article and verify in model', function() {
	var article = new Appacitive.Article('profile');
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	equal(article.get('name'), name, 'Article property value changed in model successfully');
});

asyncTest('Updating article and save it', function() {
	var article = new Appacitive.Article('profile');
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	article.save().then(function() {
		ok(true, 'onSuccess called on article update');
		start();
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Update article, save and verify value and verify value', function() {
	var article = new Appacitive.Article('profile');
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', name);
	article.save().then(function() {
		var id = article.get('__id');
		equal(name, article.get('name'), 'Value of article in model matches after update');
		start();
	}, function() {
		ok(false, 'Could not save article, onError called');
		start();
	});
});

asyncTest('Update article and verify after fetching it again', function() {
	var article = new Appacitive.Article('profile');
	var prevName = 'Arathorn' + parseInt(Math.random() * 10000);
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	
	article.set('name', prevName);
	
	//Create article
	article.save().then(function() {
		equal(prevName, article.get('name'), 'Value of article in model match after create');
		
		//update article
		article.set('name', name);
		return article.save();
	}).then(function(fetchedArticle) {
		equal(name, fetchedArticle.get('name'), 'Value of article model match after update');
		//fetch article
		return Appacitive.Article.get({
			schema: 'profile',
			id: article.id()
		});
	}).then(function(fetchedArticle) {
		ok(true, 'Article with id (' + fetchedArticle.id() + ') saved and retrieved successfully.');
		equal(name, fetchedArticle.get('name'), 'Value of article in model match after fetch');
		start();
	}, function() {
		if (article.isNew()) {
			ok(false, 'Could not create article, onError called');
		} else if (article.created) {
			ok(false, 'Could not update article, onError called');
		} else {
			ok(false, 'Could not fetch article');
		}
		start();
	});
});

asyncTest('Fetch article using search and then update it and verify its value', function() {
	var article = new Appacitive.Article('profile');
	var prevName = 'Arathorn' + parseInt(Math.random() * 10000);
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	var fetched = false;
	article.set('name', prevName);
	
	//Create article
	article.save().then(function() {
		equal(prevName, article.get('name'), 'Value of article in model match after create');
		
		//search article
		return Appacitive.Article.findAll({
			schema: 'profile'
		}).fetch();
	}).then(function(fetchedArticles) {
		var fetchedArticles = fetchedArticles.filter(function (a) {
			return a.get('__id') == article.id();
		});
		if (!fetchedArticles || fetchedArticles.length == 0) {
			return new Appacitive.Promise().reject();
		} 
		var fetchedArticle = fetchedArticles[0];

		fetched = true;
		ok(true, 'Article with id (' + fetchedArticle.id() + ') saved and retrieved successfully.');
		
		//Update article
		fetchedArticle.set('name', name);
		return fetchedArticle.save();
	}).then(function(updatedArticle) {
		equal(name, updatedArticle.get('name'), 'Value of article in model match after update');
		start();
	}, function() {
		if (article.isNew()) {
			ok(false, 'Could not create article, onError called');
		} else if (!fetched) {
			ok(false, 'Could not fetch article, onError called');
		} else {
			ok(false, 'Could not update article, onError called');
		}
		start();
	});
});


asyncTest('Update article using new appacitive article object', function() {
	var article = new Appacitive.Article('profile');
	var prevName = 'Arathorn' + parseInt(Math.random() * 10000);
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	article.set('name', prevName);
	
	//Create article
	article.save().then(function() {
		equal(prevName, article.get('name'), 'Value of article in model match after create');
	
		//update article
		var updatedArticle = new Appacitive.Article(article.toJSON());
		updatedArticle.set('name', name);
		return updatedArticle.save();
	}).then(function(updatedArticle) {
		equal(name, updatedArticle.get('name'), 'Value of article in model match after update');
		start();
	}, function() {
		if (article.isNew()) {
			ok(false, 'Could not create article, onError called');
		} else {
			ok(false, 'Could not update article, onError called');
		}
		start();
	});
});