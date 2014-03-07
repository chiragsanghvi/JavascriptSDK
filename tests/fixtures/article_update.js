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

asyncTest('Update object, save and verify value', function() {
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
			type: 'profile',
			orderBy: '__utclastupdateddate'
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


asyncTest('Update object using new appacitive object', function() {
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

asyncTest('Update multivalued property with just adding items', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.add('docvisits',[10 , 20]);

	ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property same as added');

	x.save().then(function() {
		ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated after create');

		x.add('docvisits', 30);

		ok(x.get('docvisits').equals(["10","20","30"]), 'Multivalued property updated with add');
		
		x.save().then(function() {
			ok(x.get('docvisits').equals(["10","20","30"]), 'Multivalued property updated after adding item');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});
});

asyncTest('Update multivalued property with first setting value and then adding items', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.set('docvisits', [20]);
	x.add('docvisits',[10]);

	ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property same as set and add');

	x.save().then(function() {
		ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated after create');

		x.set('docvisits', [30]);
		x.add('docvisits', 30);

		ok(x.get('docvisits').equals(["30","30"]), 'Multivalued property updated with set and add');
		
		x.save().then(function() {
			ok(x.get('docvisits').equals(["30","30"]), 'Multivalued property updated after setting and adding item');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});
});

asyncTest('Update multivalued property with just adding unique items', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.addUnique('docvisits',[10 , 20]);

	ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property same as added unqiuely');

	x.save().then(function() {
		ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated unqiuely after create');

		x.addUnique('docvisits', 20);

		ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated unqiuely with add');
		
		x.save().then(function() {
			ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated unqiuely after adding item');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});
});

asyncTest('Update multivalued property with first adding item, saving it and then removing them', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.add('docvisits',[10 , 20]);

	ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property same as added');

	x.save().then(function() {
		ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated after create');

		x.remove('docvisits', 20);
		x.remove('docvisits', 30);

		ok(x.get('docvisits').equals(["10"]), 'Multivalued property updated with remove');
		
		x.save().then(function() {
			ok(x.get('docvisits').equals(["10"]), 'Multivalued property updated after removing item');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});
});


asyncTest('Update multivalued property with adding normal and unique items and removing items', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.add('docvisits', 10);

	x.addUnique('docvisits', 20);

	ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property same as added unqiuely');

	x.save().then(function() {
		ok(x.get('docvisits').equals(["10","20"]), 'Multivalued property updated unqiuely after create');

		x.add('docvisits', 10);

		x.remove('docvisits', 20);
		x.remove('docvisits', 30);

		ok(x.get('docvisits').equals(["10","10"]), 'Multivalued property updated with remove');
		
		x.save().then(function() {
			ok(x.get('docvisits').equals(["10","10"]), 'Multivalued property updated after removing item');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});
});

asyncTest('Update atomic property by first creating and then incrementing it', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.set('score', 10)
	 .increment('score')

	equal(x.get('score'), '11', 'Atomic property set properly after incrementing');

	x.save().then(function() {	

		equal(x.get('score'), '11', 'Atomic property set properly after create');

		x.increment('score', 11);

		equal(x.get('score'), "22", 'Atomic property incremenented properly');

		x.save().then(function() {
			equal(x.get('score'), "22", 'Atomic property incremenented properly after update');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});

});

asyncTest('Update atomic property by first incrementing it and then setting it, and then again incrementing it', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.increment('score')

	equal(x.get('score'), '1', 'Atomic property set properly after incrementing');

	x.save().then(function() {	

		equal(x.get('score'), '1', 'Atomic property set properly after create');

		x.set('score', 11)
		  .increment('score', 20);

		equal(x.get('score'), "31", 'Atomic property incremenented properly');

		x.decrement('score', 6);

		equal(x.get('score'), "25", 'Atomic property decremenented properly');

		x.save().then(function() {
			equal(x.get('score'), "25", 'Atomic property decremenented properly after update');
			start();
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});

});

asyncTest('Update atomic property by first incrementing it and then setting it and save, and then again incrementing it', function() {
	var Profile = Appacitive.Object.extend('profile');
	var x = new Profile();

	x.increment('score')

	equal(x.get('score'), '1', 'Atomic property set properly after incrementing');

	x.save().then(function() {	

		equal(x.get('score'), '1', 'Atomic property set properly after create');

		x.set('score', 11)
		  .increment('score', 20);

		equal(x.get('score'), "31", 'Atomic property incremenented properly');

		x.decrement('score', 6);

		equal(x.get('score'), "25", 'Atomic property decremenented properly');

		x.save().then(function() {
			equal(x.get('score'), "25", 'Atomic property decremenented properly after update');

			var d = x.clone();
			
			d.increment('score', 5);

			equal(d.get('score'), "30", 'Atomic property incremenented properly in other object');

			d.save().then(function() {
				equal(d.get('score'), "30", 'Atomic property incremenented properly in other object after save');
				start();
			}, function() {
				ok(false, 'Could not update other object, onError called');
				start();
			})
		}, function() {
			ok(false, 'Could not update object, onError called');
			start();
		});
	}, function() {
		ok(false, 'Could not create object, onError called');
		start();
	});

});
