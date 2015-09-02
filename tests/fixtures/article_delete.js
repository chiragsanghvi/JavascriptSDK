module('Object Tests - Delete');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Delete unsaved object', function() {
	var object = new Appacitive.Object('profile');
	var random = Math.random();
	object.set('random', random);
	object.destroy().then(function() {
		ok(true, 'Object deleted successfully');
		start();
	}, function() {
		ok(false, 'Deleting unsaved object failed');
		start();
	});
});


asyncTest('Delete saved object', function() {
	var object = new Appacitive.Object('profile');
	var created = false;
	object.save().then(function() {
		return object.destroy();
	}).then(function() {
		ok(true, 'Object deleted successfully');
		start();
	}, function() {
		if (object.created) {
			ok(false, 'Deleting saved object with id ' + object.id + ' failed');
			start();
		} else {
			ok(false, 'Object create failed');
			start();
		}
	});
});

asyncTest('Delete non-existent object', function() {
	var object = new Appacitive.Object('profile');
	object.set('__id', 0070);
	object.destroy().then(function() {
		ok(false, 'onSuccess called after deleting unsaved object');
		start();
	}, function() {
		ok(true, 'Deleting unsaved object failed as expected');
		start();
	});
});
