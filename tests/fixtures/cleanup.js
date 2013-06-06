module('Test Cleanup');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: 'sandbox' });
	ok(true, 'Session created successfully.');
	start();
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

asyncTest('Cleaning up connections of relation myschool', function() {
	var collection = new Appacitive.ConnectionCollection({ relation: 'myschool' });
	collection.fetch(function() {
		var connections = collection.getAll();
		var total = connections.length;
		if (connections.length == 0) {
			ok(true, 'No connections to delete');
			start();
			return;
		}

		var ids = [];
		connections.forEach(function (article) {
			ids.push(article.get('__id'));
		});

		Appacitive.Connection.multiDelete({ relation : "myschool", ids : ids }, function() {
			ok(true, connections.length + ' connections of type myschool deleted successfully');
			start();
		}, function() {
			ok(false, 'Article delete failed for all connections' );
			start();
		});

	}, function() {
		ok(false, 'Could not fetch connections for relation myschool');
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
		var ids = [];
		articles.forEach(function (article) {
			ids.push(article.get('__id'));
		});

		Appacitive.Article.multiDelete({ schema: "profile", ids: ids }, function(){
			ok(true, articles.length + ' articles of type profile deleted successfully');
			start();
		}, function() {
			ok(false, 'Article delete failed for all articles');
			start();
		});
	}, function() {
		ok(false, 'Could not fetch articles for schema profile');
		start();
	});
});

asyncTest('Cleaning up articles of schema school', function() {
	var collection = new Appacitive.ArticleCollection({ schema: 'school' });
	collection.fetch(function() {
		var articles = collection.getAll();
		var total = articles.length;
		if (articles.length == 0) {
			ok(true, 'No articles to delete');
			start();
			return;
		}
		var ids = [];
		articles.forEach(function (article) {
			ids.push(article.get('__id'));
		});

		Appacitive.Article.multiDelete({ schema: "school", ids: ids }, function() {
			ok(true, articles.length + ' articles of type school deleted successfully');
			start();
		}, function() {
			ok(false, 'Article delete failed for all articles');
			start();
		});
	}, function() {
		ok(false, 'Could not fetch articles for schema school');
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
	    	Appacitive.Session.setUserAuthHeader(data.token);
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
			var total = articles.length, t = articles.length;
			if (total == 0) {
				ok(true, "All users deleted");
				start();
				return;
			} 

			var step = function() {
				authenticateUser(function() {
					var numFailures = 0;
					articles.forEach(function (article) {
						if (article.get('username') != testConstants.user.username) {
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
						} else {
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
						}
					});
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