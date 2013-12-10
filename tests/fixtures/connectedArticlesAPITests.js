module('Connection Query API tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Verify created connection is fetched when fetching connected articles', function() {
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'profile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	//create connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}

		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		// fetch connected articles for profile
		return profile.getConnectedArticles({ relation: 'myschool' }).fetch();
	}).then(function(articles) {
		
		//verify articles returned are not changed
		if (articles[0].hasChanged()) {
			ok(false, 'Article has not changed');
		} else {
			ok(true, 'Article has not changed');
		}


		//verify children property
		if (!profile.children['myschool']) {
			ok(false, 'Children property not set in profile');
		} else {
			ok(true, 'Children property set in profile');
		}

		var existingConnections = articles.filter(function (_c) {
			return _c.connection.id() == conn.id();
		});

		//Verify connection is returned via the getConnectedArticles
		equal(existingConnections.length, 1, 'Connection fetched on calling get connected articles for profile');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connected articles of relation type myschool');
		}
		start();
	});
});

asyncTest('Verify created connection is fetched when fetching connections for an article', function() {
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'profile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	//create connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}

		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		// fetch connections for profile
		return profile.getConnections({ relation: 'myschool', label: 'school' }).fetch();
	}).then(function(connections) {
		
		var existingConnections = connections.filter(function (_c) {
			return _c.id() == conn.id();
		});

		//Verify connection is returned via the get connections
		equal(existingConnections.length, 1, 'Connection fetched on calling get connections for profile');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connections for article of relation type myschool');
		}
		start();
	});
});

asyncTest('Verify created connection is fetched when fetching connection between two articles', function() {
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'profile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	//create connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}
		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		//fetch connection between profile and school
		var btwArticleQuery = new Appacitive.Queries.GetConnectionsBetweenArticlesForRelationQuery({ 
			relation: 'myschool',
			articleAId: school.get('__id'), 
			articleBId: profile.get('__id')
		});
		return btwArticleQuery.fetch();
	}).then(function(connection) {
		
		//Verify connection is returned via the getBetweenArticles
		equal(connection.id(), conn.id() , 'Connection fetched between 2 articles');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connections between 2 articles of relation type myschool');
		}
		start();
	});
});

asyncTest('Verify article fetched via the collection returned via getConnectedArticles has correct id', function() {
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'profile', name:'chirag sanghvi'});
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	//create connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}
		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		// fetch connected articles for profile
		return profile.getConnectedArticles({ relation: 'myschool' }).fetch();
	}).then(function(articles) {
		
		//verify articles returned are not changed
		if (articles[0].hasChanged()) {
			ok(false, 'Article has not changed');
		} else {
			ok(true, 'Article has not changed');
		}

		//verify children property
		if (!profile.children['myschool']) {
			ok(false, 'Children property not set in profile');
		} else {
			ok(true, 'Children property set in profile');
		}

		var existingArticles = articles.filter(function (_a) {
			return _a.connection.id() == conn.id();
		});

		//Verify connection is returned via the getConnectedArticles
		equal(existingArticles.length, 1, 'Connection fetched on calling get connected articles for profile');

		//Verify article fetched via the articles returned via getConnectedArticles has correct id
		var connectedSchool = existingArticles[0];
		equal(connectedSchool.get('__id'), school.get('__id'), 'Correct connected article returned');

		//Verify article fetched via the articles returned via getConnectedArticles is correct article
		deepEqual(connectedSchool.toJSON(), school.toJSON(), 'Correct connected article returned: ' + JSON.stringify(connectedSchool.getArticle()));

		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connected articles of relation type myschool');
		}
		start();
	});
});
