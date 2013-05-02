module('Environment tests');

test('Verify default environment is sandbox', function() {
	var r = new Appacitive.HttpRequest();
	r.beforeSend = function(r) {
		var environmentHeader = r.headers.filter(function(h) {
			return h.key.toLowerCase() == 'appacitive-environment';
		});
		equal(environmentHeader.length, 1, 'Default environment header present');
		equal(environmentHeader[0].value, 'sandbox', 'Default header is sandbox');
	}
	Appacitive.http.send(r);
});

test('Verify environment can be changed', function() {
	var r = new Appacitive.HttpRequest();
	r.beforeSend = function(r) {
		var environmentHeader = r.headers.filter(function(h) {
			return h.key.toLowerCase() == 'appacitive-environment';
		});
		equal(environmentHeader.length, 1, 'Environment header present');
		equal(environmentHeader[0].value, 'live', 'Environment is live');
	}
	Appacitive.session.environment = 'live';
	Appacitive.http.send(r);
});

test('Verify environment reverts to sandbox on incorrect values', function() {
	var r = new Appacitive.HttpRequest();
	r.beforeSend = function(r) {
		var environmentHeader = r.headers.filter(function(h) {
			return h.key.toLowerCase() == 'appacitive-environment';
		});
		equal(environmentHeader.length, 1, 'Environment header present');
		equal(environmentHeader[0].value, 'sandbox', 'Environment is sandbox');
	}
	Appacitive.session.environment = 'livelol';
	Appacitive.http.send(r);
});