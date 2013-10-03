module('Connection API tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: 'sandbox', appId: '14700033921384718' });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Happy path for create two articles and connect them', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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

asyncTest('Happy path for create connection with two article objects passed in proper api endpoints', function() {
	var schools = new Appacitive.ArticleCollection({ schema: 'school' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var school = schools.createNewArticle();
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
	var connectOptions = {
		__endpointa: {
			article: school,
			label: 'school'
		},
		__endpointb: {
			article: profile,
			label: 'profile'
		}
	};

	var cC = new Appacitive.ConnectionCollection({relation: 'myschool'});
	var connection = cC.createNewConnection(connectOptions);
	connection.save(function(conn) {
		ok(true, 'Save worked ');
		console.dir(conn);
		start();
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Happy path for create connection with two article objects passed in sdk endpoint objects', function() {
	var schools = new Appacitive.ArticleCollection({ schema: 'school' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var school = schools.createNewArticle();
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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

	var connection = new Appacitive.Connection(connectOptions);
	connection.save(function(conn) {
		ok(true, 'Save worked ');
		console.dir(conn);
		start();
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Happy path to fetch connection using its id', function() {
	var schools = new Appacitive.ArticleCollection({ schema: 'school' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var school = schools.createNewArticle();
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
	
	var connectOptions = {
		__endpointa: {
			article: school,
			label: 'school'
		},
		__endpointb: {
			article: profile,
			label: 'profile'
		},
		relation: 'myschool'
	};

	var connection = new Appacitive.Connection(connectOptions);
	connection.save(function(conn) {
		console.dir(conn);
		var relSchool = new Appacitive.Connection({__id: conn.get('__id'), relation : 'myschool'});
		relSchool.fetch(function() {
			ok(true, 'Connection fetched successfully.');
			console.dir(relSchool);
			start();
		}, function() {
			ok(false, 'Could not fetch connection.');
			start();
		});		
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Verify connection create using article as one endpoint and articleid as another endpoint in endpoints objects', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
	user.save( function() {
		var connectOptions = {
			endpoints: [{
				article: profile,
				label: 'profile'
			}, {
				articleid: user.get('__id'),
				label: 'user'
			}],
			relation : 'userprofile'
		};
		var connection = new Appacitive.Connection(connectOptions);
		connection.save(function(conn) {
			var relSchool = new Appacitive.Connection(conn.getConnection());
			relSchool.fetch(function() {
				ok(true, 'Connection fetched successfully.');
				console.dir(relSchool);
				start();
			}, function() {
				ok(false, 'Could not fetch connection.');
				start();
			});		
		}, function() {
			ok(false, 'Could not save connection.');
			start();
		});
	}, function() {
		ok(false, 'Could not save user article.');
		start();
	});
});

asyncTest('Verify connection update after it is created', function() {
	var connectOptions = {
		__endpointa: {
			article: {
				__schematype: 'school',
				name: 'Chirag Sanghvi'
			},
			label: 'school'
		},
		__endpointb: {
			article: {
				__schematype: 'profile'
			},
			label: 'profile'
		},
		year: '2003'
	};

	var cC = new Appacitive.ConnectionCollection({relation: 'myschool'});
	var connection = cC.createNewConnection(connectOptions);
	connection.save(function(conn) {
		equal(conn.get('year'), '2003', 'Connection properly created');
		if (conn.endpointA.article && conn.endpointA.article.getArticle && conn.endpointB.article && conn.endpointB.article.getArticle) 
			ok(true, 'Article set properly in connection');
		else
			ok(false, 'Article not set in connection');

		var year = '2005';
		conn.set('year', year);
		conn.save(function(conn) {
			equal(conn.get('year'), year, 'Connection property value changed successfully');
			start();
		}, function(status) {
			console.log(status);
			ok(false, 'Could not update connection.');
			start();
		});		
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Verify connection update directly', function() {
	var schools = new Appacitive.ArticleCollection({ schema: 'school' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var school = schools.createNewArticle();
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
	
	var connectOptions = {
		__endpointa: {
			article: school,
			label: 'school'
		},
		__endpointb: {
			article: profile,
			label: 'profile'
		}
	};

	var cC = new Appacitive.ConnectionCollection({relation: 'myschool'});
	var connection = cC.createNewConnection(connectOptions);
	connection.save(function(conn) {
		console.dir(conn);
		var relSchool =  new Appacitive.Connection(conn.getConnection());
		var year = '2005';
		relSchool.set('year', year);
		
		relSchool.save(function(conn) {
			equal(conn.get('year'), year, 'Connection property value changed successfully');
			start();
		}, function() {
			ok(false, 'Could not update connection.');
			start();
		});		
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Verify happy path for connection delete', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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

asyncTest('Verify no changeset on article fetched from connectedarticles', function() {
	var schools = new Appacitive.ArticleCollection({ schema: 'school' }), profiles = new Appacitive.ArticleCollection({ schema: 'profile' });
	var school = schools.createNewArticle();
	var profile = profiles.createNewArticle({name:'chirag sanghvi'});
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

	var connection = new Appacitive.Connection(connectOptions);
	connection.save(function(conn) {
		var a = new Appacitive.Article(profile.toJSON());
		var cC = a.getConnectedArticles({ relation: 'myschool' });
		cC.fetch(function() {
			if (cC.get(0).connectedArticle().hasChanged()) {
				ok(false, 'Article has not changed');
				start();
			} else {
				ok(true, 'Article has not changed');
				start();
			}
		}, function() {
			ok(false, 'Error occured on calling fetch for connections');
			start();
		});
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});
