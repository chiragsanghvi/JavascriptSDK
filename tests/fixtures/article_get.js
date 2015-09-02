module('Object Tests - Get');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Get non-existent object', function() {
	var object = new Appacitive.Object('profile');
	object.id = '12345';
	object.fetch().then(function() {
		ok(false, 'onSuccess called on fetching non-existent object');
		start();
	}, function() {
		ok(true, 'onError called on fetching non-existent object');
		start();
	})
});

asyncTest('Save 2 objects and multiget them', function() {
	var object = new Appacitive.Object('profile');
	var profile = new Appacitive.Object('profile');

	var tasks = [];
	tasks.push(object.save());
	tasks.push(profile.save());

	var promise = Appacitive.Promise.when(tasks);

	promise.then(function() {
		var ids = [];
		ids.push(profile.get('__id'));
		ids.push(object.get('__id'));
		return Appacitive.Object.multiGet({ type: 'profile', ids: ids });
	}).then(function(objects) {
		equal(objects.length, 2, 'Objects fetched successfully  using multiget');
		start();
	}, function() {
		if (object.isNew()) {
			ok(false, 'First Object could not be saved!');
		} else if (profile.isNew()) {
			ok(false, 'Second Object could not be saved!');
		} else {
			ok(false, 'Could not multiget objects of type profile');
		}
	});
});


asyncTest('Save 2 objects extending object and multiget them using extendend object', function() {
	var Profile = Appacitive.Object.extend('profile');

	var object1 = new Profile();
	var object2 = new Profile();

	var tasks = [];
	tasks.push(object1.save());
	tasks.push(object2.save());

	var promise = Appacitive.Promise.when(tasks);

	promise.then(function() {
		return Profile.multiGet([object1.id, object2.id]);
	}).then(function(objects) {
		equal(objects.length, 2, 'Objects fetched successfully  using multiget');
		start();
	}, function() {
		if (object1.isNew()) {
			ok(false, 'First Object could not be saved!');
		} else if (object2.isNew()) {
			ok(false, 'Second Object could not be saved!');
		} else {
			ok(false, 'Could not multiget objects of type profile');
		}
	});
});