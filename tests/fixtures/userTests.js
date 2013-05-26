module('User serivce tests');

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

asyncTest('Verify create default user', function() {
	var user = testConstants.user;
	Appacitive.Users.createUser(user, function(user) {
		ok(true, 'User created successfully');
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

asyncTest('Verify signup for user', function() {
	var user = {};
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	user.firstname = testConstants.user.firstname;
	user.lastname = testConstants.user.lastname;
	user.email = testConstants.user.email;
	user.password = testConstants.user.password;

	Appacitive.Users.signup(user, function(data) {
		ok(true, 'User sidnedup successfully: ' + JSON.stringify(arguments));
		start();
	}, function(d) {
		ok(false, 'Error returned: ' + JSON.stringify(d));
		start();
	});
});

asyncTest('Verify login for user', function() {
	Appacitive.Users.login(testConstants.user.username, testConstants.user.password, function(data) {
		ok(true, 'User loggedin successfully: ' + JSON.stringify(arguments));
		start();
	}, function(d) {
		ok(false, 'Error returned: ' + JSON.stringify(d));
		start();
	});
});

asyncTest('Verify current usertoken validation with cookie only', function() {
	Appacitive.Users.validateCurrentUser(function(status) {
    	ok(status, 'User validated successfully with cookie ');
    	start();
    }, true);
});

asyncTest('Verify current usertoken validation with cookie only without callback', function() {
	var status = Appacitive.Users.validateCurrentUser(true);
	ok(status, 'User validated successfully with cookie ');
    start();
});

asyncTest('Verify current usertoken validation with cookie and apicall', function() {
	Appacitive.Users.validateCurrentUser(function(status) {
    	ok(status, 'User validate successfully with api call');
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

asyncTest('Verify loggedout usertoken validation with cookie only', function() {
	Appacitive.Users.validateCurrentUser(function(status) {
    	ok(!status, 'User validated successfully with cookie ');
    	start();
    }, true);
});

asyncTest('Verify loggedout usertoken validation with cookie only without callback', function() {
	var status = Appacitive.Users.validateCurrentUser(true);
	ok(!status, 'User validated successfully with cookie ');
    start();
});

asyncTest('Verify loggedout usertoken validation with cookie and apicall', function() {
	Appacitive.Users.validateCurrentUser(function(status) {
    	ok(!status, 'User validate successfully with api call');
    	start();
    });
});