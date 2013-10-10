module('Connection Collection via Article::getConnectedArticles');

test('Connection Collection returned on calling getConnectedArticles', function() {
	var a = new Appacitive.Article({ __schematype: 'profile' , __id: '123'}), options = { relation: 'some_relation '};
	var aC = a.getConnectedArticles(options);
	equal(aC.collectionType, 'connection', 'Connection collection returned on calling getConnectedArticles on an article');
});

test('Verify connection collection search query url', function() {
	var id = 1, relation = 'r';
	var article = new Appacitive.Article({ __id: id, __schematype: 'profile'});
	var requestUrl = article.getConnectedArticles({ relation: relation }).query().toRequest().url;
	if (requestUrl.indexOf('?') != -1) {
		requestUrl = requestUrl.substr(requestUrl, requestUrl.indexOf('?'));
	}
	var url = Appacitive.config.apiBaseUrl + 'connection/' + relation + '/profile/' + id + '/find';
	equal(requestUrl, url, 0, 'Connection collection returned proper url: ' + requestUrl);
});

test('Verify "fetch" method on connection collection', function() {
	var a = new Appacitive.Article({ __schematype: 'profile', __id: '123' }), options = { relation: 'some_relation'};
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
	var aC = new Appacitive.ArticleCollection({ schema: 'zzz1e35345' }), a = aC.createNewArticle({__id: '123'});
	var cC = a.getConnectedArticles({ relation: 'something' });
	deepEqual(cC.connectedArticle, a, 'Connected article property setting properly on connection collection');
});



//  --------------------------- API tests -------------------------------------

module('Connection Collection API tests via Article::getConnectedArticles');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
 	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Verify error for fetching connections for unsaved article', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'profile' }), a = aC.createNewArticle();
	try {
		var cC = a.getConnectedArticles({ relation: 'userprofile' });
		ok(false, 'Nothing broke on calling fetch for connections');
		start();
	} catch(e) {
		ok(true, 'Error occured on calling fetch for connections');
		start();
	}
});

asyncTest('Verify happy flow for existing schema and relation and saved article', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'profile' }), a = aC.createNewArticle();
	a.save(function() {
		var cC = a.getConnectedArticles({ relation: 'userprofile' });
		cC.fetch(function() {
			ok(true, 'Nothing broke on calling fetch for connections');
			start();
		}, function() {
			ok(false, 'Error occured on calling fetch for connections');
			start();
		});
	});
});

asyncTest('Verify error for non-existant relation', function() {
	var aC = new Appacitive.ArticleCollection({ schema: 'profile' }), a = aC.createNewArticle();
	a.save(function() {
		var cC = a.getConnectedArticles({ relation: 'userprofile111' });
		cC.fetch(function() {
			ok(false, 'Nothing broke on calling fetch for connections');
			start();
		}, function() {
			ok(true, 'Error occured on calling fetch for connections');
			start();
		});
	});
});
