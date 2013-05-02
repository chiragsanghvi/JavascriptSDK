module('Facebook integration');

test('Verify user::getFacebookProfile exists on user object', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'user' });
	var user = users.createNewArticle();
	equal(typeof user.getFacebookProfile, 'function', 'user::getFacebookProfile exists on article of type user');
});

test('Verify article::getFacebookProfile does not exist on articles of schemas other than user', function() {
	var users = new Appacitive.ArticleCollection({ schema: 'profile' });
	var user = users.createNewArticle();
	equal(typeof user.getFacebookProfile, 'undefined', 'user::getFacebookProfile does not exist on article of type other than user');
});

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
		Appacitive.facebook.requestLogin(function(authResponse) {
			ok(true, 'Facebook login successfull with access token: ' + Appacitive.facebook.accessToken);
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
		Appacitive.facebook.getCurrentUserInfo(function(response) {
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
		var accessToken = Appacitive.facebook.accessToken;
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
		var accessToken = Appacitive.facebook.accessToken;
		Appacitive.Users.signupWithFacebook(function(user) {
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
		var accessToken = Appacitive.facebook.accessToken;
		Appacitive.Users.signupWithFacebook(function(user) {
			deepEqual(user.user, Appacitive.Users.currentUser, 'Appacitive.Users.currentUser is: ' + user.token);
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
		var accessToken = Appacitive.facebook.accessToken;
		Appacitive.Users.signupWithFacebook(function(user) {
			var token = user.token;
			Appacitive.session.setUserAuthHeader(token);
			var id = user.user.__id;
			ok(true, 'Signed up with facebook: ' + JSON.stringify(user));
			var users = new Appacitive.ArticleCollection({ schema: 'user' });
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