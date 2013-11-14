module('Connection API tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

var createUserProfileArticles = function() {
	var promise = new Appacitive.Promise();

	//Create user article
	var user = new Appacitive.User();
	user.set('username', 'DeepClone #' + parseInt(Math.random() * 10000));
	testConstants.populateDefaultUserFields(user);
	
	//create profile article
	profile = new Appacitive.Article({ schema: 'profile', name:'chirag sanghvi'});
	
	var tasks = [user.save()];
	tasks.push(profile.save());

	var created = false;
	//Parallel create
	Appacitive.Promise.when(tasks).then(function(con) {
		return promise.fulfill(user, profile);
	}, function() {
		if (user.isNew()) {
			ok(false, 'Could not save article of type profile.');
		}
		if (profile.isNew()) {
			ok(false, 'Could not save user article.');
		}
		start();
	});

	return promise;
};

asyncTest('Happy path for create two articles and connect them', function() {
	//Create user and profile articles
	createUserProfileArticles().then(function(user, profile) {
		//create connection between newly created user and profile
		var connectOptions = {
			__endpointa: {
				articleid: profile.id(),
				label: 'profile'
			},
			__endpointb: {
				article: user,
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

asyncTest('Happy path for create connection with two article objects passed in proper api endpoints', function() {
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		__endpointa: {
			article: school,
			label: 'school'
		},
		__endpointb: {
			article: profile,
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

asyncTest('Happy path for create connection with two article objects passed in sdk endpoint objects', function() {
	
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
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
	
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
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
			article: {
				__schematype: 'school',
				name: 'Chirag Sanghvi'
			},
			label: 'school'
		},
		__endpointb: {
			article: {
				__schematype: 'profile'
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
		if (conn.endpointA.article && conn.endpointA.article instanceof Appacitive.Article && conn.endpointB.article && conn.endpointB.article instanceof Appacitive.Article) 
			ok(true, 'Article set properly in connection');
		else
			ok(false, 'Article not set in connection');
		
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
	
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
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
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'prodile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
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

asyncTest('Verify no changeset on article fetched from connectedarticles', function() {
	
	var school = new Appacitive.Article('school');
	var profile = new Appacitive.Article({schema: 'profile', name:'chirag sanghvi'});
	
	var connectOptions = {
		endpoints: [{
			article: school,
			label: 'school'
		}, {
			article: profile,
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

		// fetch connected articles for profile
		return profile.getConnectedArticles({ relation: 'myschool' }).fetch();
	}).then(function(articles) {
		
		//verify articles returned are not changed
		if (articles[0].hasChanged()) {
			ok(false, 'Article has not changed');
		} else {
			ok(true, 'Article has not changed');
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
			ok(false, 'Could not fetch connected articles.');
		}
		start();
	});
});
