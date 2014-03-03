module('Object Tests - Update');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

test('Update object and verify in model', function() {
	var object = new Appacitive.Object('profile');
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	object.set('name', name);
	equal(object.get('name'), name, 'Object property value changed in model successfully');
});

asyncTest('Updating object and save it', function() {
	var object = new Appacitive.Object('profile');
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	object.set('name', name);
	object.save().then(function() {
		ok(true, 'onSuccess called on object update');
		start();
	}, function() {
		ok(false, 'Could not save object, onError called');
		start();
	});
});

asyncTest('Update object, save and verify value and verify value', function() {
	var object = new Appacitive.Object('profile');
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	object.set('name', name);
	object.save().then(function() {
		var id = object.get('__id');
		equal(name, object.get('name'), 'Value of object in model matches after update');
		start();
	}, function() {
		ok(false, 'Could not save object, onError called');
		start();
	});
});

asyncTest('Update object and verify after fetching it again', function() {
	var object = new Appacitive.Object('profile');
	var prevName = 'Arathorn' + parseInt(Math.random() * 10000);
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	
	object.set('name', prevName);
	
	//Create object
	object.save().then(function() {
		equal(prevName, object.get('name'), 'Value of object in model match after create');
		
		//update object
		object.set('name', name);
		return object.save();
	}).then(function(fetchedObject) {
		equal(name, fetchedObject.get('name'), 'Value of object model match after update');
		//fetch object
		return Appacitive.Object.get({
			type: 'profile',
			id: object.id()
		});
	}).then(function(fetchedObject) {
		ok(true, 'Object with id (' + fetchedObject.id() + ') saved and retrieved successfully.');
		equal(name, fetchedObject.get('name'), 'Value of object in model match after fetch');
		start();
	}, function() {
		if (object.isNew()) {
			ok(false, 'Could not create object, onError called');
		} else if (object.created) {
			ok(false, 'Could not update object, onError called');
		} else {
			ok(false, 'Could not fetch object');
		}
		start();
	});
});

asyncTest('Fetch object using search and then update it and verify its value', function() {
	var object = new Appacitive.Object('profile');
	var prevName = 'Arathorn' + parseInt(Math.random() * 10000);
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	var fetched = false;
	object.set('name', prevName);
	
	//Create object
	object.save().then(function() {
		equal(prevName, object.get('name'), 'Value of object in model match after create');
		
		//search object
		return Appacitive.Object.findAll({
			type: 'profile'
		}).fetch();
	}).then(function(fetchedObjects) {
		var fetchedObjects = fetchedObjects.filter(function (a) {
			return a.get('__id') == object.id();
		});
		if (!fetchedObjects || fetchedObjects.length == 0) {
			return new Appacitive.Promise().reject();
		} 
		var fetchedObject = fetchedObjects[0];

		fetched = true;
		ok(true, 'Object with id (' + fetchedObject.id() + ') saved and retrieved successfully.');
		
		//Update object
		fetchedObject.set('name', name);
		return fetchedObject.save();
	}).then(function(updatedObject) {
		equal(name, updatedObject.get('name'), 'Value of object in model match after update');
		start();
	}, function() {
		if (object.isNew()) {
			ok(false, 'Could not create object, onError called');
		} else if (!fetched) {
			ok(false, 'Could not fetch object, onError called');
		} else {
			ok(false, 'Could not update object, onError called');
		}
		start();
	});
});


asyncTest('Update object using new appacitive object object', function() {
	var object = new Appacitive.Object('profile');
	var prevName = 'Arathorn' + parseInt(Math.random() * 10000);
	var name = 'Arathorn' + parseInt(Math.random() * 10000);
	object.set('name', prevName);
	
	//Create object
	object.save().then(function() {
		equal(prevName, object.get('name'), 'Value of object in model match after create');
	
		//update object
		var updatedObject = new Appacitive.Object(object.toJSON());
		updatedObject.set('name', name);
		return updatedObject.save();
	}).then(function(updatedObject) {
		equal(name, updatedObject.get('name'), 'Value of object in model match after update');
		start();
	}, function() {
		if (object.isNew()) {
			ok(false, 'Could not create object, onError called');
		} else {
			ok(false, 'Could not update object, onError called');
		}
		start();
	});
});