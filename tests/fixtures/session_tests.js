module('Session Test');

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

asyncTest('Verify user auth header can be added', function() {
	var guid = Appacitive.GUID().toString();
	Appacitive.session.setUserAuthHeader(guid);
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
	Appacitive.session.setUserAuthHeader(guid);
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
	Appacitive.session.removeUserAuthHeader();
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