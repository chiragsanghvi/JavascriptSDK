module('Object Tests - Create');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Save object', function() {
	var object = new Appacitive.Object('profile');
	object.save().then(function() {
		ok(true, 'Created object successfully, id: ' + JSON.stringify(object.getObject()));
		start();
	}, function() {
		ok(false, 'Object create failed');
		start();
	});
});

asyncTest('Save object with properties', function() {
	var object = new Appacitive.Object('profile');
	var name = 'Aragorn' + parseInt(Math.random() * 10000);
	object.set('name', name);
	object.save().then(function() {
		equal(object.get('name'), name, 'Created object successfully ' + JSON.stringify(object.getObject()));
		start();
	}, function() {
		ok(false, 'Object create failed');
		start();
	});
});

asyncTest('Save object and verify', function() {
	var object = new Appacitive.Object('profile');
	object.save().then(function() {
			var _id = object.get('__id');
			Appacitive.Object.get({
				type: 'profile',
				id: _id
			}).then(function(createdObject) {
				if (createdObject && createdObject instanceof Appacitive.Object) {
					ok(true, 'Object with id (' + _id + ') saved and retrieved successfully.');
				} else {
					ok(false, 'Object not found');
				}
				start();
			}, function() {
				ok(false, 'Could not fetch object with id .' + _id);
				start();
			});
	});
});

asyncTest('Save object with properties and acls', function() {
	var object = new Appacitive.Object('profile');
	var name = 'Aragorn' + parseInt(Math.random() * 10000);
	object.set('name', name);

	object.acls.allowAnonymous("read");
	object.acls.allowUser(["acluser1", "acluser2", "acluser4", "acluser3"],"create");
	object.acls.denyUser(["acluser1","acluser2","acluser4"],["update", "delete"]);
	object.acls.allowGroup("aclusergroup1",["create", "read"]);
	object.acls.denyGroup(["aclusergroup1", "aclusergroup2"],"update");
	object.acls.denyAnonymous(["delete","update","manageaccess","create"]);

	object.save().then(function() {
		equal(object.get('name'), name, 'Created object successfully ' + JSON.stringify(object.getObject()));
		start();
	}, function() {
		ok(false, 'Object create with acls failed');
		start();
	});
});