module('User serivce tests');

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

asyncTest('Verify create default user', function() {
	var user = testConstants.user;
	Appacitive.Users.createUser(user, function(user) {
		ok(true, 'User created successfully: ' + JSON.stringify(arguments));
		start();
	}, function(d) {
		ok(false, 'Error returned: ' + JSON.stringify(d));
		start();
	});
});

asyncTest('Verify default user authentication', function() {
	var creds = {
    	'username': testConstants.user.username,
    	'password': testConstants.user.password,
    	'expiry': -1,
    	'attempts': -1
    };
    Appacitive.Users.authenticateUser(creds, function(data) {
    	Appacitive.session.setUserAuthHeader(data.token);
    	ok(true, 'User authenticated successfully: ' + JSON.stringify(data));
    	start();
    }, function(data) {
    	ok(false, 'User authentication failed: ' + JSON.stringify(data));
    	start();
    });
});

asyncTest('Verify currently logged in user delete', function() {
	Appacitive.Users.deleteCurrentUser(function() {
		ok(true, 'Current user deleted successfully');
		start();
	}, function(m) {
		ok(false, 'Current user delete failed: ' + JSON.stringify(m));
		start();
	});
});