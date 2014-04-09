module('Group Tests');

asyncTest('Creating session with valid Apikey', function() {
	Appacitive.Session.resetSession();
	Appacitive.Session.removeUserAuthHeader();
	Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
	ok(true, 'Session created successfully.');
	start();
});

var createUser = function() {
	var user = testConstants.user;
	user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
	return Appacitive.Users.createUser(user);
};

var createMutipleUsers = function() {

	var promise = new Appacitive.Promise();

	var promises = [];
	promises.push(createUser());
	promises.push(createUser());
	promises.push(createUser());

	

	Appacitive.Promise.when(promises).then(function(users) {
		if (users.length > 0) promise.fulfill(users);
	}, function(reasons, values) {
		var users = [];
		values.forEach(function(u) {
			if(u && !u.isNew()) users.push(u);
		});

		if (users.length > 0) promise.fulfill(users);
		else promise.reject({message : 'couldn\'t create users'});
	});


	return promise;
};

asyncTest('Add and Remove members in a group', function() {

	var users = [];

	createMutipleUsers().then(function(usrs) {
		users = usrs;
		return Appacitive.Group.addMembers('aclusergroup1', users);
	}).then( function() {
		ok(true, 'successfully added new users to group');
		return Appacitive.Group.addMembers('aclusergroup1', 'acluser1');
	}).then(function() {
		ok(true, 'successfully added existing users to group');
		return Appacitive.Group.removeMembers('aclusergroup1', users);
	}).then( function() {
		ok(true, 'successfully removed new users from group');
		return Appacitive.Group.removeMembers('aclusergroup1', 'acluser1');
	}).then( function() {
		ok(true, 'successfully removed existing user from group');
		start();
	}, function(status) {
		ok(false, status.message);
		start();
	});

});
