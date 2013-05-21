module('Email functionality tests');

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

test('Verify setup email and send email methods exist', function() {
	equal(typeof Appacitive.email.setupEmail, 'function', 'method exists');
	equal(typeof Appacitive.email.sendRawEmail, 'function', 'method exists');
	equal(typeof Appacitive.email.sendTemplatedEmail, 'function', 'method exists');
});

test('Verify atleast 1 receipient is mandatory in email', function() {
	try {
		var emailOptions = {
			to: []
		};
		Appacitive.email.sendRawEmail(emailOptions);
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
		Appacitive.email.sendRawEmail(emailOptions);
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
	    	Appacitive.session.setUserAuthHeader(data.token);
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
	    	Appacitive.session.setUserAuthHeader(data.token);
	    	ok(true, 'User authenticated successfully: ' + JSON.stringify(data));
	    	try {
	    		var emailOptions = {
	    			to: ['csanghvi@appacitive.com'],
	    			subject: 'Hello World!',
	    			body: '<b>hello world!</b>',
	    			ishtml : true
	    		};
	    		Appacitive.email.sendRawEmail(emailOptions, function(email) { 
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
	});
});