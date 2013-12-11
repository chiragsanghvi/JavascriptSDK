module('Connection API tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

var createUserProfileObjects = function() {
	var promise = new Appacitive.Promise();

	//Create user object
	var user = new Appacitive.User();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	
	//create profile object
	profile = new Appacitive.Object({ __type: 'profile', name:'chirag sanghvi'});
	
	var tasks = [user.save()];
	tasks.push(profile.save());

	var created = false;
	//Parallel create
	Appacitive.Promise.when(tasks).then(function(con) {
		return promise.fulfill(user, profile);
	}, function() {
		if (user.isNew()) {
			ok(false, 'Could not save object of type profile.');
		}
		if (profile.isNew()) {
			ok(false, 'Could not save user object.');
		}
		start();
	});

	return promise;
};

asyncTest('Happy path for create two objects and connect them', function() {
	//Create user and profile objects
	createUserProfileObjects().then(function(user, profile) {
		//create connection between newly created user and profile
		var connectOptions = {
			__endpointa: {
				objectid: profile.id(),
				label: 'profile'
			},
			__endpointb: {
				object: user,
				label: 'user'
			},
			relation: 'userprofile'
		};
		return new Appacitive.Connection(connectOptions).save();
	}).then( function(con) {
		ok(true, 'Connection saved with id ' + con.id());
		start();
	}, function() {
		ok(false, 'Could not create connection.');
		start();
	});

});

asyncTest('Happy path for create connection with two object objects passed in proper api endpoints', function() {
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({ __type: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		__endpointa: {
			object: school,
			label: 'school'
		},
		__endpointb: {
			object: profile,
			label: 'profile'
		},
		relation: 'myschool'
	};

	//create myschool connection
	new Appacitive.Connection(connectOptions).save().then(function(conn) {
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}
		
		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		ok(true, 'Saved connection ');
		start();
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Happy path for create connection with two object objects passed in sdk endpoint objects', function() {
	
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({ __type: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			object: school,
			label: 'school'
		}, {
			object: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	new Appacitive.Connection(connectOptions).save().then(function(conn) {
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}
		
		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		ok(true, 'Saved connection ');
		start();
	}, function() {
		ok(false, 'Could not save connection.');
		start();
	});
});

asyncTest('Happy path to fetch connection using its id', function() {
	
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({ __type: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			object: school,
			label: 'school'
		}, {
			object: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};
   
   	//create myschool connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}

		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		var relSchool = new Appacitive.Connection({__id: conn.get('__id'), relation : 'myschool'});
		
		//fetch connection by its id
		return relSchool.fetch();
	}).then( function(conn) {
		ok(true, 'Connection fetched successfully.');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connection.');
		}
		start();
	});
});

asyncTest('Verify connection update after it is created', function() {
	var connectOptions = {
		__endpointa: {
			object: {
				__type: 'school',
				name: 'Chirag Sanghvi'
			},
			label: 'school'
		},
		__endpointb: {
			object: {
				__type: 'profile'
			},
			label: 'profile'
		},
		year: '2003',
		relation: 'myschool'
	};
	var year = '2005';

	//create myschool connection
	var connection = new Appacitive.Connection(connectOptions);
	connection.save().then(function(conn) {
		equal(conn.get('year'), '2003', 'Connection properly created');
		
		//verify endpoints are populated
		if (conn.endpointA.object && conn.endpointA.object instanceof Appacitive.Object && conn.endpointB.object && conn.endpointB.object instanceof Appacitive.Object) 
			ok(true, 'Object set properly in connection');
		else
			ok(false, 'Object not set in connection');
		
		//update connection
		conn.set('year', year);
		return conn.save();	
	}).then(function(conn) {
		equal(conn.get('year'), year, 'Connection property value changed successfully');
		start();
	}, function() {
		if (connection.created) {
			ok(false, 'Could not update connection.');
		} else {
			ok(false, 'Could not create connection.');
		}
		start();
	});
});

asyncTest('Verify connection update directly', function() {
	
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({ __type: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			object: school,
			label: 'school'
		}, {
			object: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};
	var year = '2005';

	var connection = new Appacitive.Connection(connectOptions)

	connection.save().then(function(conn) {
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}
		
		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		ok(true, 'Saved connection ');

		var relSchool =  new Appacitive.Connection(conn.toJSON());
		relSchool.set('year', year);
		
		return relSchool.save();
	}).then(function(conn) {
		equal(conn.get('year'), year, 'Connection property value changed successfully');
		start();
	}, function() {
		if (connection.isNew()) {
			ok(false, 'Could not create connection.');
		} else {
			ok(false, 'Could not update connection.');
		}
		start();
	});
});

asyncTest('Verify happy path for connection delete', function() {
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({ __type: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			object: school,
			label: 'school'
		}, {
			object: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	//create connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}

		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}
		//delete connection
		return conn.destroy();
	}).then( function() {
		ok(true, 'Connection deleted successfully.');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not delete connection.');
		}
		start();
	});
});

asyncTest('Verify no changeset on object fetched from connectedobjects', function() {
	
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({ __type: 'profile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			object: school,
			label: 'school'
		}, {
			object: profile,
			label: 'profile'
		}],
		relation: 'myschool'
	};

	//create connection
	var conn = new Appacitive.Connection(connectOptions)
	conn.save().then(function(conn) {
		ok(true, 'Saved connection ');
		
		//verify endpoints are populated
		if (!conn.endpoints('school') || school.isNew()) {
			ok(false, 'School properties not reflected in object or not returned');
		}

		if (!conn.endpoints('profile') || profile.isNew()) {
			ok(false, 'profile properties not reflected in object or not returned');
		}

		// fetch connected objects for profile
		return profile.getConnectedObjects({ relation: 'myschool' }).fetch();
	}).then(function(objects) {
		
		//verify objects returned are not changed
		if (objects[0].hasChanged()) {
			ok(false, 'Object has not changed');
		} else {
			ok(true, 'Object has not changed');
		}


		//verify children property
		if (!profile.children['myschool']) {
			ok(false, 'Children property not set in profile');
		} else {
			ok(true, 'Children property set in profile');
		}

		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connected objects.');
		}
		start();
	});
});
