module('Session Test');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: 'sandbox' });
	Appacitive.Session.create(function() {
		ok(true, 'Session created successfully.');
		start();
	}, function() {
		ok(true, 'Could not created session.');
		start();
	});
});

asyncTest('Verify user auth header can be added', function() {
	var guid = Appacitive.GUID().toString();
	Appacitive.Session.setUserAuthHeader(guid);
	var req1 = new Appacitive.HttpRequest();
	req1.method = 'get';
	req1.url = 'https://apis.appacitive.com/article/1/1';
	req1.beforeSend = function(request) {
		var userAuthHeader = request.headers.filter(function(header) {
			return header.key.toLowerCase() == 'appacitive-user-auth';
		});
		equal(userAuthHeader.length, 1, 'User auth header added');
		equal(userAuthHeader[0].value, guid, 'User auth header value correct: ' + guid);
		start();
	};
	Appacitive.http.send(req1);
});

asyncTest('Verify user auth header can be removed', function() {
	var guid = Appacitive.GUID();
	Appacitive.Session.setUserAuthHeader(guid);
	var req1 = new Appacitive.HttpRequest();
	req1.method = 'get';
	req1.url = 'https://apis.appacitive.com/article/1/1';
	req1.beforeSend = function(request) {
		var userAuthHeader = request.headers.filter(function(header) {
			return header.key.toLowerCase() == 'appacitive-user-auth';
		});
		equal(userAuthHeader.length, 1, 'User auth header added');
		equal(userAuthHeader[0].value, guid, 'User auth header value correct: ' + guid);
	};
	Appacitive.http.send(req1);
	Appacitive.Session.removeUserAuthHeader();
	req1 = new Appacitive.HttpRequest();
	req1.method = 'get';
	req1.url = 'https://apis.appacitive.com/article/1/1';
	req1.beforeSend = function(request) {
		var userAuthHeader = request.headers.filter(function(header) {
			return header.key.toLowerCase() == 'appacitive-user-auth';
		});
		equal(userAuthHeader.length, 0, 'User auth header removed');
		start();
	};
	Appacitive.http.send(req1);
});