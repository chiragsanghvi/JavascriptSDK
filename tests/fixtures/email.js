module('Email functionality tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
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

asyncTest('Verify raw emails can be sent', function() {
	try {
		var emailOptions = {
			to: ['csanghvi@appacitive.com'],
			subject: 'Hello World!',
			body: '<b>hello world!</b>',
			ishtml : true
		};
		Appacitive.Email.sendRawEmail(emailOptions).then(function(email) { 
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
});

asyncTest('Verify templated emails can be sent', function() {
	try {
		var emailOptions = {
			to: ['csanghvi@appacitive.com'],
			subject: 'Welcome To SDK!',
			ishtml : true,
			templateName: 'test',
			data: {
				username: 'Chirag',
				applicationName: 'SDK'
			}
		};

		Appacitive.Email.sendTemplatedEmail(emailOptions).then(function(email) { 
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
});