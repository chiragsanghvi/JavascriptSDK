module('Environment tests');

test('Verify default environment is sandbox', function() {
	var r = new Appacitive.HttpRequest();
	r.url = 'http://apis.appacitive.com/article/user/1';
	Appacitive.initialize({apikey: testConstants.apiKey, appId: testConstants.appId });
	r.beforeSend = function(r) {
		var environmentHeader = [JSON.parse(r.data)['e']];
		equal(environmentHeader.length, 1, 'Default environment header present');
		equal(environmentHeader[0], 'sandbox', 'Default header is sandbox');
	}
	Appacitive.http.send(r);
});

test('Verify environment can be changed', function() {
	var r = new Appacitive.HttpRequest();
	r.url = 'http://apis.appacitive.com/article/user/1';
	r.beforeSend = function(r) {
		var environmentHeader = [JSON.parse(r.data)['e']];
		equal(environmentHeader.length, 1, 'Environment header present');
		equal(environmentHeader[0], 'live', 'Environment is live');
	}
	Appacitive.Session.environment('live');
	Appacitive.http.send(r);
});

test('Verify environment reverts to sandbox on incorrect values', function() {
	var r = new Appacitive.HttpRequest();
	r.url = 'http://apis.appacitive.com/article/user/1';
	r.beforeSend = function(r) {
		var environmentHeader = [JSON.parse(r.data)['e']];
		equal(environmentHeader.length, 1, 'Environment header present');
		equal(environmentHeader[0], 'sandbox', 'Environment is sandbox');
	}
	Appacitive.Session.environment('livelol');
	Appacitive.http.send(r);
});