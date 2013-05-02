module('Connection Collection via Article::getConnectedArticles');

test('Connection Collection returned on calling getConnectedArticles', function() {
	var a = new Appacitive.Article(), c = new Appacitive.Connection(), options = { relation: 'some_relation '};
	var aC = a.getConnectedArticles(options), cC = c.getConnectedArticles(options);
	equal(aC.collectionType, 'connection', 'Connection collection returned on calling getConnectedArticles on an article');
	equal(cC, null, 'Nothing returned on calling getConnectedArticles on a connection');
});

test('Verify connection collection search query url', function() {
	var id = 1, relation = 'r';
	var article = new Appacitive.Article({ __id: id });
	var requestUrl = article.getConnectedArticles({ relation: relation }).getQuery().toRequest().url;
	if (requestUrl.indexOf('?') != -1) {
		requestUrl = requestUrl.substr(requestUrl, requestUrl.indexOf('?'));
	}
	var url = Appacitive.config.apiBaseUrl + 'connection/' + relation + '/' + id + '/find';
	equal(requestUrl, url, 0, 'Connection collection returned proper url: ' + requestUrl);
});

test('Verify "fetch" method on connection collection', function() {
	var a = new Appacitive.Article(), options = { relation: 'some_relation '};
	var aC = a.getConnectedArticles(options);
	equal(typeof aC.fetch, 'function', 'Fetch exists on the connection collection.');
});

test('Verify error thrown on not passing the relation type', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'zzz1e35345' }), a = aC.createNewArticle();
	try {
		var cC = a.getConnectedArticles();
		ok(false, 'Error not thrown on not passing the relation type.');
	} catch(e) {
		ok(true, 'Error thrown on not passing the relation type: ' + JSON.stringify(e.message));
	}
});

test('Verify connectedArticle property set on getting connectionCollection', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'zzz1e35345' }), a = aC.createNewArticle();
	var cC = a.getConnectedArticles({ relation: 'something' });
	deepEqual(cC.connectedArticle, a, 'Connected article property setting properly on connection collection');
});



//  --------------------------- API tests -------------------------------------

module('Connection Collection API tests via Article::getConnectedArticles');

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

asyncTest('Verify error for fetching connections for unsaved article', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'profile' }), a = aC.createNewArticle();
	var cC = a.getConnectedArticles({ relation: 'userprofile' });
	cC.fetch(function() {
		ok(false, 'Nothing broke on calling fetch for connections');
		start();
	}, function() {
		ok(true, 'Error occured on calling fetch for connections');
		start();
	});
});

asyncTest('Verify happy flow for existing schema and relation and saved article', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'profile' }), a = aC.createNewArticle();
	var cC = a.getConnectedArticles({ relation: 'userprofile' });
	a.save(function() {
		cC.fetch(function() {
			ok(true, 'Nothing broke on calling fetch for connections');
			start();
		}, function() {
			ok(false, 'Error occured on calling fetch for connections');
			start();
		});
	});
});

asyncTest('Verify error for non-existant schema', function() {
	var aC = new Appacitive.ArticleCollection({ schema: '12345profile' }), a = aC.createNewArticle();
	var cC = a.getConnectedArticles({ relation: 'userprofile' });
	cC.fetch(function() {
		ok(false, 'Nothing broke on calling fetch for connections');
		start();
	}, function() {
		ok(true, 'Error occured on calling fetch for connections');
		start();
	});
});


asyncTest('Verify error for non-existant relation', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'profile' }), a = aC.createNewArticle();
	var cC = a.getConnectedArticles({ relation: '12345userprofile' });
	cC.fetch(function() {
		ok(false, 'Nothing broke on calling fetch for connections');
		start();
	}, function() {
		ok(true, 'Error occured on calling fetch for connections');
		start();
	});
});