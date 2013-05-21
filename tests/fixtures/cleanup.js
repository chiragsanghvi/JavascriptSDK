module('Test Cleanup');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.session.resetSession();
	Appacitive.session.removeUserAuthHeader();
	var _sessionOptions = { "apikey": testConstants.apiKey, app: testConstants.appName };
	var subscriberId = Appacitive.eventManager.subscribe('session.success', function() {
		ok(true, 'Session created successfully.');
		start();
		Appacitive.eventManager.unsubscribe(subscriberId);
	})
	Appacitive.session.create(_sessionOptions);
});

asyncTest('Cleaning up connections of relation userprofile', function() {
	var collection = new Appacitive.ConnectionCollection({ relation: 'userprofile' });
	collection.fetch(function() {
		var connections = collection.getAll();
		var total = connections.length;
		if (connections.length == 0) {
			ok(true, 'No connections to delete');
			start();
			return;
		}
		connections.forEach(function (connection) {
			connection.del(function() {
				total -= 1;
				if (total == 0) {
					ok(true, connections.length + ' connections of type profile deleted successfully');
					start();
				}
			}, function() {
				ok(false, 'Article delete failed for connections with id: ' + connection.get('__id'));
				start();
			})
		});
	}, function() {
		ok(false, 'Could not fetch articles for schema profile');
		start();
	});
});

asyncTest('Cleaning up articles of schema profile', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	collection.fetch(function() {
		var articles = collection.getAll();
		var total = articles.length;
		if (articles.length == 0) {
			ok(true, 'No articles to delete');
			start();
			return;
		}
		articles.forEach(function (article) {
			article.del(function() {
				total -= 1;
				if (total == 0) {
					ok(true, articles.length + ' articles of type profile deleted successfully');
					start();
				}
			}, function() {
				ok(false, 'Article delete failed for article with id: ' + article.get('__id'));
				start();
			})
		});
	}, function() {
		ok(false, 'Could not fetch articles for schema profile');
		start();
	});
});

asyncTest('Cleaning up articles of schema user', function() {

	var createDefaultUser = function(step) {
		var user = testConstants.user;
		Appacitive.Users.createUser(user, step, step);
	};

	var authenticateUser = function(step) {
		var creds = {
	    	'username': testConstants.user.username,
	    	'password': 'test123!@#',
	    	'expiry': 60,
	    	'attempts': 10
	    };
	    Appacitive.Users.authenticateUser(creds, function(data) {
	    	Appacitive.session.setUserAuthHeader(data.token);
	    	step();
	    }, function(data) {
	    	ok(false, 'User authentication failed: ' + JSON.stringify(data));
	    	start();
	    });
	};

	var deleteUsers = function() {
		//Appacitive.session.setUserAuthHeader(testConstants.adminUserAuthToken);

		var collection = new Appacitive.ArticleCollection({ schema: 'user' });
		collection.fetch(function() {
			var articles = collection.getAll();
			var total = articles.length - 1, t = articles.length - 1;
			var step = function() {
				authenticateUser(function() {
					if (total == 0) {
						Appacitive.Users.deleteCurrentUser(function() {
							ok(true, '1/1 articles of type user deleted successfully');
							start();
						}, function() {
							ok(false, 'Article delete failed for  1/1 articles');
							start();
						});
					} else {
						var numFailures = 0;
						articles.forEach(function (article) {
							if (article.get('username') != 'bchakravarty@appacitive.com') {
								var deleteUser = function() {
									article.del(function() {
										// Appacitive.session.removeUserAuthHeader();
										total -= 1;
										if (total == 0) {
											Appacitive.Users.deleteCurrentUser(function() {
												ok(true, articles.length + '/' + t + ' articles of type user deleted successfully');
												start();
											}, function() {
												numFailures += 1;
												ok(false, 'Article delete failed for ' + numFailures + '/' + t +' articles');
												start();
											});
										}
									}, function() {
										// Appacitive.session.removeUserAuthHeader();
										numFailures += 1;
										total -= 1;
										if (total == 0) {
											Appacitive.Users.deleteCurrentUser(function() {
												ok(false, 'Article delete failed for ' + numFailures + '/' + t +' articles');
												start();
											}, function() {
												numFailures += 1;
												ok(false, 'Article delete failed for ' + numFailures + '/' + t +' articles');
												start();
											});
										}
									});
								};
								// authenticateUser(article.get('username'), deleteUser);
								deleteUser();
							}
						});
					};
				});
			};
			createDefaultUser(step);
		}, function(e) {
			ok(false, 'Could not fetch articles for schema user');
			start();
		});
	}
	deleteUsers();
});