module('Test Cleanup');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	ok(true, 'Session created successfully.');
	start();
});


asyncTest('Cleaning up objects of type user by fetching them using "users" filter query and then deleting them one at a time', function() {
	//logout current user
	Appacitive.Users.logout(null, true);

	var total = 0;

	//Authenticate current user
    Appacitive.Users.login('chiragsanghvi', 'test123!@#').then(function(data) {
    	//Fetch all users except admin user
    	var query = new Appacitive.Queries.GraphFilterQuery('users');
    	return query.fetch();
    }).then(function(ids) {
    	total = ids.length;
		if (total === 0) {
    		ok(true, 'No users to delete');
			return Appacitive.Promise().fulfill();
    	}

    	var tasks = [];
    	ids.forEach(function(id) {
    		tasks.push(new Appacitive.User({ __id: id }).destroy(true));
    	});
    	return Appacitive.Promise.when(tasks);
    }).then(function() {
    	ok(true, 'All users to deleted');
    	start();
    }, function(data) {
    	if (!Appacitive.Users.current()) {
    		ok(false, 'User authentication failed: ' + JSON.stringify(data));
    	} else if (total === 0) {
    		ok(false, 'Could not fetch objects for type user');
    	} else {
    		var numFailures = 0;
			data.forEach(function(v) { if (v) ++numFailures; });
			ok(false, 'Object delete failed for ' + numFailures + '/' + total +' objects');
    	}
    	start();
    });
	
});

asyncTest('Cleaning up objects of type school', function() {
	var query = new Appacitive.Object.findAll({ type: 'school', pageSize: 200 });
	var total = 0, tasks = [];
	query.fetch().then(function(objects) {
		total = objects.length;
		
		if (objects.length == 0) {
			ok(true, 'No objects to delete');
			return Appacitive.Promise().fulfill();
		} else {
			objects.forEach(function (object) {
				tasks.push(object.destroy(true));
			});
			return Appacitive.Promise.when(tasks);
		}
	}).then (function() {
		ok(true, total + ' objects of type school deleted successfully');
		start();
	}, function(reasons, values) {
		if (tasks.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });
			ok(false, deleted + ' of ' + total + ' objects of school deleted.');
		} else {
			ok(false, 'Could not fetch objects for type school');
		}
		start();
	});
});


asyncTest('Cleaning up connections of relation myschool', function() {
	var query = new Appacitive.Connection.findAll({ relation: 'myschool', pageSize: 200 });
	var total = 0, tasks = [];
	
	query.fetch().then(function(connections) {
		total = connections.length;
		
		if (connections.length == 0) {
			ok(true, 'No connections to delete');
			return Appacitive.Promise().fulfill();
		} else {
			connections.forEach(function (con) {
				tasks.push(con.destroy());
			});
			return Appacitive.Promise.when(tasks);
		}
	}).then (function() {
		ok(true, total + ' connections of type myschool deleted successfully');
		start();
	}, function(reasons, values) {
		if (tasks.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });

			ok(false, deleted + ' of ' + total + ' connections of myschool deleted.');
		} else {
			ok(false, 'Could not fetch connections for relation myschool');
		}
		start();
	});
});

asyncTest('Cleaning up connections of relation userprofile using multiDelete', function() {

	var query = new Appacitive.Connection.findAll({ relation: 'userprofile', pageSize: 200 });
	var total = 0, ids = [];
	
	query.fetch().then(function(connections) {
		total = connections.length;
		
		if (connections.length == 0) {
			ok(true, 'No connections to delete');
			return Appacitive.Promise().fulfill();
		} else {
			connections.forEach(function (con) {
				ids.push(con.id());
			});
			return Appacitive.Connection.multiDelete({
				relation: 'userprofile',
				ids: ids
			});
		}
	}).then (function() {
		ok(true, total + ' connections of type userprofile deleted successfully');
		start();
	}, function(reasons, values) {
		if (ids.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });
			ok(false, deleted + ' of ' + total + ' connections of userprofile.');
		} else {
			ok(false, 'Could not fetch connections for relation userprofile');
		}
		start();
	});
});


asyncTest('Cleaning up objects of type profile using multidelete', function() {

	var query = new Appacitive.Object.findAll({ type: 'profile', pageSize: 200 });
	var total = 0, ids = [];
	
	//Fetch all profile objects
	query.fetch().then(function(objects) {
		total = objects.length;
		
		if (objects.length == 0) {
			ok(true, 'No objects to delete');
			return Appacitive.Promise().fulfill();
		} else {
			objects.forEach(function (object) {
				ids.push(object.id());
			});
			//Multidelete them
			return Appacitive.Object.multiDelete({
				type: 'profile',
				ids: ids
			});
		}
	}).then (function() {
		ok(true, total + ' objects of type profile deleted successfully');
		start();
	}, function(reasons, values) {
		if (ids.length > 0) {
			var deleted = 0;
			values.forEach(function(v) { if (v) ++deleted; });
			ok(false, deleted + ' of ' + total + ' objects of profile.');
		} else {
			ok(false, 'Could not fetch objects for type profile');
		}
		start();
	});
});

