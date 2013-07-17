module('Email functionality tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: 'sandbox', appId: '14700033921384718' });
	ok(true, 'Session created successfully.');
	start();
});

test('Verify setup email and send email methods exist', function() {
	equal(typeof Appacitive.Email.setupEmail, 'function', 'method exists');
	equal(typeof Appacitive.Email.sendRawEmail, 'function', 'method exists');
	equal(typeof Appacitive.Email.sendTemplatedEmail, 'function', 'method exists');
});

test('Verify atleast 1 receipient is mandatory in email', function() {
	try {
		var emailOptions = {
			to: []
		};
		Appacitive.Email.sendRawEmail(emailOptions);
		ok(false, 'No error thrown if no receipients are sent');
	} catch (err) {
		ok(true, 'Error thrown on not sending receipients: ' + err.message);
	}
});

test('Verify subject is mandatory in email', function() {
	try {
		var emailOptions = {
			to: ['a@b.com'],
			subject: null
		};
		Appacitive.Email.sendRawEmail(emailOptions);
		ok(false, 'No error thrown if no subject is sent');
	} catch (err) {
		ok(true, 'Error thrown on not sending subject: ' + err.message);
	}
});

asyncTest('Verify emails can be sent with proper config details', function() {
	var createDefaultUser = function(step) {
		var user = testConstants.user;
		Appacitive.Users.createUser(user, step, step);
	};

	var authenticateDefaultUser = function(step) {
		var creds = {
	    	'username': testConstants.user.username,
	    	'password': testConstants.user.password,
	    	'expiry': -1,
	    	'attempts': -1
	    };
	    Appacitive.Users.authenticateUser(creds, function(data) {
	    	Appacitive.Session.setUserAuthHeader(data.token);
	    	step();
	    }, function(data) {
	    	ok(false, 'User authentication failed: ' + JSON.stringify(data));
	    	start();
	    });
	};

	var sendRawEmail = function() {
		var creds = {
	    	'username': testConstants.user.username,
	    	'password': testConstants.user.password,
	    	'expiry': -1,
	    	'attempts': -1
	    };
	    Appacitive.Users.authenticateUser(creds, function(data) {
	    	Appacitive.Session.setUserAuthHeader(data.token);
	    	ok(true, 'User authenticated successfully: ' + JSON.stringify(data));
	    	try {
	    		var emailOptions = {
	    			to: [Appacitive.Users.currentUser.get('email')],
	    			subject: 'Hello World!',
	    			body: '<b>hello world!</b>',
	    			ishtml : true
	    		};
	    		Appacitive.Email.sendRawEmail(emailOptions, function(email) { 
	    			ok(true, 'Send email successfully: ' + JSON.stringify(email));
	    			start();
	    		}, function(a) {
	    			ok(false, 'Email sending failed: ' + a);
	    			start();
	    		});
	    	} catch (err) {
	    		ok(true, 'Error : ' + err.message);
	    		start();
	    	}
	    }, function(data) {
	    	ok(false, 'User authentication failed: ' + JSON.stringify(data));
	    	start();
	    });
	}
	createDefaultUser(function() {
		authenticateDefaultUser(function() {
			sendRawEmail()
		});
	}, function() {
		authenticateDefaultUser(function() {
			sendRawEmail()
		});
	});
});