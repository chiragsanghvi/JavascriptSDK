module('User service tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Verify create default user', function() {
	var user = testConstants.user;
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	Appacitive.Users.createUser(user).then(function(user) {
		ok(true, 'User created successfully');
		start();
	}, function(d) {
		ok(false, 'Error returned: ' + JSON.stringify(d));
		start();
	});
});

asyncTest('Verify default user authentication', function() {
    Appacitive.Users.login(testConstants.user.username, testConstants.user.password).then(function(data) {
    	Appacitive.Session.setUserAuthHeader(data.token);
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

	Appacitive.Users.signup(user).then(function(data) {
		if (Appacitive.Users.current()) {
			ok(true, 'User signedup successfully: ' + JSON.stringify(arguments));
		} else {
			ok(true, 'User was not authenticated');
		}
		start();
	}, function(d) {
		ok(false, 'Error returned: ' + JSON.stringify(d));
		start();
	});
});

asyncTest('Verify user password update', function() {
	var userObj = testConstants.user;
	userObj.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	
	var created, reset, login;
	Appacitive.Users.createUser(userObj).then(function(user) {
		ok(true, 'User created successfully');
		created = true;
		return user.updatePassword(userObj.password, "p@ssw0rd");
	}).then(function() {
		reset = true;
		ok(true, 'User password updated successfully');
		return Appacitive.Users.login(userObj.username, "p@ssw0rd");
	}).then(function() {
		login = true;
		ok(true, 'User logged in successfully with new password');
		start();
	}, function(d) {
		if(!created) {
			ok(false, "Unable to create new user " + JSON.stringify(d));
		} else if(!reset) {
			ok(false, "Unable to reset password " + JSON.stringify(d));
		} else {
			ok(false, "Unable to login " + JSON.stringify(d));
		}
		start();
	});
});

asyncTest('Verify create user with location', function() {
	var user = testConstants.user;
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	var location = new Appacitive.GeoCoord(10, 10);
	user.location = location;
	Appacitive.Users.createUser(user).then(function(user) {
		ok(true, 'User created successfully');
		equal(location.toString(), user.get('location').toString(), 'Matching geolocation');
		start();
	}, function(d) {
		ok(false, 'Error returned: ' + JSON.stringify(d));
		start();
	});
});

asyncTest('Verify current usertoken validation with cookie only', function() {
	Appacitive.Users.validateCurrentUser(true).then(function(status) {
    	ok(status, 'User validated successfully with cookie ');
    	start();
    });
});

asyncTest('Verify current usertoken validation with cookie and apicall', function() {
	Appacitive.Users.validateCurrentUser().then(function(status) {
    	ok(status, 'User validate successfully with api call');
    	start();
    });
});