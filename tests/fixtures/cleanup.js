module('Test Cleanup');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Cleaning up articles of schema school', function() {
	var query = new Appacitive.Article.findAll({ schema: 'school', pageSize: 200 });
	var total = 0, tasks = [];
	query.fetch().then(function(articles) {
		total = articles.length;
		
		if (articles.length == 0) {
			ok(true, 'No articles to delete');
			return Appacitive.Promise().fulfill();
		} else {
			articles.forEach(function (article) {
				tasks.push(article.destroy(true));
			});
			return Appacitive.Promise.when(tasks);
		}
	}).then (function() {
		ok(true, total + ' articles of type school deleted successfully');
		start();
	}, function(reasons, values) {
		if (tasks.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });
			ok(false, deleted + ' of ' + total + ' articles of school deleted.');
		} else {
			ok(false, 'Could not fetch articles for schema school');
		}
		start();
	});
});


asyncTest('Cleaning up connections of relation myschool', function() {
	var query = new Appacitive.Connection.findAll({ relation: 'myschool', pageSize: 200 });
	var total = 0, tasks = [];
	
	query.fetch().then(function(connections) {
		total = connections.length;
		
		if (connections.length == 0) {
			ok(true, 'No connections to delete');
			return Appacitive.Promise().fulfill();
		} else {
			connections.forEach(function (con) {
				tasks.push(con.destroy());
			});
			return Appacitive.Promise.when(tasks);
		}
	}).then (function() {
		ok(true, total + ' connections of type myschool deleted successfully');
		start();
	}, function(reasons, values) {
		if (tasks.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });

			ok(false, deleted + ' of ' + total + ' connections of myschool deleted.');
		} else {
			ok(false, 'Could not fetch connections for relation myschool');
		}
		start();
	});
});

asyncTest('Cleaning up connections of relation userprofile using multiDelete', function() {

	var query = new Appacitive.Connection.findAll({ relation: 'userprofile', pageSize: 200 });
	var total = 0, ids = [];
	
	query.fetch().then(function(connections) {
		total = connections.length;
		
		if (connections.length == 0) {
			ok(true, 'No connections to delete');
			return Appacitive.Promise().fulfill();
		} else {
			connections.forEach(function (con) {
				ids.push(con.id());
			});
			return Appacitive.Connection.multiDelete({
				relation: 'userprofile',
				ids: ids
			});
		}
	}).then (function() {
		ok(true, total + ' connections of type userprofile deleted successfully');
		start();
	}, function(reasons, values) {
		if (ids.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });
			ok(false, deleted + ' of ' + total + ' connections of userprofile.');
		} else {
			ok(false, 'Could not fetch connections for relation userprofile');
		}
		start();
	});
});


asyncTest('Cleaning up articles of schema profile using multidelete', function() {

	var query = new Appacitive.Article.findAll({ schema: 'profile', pageSize: 200 });
	var total = 0, ids = [];
	
	//Fetch all profile articles
	query.fetch().then(function(articles) {
		total = articles.length;
		
		if (articles.length == 0) {
			ok(true, 'No articles to delete');
			return Appacitive.Promise().fulfill();
		} else {
			articles.forEach(function (article) {
				ids.push(article.id());
			});
			//Multidelete them
			return Appacitive.Article.multiDelete({
				schema: 'profile',
				ids: ids
			});
		}
	}).then (function() {
		ok(true, total + ' articles of type profile deleted successfully');
		start();
	}, function(reasons, values) {
		if (ids.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });
			ok(false, deleted + ' of ' + total + ' articles of profile.');
		} else {
			ok(false, 'Could not fetch articles for schema profile');
		}
		start();
	});
});

asyncTest('Cleaning up articles of schema user by fetching them using "users" filter query and then deleting them one at a time', function() {
	//logout current user
	Appacitive.Users.logout(null, true);

	var total = 0;

	//Authenticate current user
    Appacitive.Users.login('chiragsanghvi', 'test123!@#').then(function(data) {
    	//Fetch all users except admin user
    	var query = new Appacitive.Queries.GraphFilterQuery('users');
    	return query.fetch();
    }).then(function(ids) {
    	total = ids.length;
		if (total === 0) {
    		ok(true, 'No users to delete');
			return Appacitive.Promise().fulfill();
    	}

    	var tasks = [];
    	ids.forEach(function(id) {
    		tasks.push(new Appacitive.User({ __id: id }).destroy());
    	});
    	return Appacitive.Promise.when(tasks);
    }).then(function() {
    	ok(true, 'All users to deleted');
    	start();
    }, function(data, values) {
    	if (!Appacitive.Users.current()) {
    		ok(false, 'User authentication failed: ' + JSON.stringify(data));
    	} else if (total === 0) {
    		ok(false, 'Could not fetch articles for schema user');
    	} else {
    		var numFailures = total;
			values.forEach(function(v) { if (v) --numFailures; });
			ok(false, 'Article delete failed for ' + numFailures + '/' + total +' articles');
    	}
    	start();
    });
	
});