module('Connected Articles API tests');

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

asyncTest('Verify created connection shows up in collection when fetching connected articles', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	var userId = null;
	user.save(function() {
		userId = user.get('__id');
		profile.save(function() {
			var connectOptions = {
				__endpointa: {
					articleid: profile.get('__id'),
					label: 'profile'
				},
				__endpointb: {
					articleid: user.get('__id'),
					label: 'user'
				}
			};
			var cC = new Appacitive.ConnectionCollection({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.save(function() {
				var id = connection.get('__id');
				setTimeout(function() {
					var collection = user.getConnectedArticles({ relation: 'userprofile'});
					collection.fetch(function() {
						var existingConnection = collection.getAll().filter(function (_c) {
							return _c.get('__id') == id;
						});
						equal(existingConnection.length, 1, 'Connection fetched on calling get connected articles');
						start();
					}, function() {
						ok(false, 'Could not fetch connected articles of relation type userprofile');
						start();
					});
				}, 1000);
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			});
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});

asyncTest('Verify connectedArticle property sets properly on returned connectionCollection', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.save(function() {
		var connectedProfiles = user.getConnectedArticles({ relation: 'userprofile' });
		deepEqual(user, connectedProfiles.connectedArticle, 'ConnectionCollection::connectedArticle sets properly');
		start();
	}, function() {
		ok(false, 'Could not save article of type user');
		start();
	});
});

asyncTest('Verify article fetched via the collection returned via getConnectedArticles has correct id', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	var userId = null, profileId = null;
	user.save(function() {
		userId = user.get('__id');
		profile.save(function() {
			profileId = profile.get('__id');
			var connectOptions = {
				__endpointa: {
					articleid: profile.get('__id'),
					label: 'profile'
				},
				__endpointb: {
					articleid: user.get('__id'),
					label: 'user'
				}
			};
			var cC = new Appacitive.ConnectionCollection({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.save(function() {
				var id = connection.get('__id');
				setTimeout(function() {
					var collection = user.getConnectedArticles({ relation: 'userprofile' });
					collection.fetch(function() {
						var existingConnection = collection.getAll().filter(function (_c) {
							return _c.get('__id') == id;
						});
						var connectedProfile = existingConnection[0].connectedArticle;
						equal(connectedProfile.get('__id'), profile.get('__id'), 'Correct connected article returned');
						start();
					}, function() {
						ok(false, 'Could not fetch connected articles of relation type userprofile');
						start();
					});
				}, 1000);
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			});
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});

asyncTest('Verify article fetched via the collection returned via getConnectedArticles is correct article', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	var userId = null, profileId = null;
	user.save(function() {
		userId = user.get('__id');
		profile.save(function() {
			profileId = profile.get('__id');
			var connectOptions = {
				__endpointa: {
					articleid: profile.get('__id'),
					label: 'profile'
				},
				__endpointb: {
					articleid: user.get('__id'),
					label: 'user'
				}
			};
			var cC = new Appacitive.ConnectionCollection({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.save(function() {
				var id = connection.get('__id');
				setTimeout(function() {
					var collection = user.getConnectedArticles({ relation: 'userprofile' });
					collection.fetch(function() {
						var existingConnection = collection.getAll().filter(function (_c) {
							return _c.get('__id') == id;
						});
						var connectedProfile = existingConnection[0].connectedArticle;
						connectedProfile.fetch(function() {
							deepEqual(connectedProfile.getArticle(), profile.getArticle(), 'Correct connected article returned: ' + JSON.stringify(connectedProfile.getArticle()));
							start();
						}, function() {
							ok(false, 'Could not fetch article for connected profile');
							start();
						});
					}, function() {
						ok(false, 'Could not fetch connected articles of relation type userprofile');
						start();
					});
				}, 1000);
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			});
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});