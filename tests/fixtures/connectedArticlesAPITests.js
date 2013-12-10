module('Connection Query API tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

asyncTest('Verify created connection is fetched when fetching connected objects', function() {
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({type: 'profile', name:'chirag sanghvi'});
	
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

		var existingConnections = objects.filter(function (_c) {
			return _c.connection.id() == conn.id();
		});

		//Verify connection is returned via the getConnectedObjects
		equal(existingConnections.length, 1, 'Connection fetched on calling get connected objects for profile');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connected objects of relation type myschool');
		}
		start();
	});
});

asyncTest('Verify created connection is fetched when fetching connections for an object', function() {
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({type: 'profile', name:'chirag sanghvi'});
	
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

		// fetch connections for profile
		return profile.getConnections({ relation: 'myschool', label: 'school' }).fetch();
	}).then(function(connections) {
		
		var existingConnections = connections.filter(function (_c) {
			return _c.id() == conn.id();
		});

		//Verify connection is returned via the get connections
		equal(existingConnections.length, 1, 'Connection fetched on calling get connections for profile');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connections for object of relation type myschool');
		}
		start();
	});
});

asyncTest('Verify created connection is fetched when fetching connection between two objects', function() {
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({type: 'profile', name:'chirag sanghvi'});
	
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

		//fetch connection between profile and school
		var btwObjectQuery = new Appacitive.Queries.GetConnectionsBetweenObjectsForRelationQuery({ 
			relation: 'myschool',
			objectAId: school.get('__id'), 
			objectBId: profile.get('__id')
		});
		return btwObjectQuery.fetch();
	}).then(function(connection) {
		
		//Verify connection is returned via the getBetweenObjects
		equal(connection.id(), conn.id() , 'Connection fetched between 2 objects');
		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connections between 2 objects of relation type myschool');
		}
		start();
	});
});

asyncTest('Verify object fetched via the collection returned via getConnectedObjects has correct id', function() {
	var school = new Appacitive.Object('school');
	var profile = new Appacitive.Object({type: 'profile', name:'chirag sanghvi'});
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

		var existingObjects = objects.filter(function (_a) {
			return _a.connection.id() == conn.id();
		});

		//Verify connection is returned via the getConnectedObjects
		equal(existingObjects.length, 1, 'Connection fetched on calling get connected objects for profile');

		//Verify object fetched via the objects returned via getConnectedObjects has correct id
		var connectedSchool = existingObjects[0];
		equal(connectedSchool.get('__id'), school.get('__id'), 'Correct connected object returned');

		//Verify object fetched via the objects returned via getConnectedObjects is correct object
		deepEqual(connectedSchool.toJSON(), school.toJSON(), 'Correct connected object returned: ' + JSON.stringify(connectedSchool.getObject()));

		start();
	}, function() {
		if (conn.isNew()) {
			ok(false, 'Could not save connection.');
		} else {
			ok(false, 'Could not fetch connected objects of relation type myschool');
		}
		start();
	});
});
