module('Facebook integration');

test('Verify user::getFacebookProfile exists on user object', function() {
	var users = new global.Appacitive.ArticleCollection({ schema: 'user' });
	var user = users.createNewArticle();
	equal(typeof user.getFacebookProfile, 'function', 'user::getFacebookProfile exists on article of type user');
});

test('Verify article::getFacebookProfile does not exist on articles of schemas other than user', function() {
	var users = new global.Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	equal(typeof user.getFacebookProfile, 'undefined', 'user::getFacebookProfile does not exist on article of type other than user');
});

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
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
	    global.Appacitive.Users.authenticateUser(creds, function(data) {
	    	Appacitive.Session.setUserAuthHeader(data.token);
	    	step();
	    }, function(data) {
	    	ok(false, 'User authentication failed: ' + JSON.stringify(data));
	    	start();
	    });
	};

	var deleteUsers = function() {
		//Appacitive.session.setUserAuthHeader(testConstants.adminUserAuthToken);

		var collection = new global.Appacitive.ArticleCollection({ schema: 'user' });
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

asyncTest('Create and link facebook user in one api call', function() {
	var user = {};
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	user.firstname = testConstants.user.firstname;
	user.lastname = testConstants.user.lastname;
	user.email = testConstants.user.email;
	user.password = testConstants.user.password;
	var newUser = new global.Appacitive.User(user);
	
	Appacitive.Facebook.requestLogin(function(authResponse) {
		newUser.linkFacebookAccount(Appacitive.Facebook.accessToken(), function() {
			if (newUser.linkedAccounts.length > 0){
				ok(true, "Facebook account linked to user");
				newUser.save(function() {
					ok(true, "Saved user");
					var user1 = {};
					user1.username = 'DeepClone #' + parseInt(Math.random() * 10000);
					user1.firstname = testConstants.user.firstname;
					user1.lastname = testConstants.user.lastname;
					user1.email = testConstants.user.email;
					user1.password = testConstants.user.password;
					Appacitive.Users.signup(user1, function() {
							newUser.del(function() {
								ok(true, "Deleted current user");
								Appacitive.Users.currentUser().linkFacebookAccount(function(base) {
									deepEqual(base.linkedAccounts.length, 1, 'User linked to his facebook account');
									start();
								}, function() {
									ok(false, 'Could not link facebook account');
									start();
								});
							}, function(){
							ok(false, "Could'nt delete current user");
							start();
						});
					}, function() {
						ok(false, 'Couldnt create user');
					});					
				}, function(s) {
					ok(false, "Could not save user");
					start();
				});
			} else {
				ok(false, "Facebook account could not be linked to user");
				start();
			}
		}, function() {
			ok(false, 'Could not link facebook account to user.');
	        start();
		});
	}, function() {
		ok(false, 'User cancelled login or did not fully authorize.')
	    start();
	});
});

asyncTest('Verify login with facebook via facebook sdk', function() {
	FB.login(function(response) {
	  if (response.authResponse) {
	    var accessToken = response.authResponse.accessToken;
	    if (accessToken) {
	    	ok(true, 'Received auth response: ' + JSON.stringify(response.authResponse, null, 2));
	    } else {
	    	ok(false, 'Could not get facebook access token');
	    }
	    start();
	  } else {
	    ok(false, 'User cancelled login or did not fully authorize.')
	    start();
	  }
	});
});

asyncTest('Verify login with facebook via Appacitive sdk', function() {
	try {
		Appacitive.Facebook.requestLogin(function(authResponse) {
			ok(true, 'Facebook login successfull with access token: ' + global.Appacitive.Facebook.accessToken());
			start();
		}, function() {
			ok(false, 'Facebook login failed');
			start();
		});
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});

asyncTest('Verify getting current facebook user info via Appacitive sdk', function() {
	try {
		Appacitive.Facebook.getCurrentUserInfo(function(response) {
			ok(true, 'Got info: ' + JSON.stringify(response));
			start();
		}, function() {
			ok(false, 'Could not get info from facebook');
			start();
		});
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
})

asyncTest('Signup with facebook', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		Appacitive.Users.signupWithFacebook(function(user) {
			ok(true, 'Signed up with facebook: ' + JSON.stringify(user));
			start();
		}, function(err) {
			err = err || {};
			ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			start();
		})
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();	
	}
});

asyncTest('Signin with facebook and verify auth token', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		Appacitive.Users.loginWithFacebook(function(user) {
			equal(typeof user.token, 'string', 'Auth token returned: ' + user.token);
			ok(true, 'Signed up with facebook: ' + JSON.stringify(user));
			start();
		}, function(err) {
			err = err || {};
			ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			start();
		})
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});

asyncTest('Signin with facebook and verify Appacitive.Users.currentUser', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		Appacitive.Users.loginWithFacebook(function(user) {
			deepEqual(user.user, global.Appacitive.Users.currentUser(), 'Appacitive.Users.currentUser is: ' + user.token);
			start();
		}, function(err) {
			err = err || {};
			ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			start();
		})
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});

asyncTest('Verify get facebook user if info is requested', function() {
	try {
		var accessToken = global.Appacitive.Facebook.accessToken();
		Appacitive.Users.loginWithFacebook(function(data) {
			var token = data.token;
			var user = data.user.getArticle();
			Appacitive.Session.setUserAuthHeader(token);
			var id = user.__id;
			ok(true, 'Signed up with facebook: ' + JSON.stringify(user));
			var users = new global.Appacitive.ArticleCollection({ schema: 'user' });
			var user = users.createNewArticle();
			user.set('__id', id);
			user.getFacebookProfile(function(fbProfile) {
				ok(true, 'all good, data is: ' + JSON.stringify(fbProfile));
				start();
			}, function() {
				ok(false, 'all bad');
				start();
			});
		}, function(err) {
			err = err || {};
			ok(false, 'Could not signup with facebook: ' + JSON.stringify(err));
			start();
		})
	} catch (e) {
		ok(false, 'Error occured: ' + e.message);
		start();
	}
});