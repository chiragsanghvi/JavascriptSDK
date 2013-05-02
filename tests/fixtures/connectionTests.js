module('Connection API tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.session.resetSession();
	var _sessionOptions = { "apikey": testConstants.apiKey, app: testConstants.appName };
	var subscriberId = Appacitive.eventManager.subscribe('session.success', function() {
		ok(true, 'Session created successfully.');
		start();
		Appacitive.eventManager.unsubscribe(subscriberId);
	});
	Appacitive.session.create(_sessionOptions);
});

asyncTest('Happy path for create two articles and connect them', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	user.save(function() {
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
			var cC = user.getConnectedArticles({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.save(function() {
				ok(true, 'Save worked');
				start();
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

asyncTest('Verify happy path for connection delete', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	user.save(function() {
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
			var cC = user.getConnectedArticles({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.save(function() {
				connection.del(function() {
					ok(true, 'Connection delete successfully completed.');
					start();
				}, function() {
					ok(false, 'onError called on connection delete.');
					start();
				});
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			})
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});

asyncTest('Verify unsaved connection delete removes connection from the collection', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	user.save(function() {
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
			var cC = user.getConnectedArticles({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.del(function() {
				equal(cC.getAll().length, 0, 'Connection removed from the collection.');
				start();
			}, function() {
				ok(false, 'onError called on connection delete.');
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

asyncTest('Verify connection delete removes connection from the collection', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	user.save(function() {
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
			var cC = user.getConnectedArticles({ relation: 'userprofile' });
			var connection = cC.createNewConnection(connectOptions);
			connection.save(function() {
				connection.del(function() {
					equal(cC.getAll().length, 0, 'Connection removed from the collection.');
					start();
				}, function() {
					ok(false, 'onError called on connection delete.');
					start();
				});
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			})
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});

asyncTest('Verify connection delete removes connection from the collection after fetching', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	user.save(function() {
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
				connection.del(function() {
					cC.fetch(function() {
						var conn = cC.getAll().filter(function(c) {
							return c.get('__id') == id;
						});
						equal(conn.length, 0, 'Connection deleted from server');
						start();
					}, function() {
						ok(false, 'onError called on fetching connections');
						start();
					});
				}, function() {
					ok(false, 'onError called on connection delete.');
					start();
				});
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			})
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});

asyncTest('Verify created connection shows up in collection after fetching connections by type', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle();
	user.save(function() {
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
					cC.fetch(function() {
						var conn = cC.getAll().filter(function(c) {
							return c.get('__id') == id;
						});
						equal(conn.length, 1, 'Connection shows up in connection collection');
						start();
					}, function() {
						ok(false, 'onError called on fetching connections');
						start();
					});
				}, 1000);
			}, function() {
				ok(false, 'Could not save connection.');
				start();
			})
		}, function() {
			ok(false, 'Could not save article of type profile.');
			start();
		})
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});