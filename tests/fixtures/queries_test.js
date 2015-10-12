module('Search All Query');
test('Basic search all query for objects', function() {
    var query = new Appacitive.Queries.FindAllQuery({
        type: 'profile'
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=1';

    equal(url, request.url, 'Request url generated is ok');
    equal('get', request.method.toLowerCase(), 'Request method is ok');
});

test('Basic search all query for objects with sorting', function() {
    var query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        orderBy: 'name',
        isAscending: true
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=1&orderBy=name asc';
    equal(url, request.url, 'Url generated has correct sort options - ascending');

    query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        orderBy: 'name2',
        isAscending: false
    });
    request = query.toRequest();

    url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=1&orderBy=name2 desc';
    equal(url, request.url, 'Url generated has correct sort options - descending');
});

test('Basic search all query for objects with pagination', function() {
    var query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        pageNumber: 3
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=3';
    equal(url, request.url, 'Url generated has correct pagination options - page number');

    query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        pageSize: 100
    });
    request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=1&psize=100';
    equal(url, request.url, 'Url generated has correct pagination options - page size');

    query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        pageSize: 100,
        pageNumber: 10
    });
    request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=10&psize=100';
    equal(url, request.url, 'Url generated has correct pagination options - page size & page number');
});

test('Basic search all query with sorting and pagination', function() {
    var query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        pageSize: 100,
        pageNumber: 10,
        orderBy: 'name',
        isAscending: false
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=10&psize=100&orderBy=name desc';
    equal(url, request.url, 'Url generated has correct pagination and sorting options');
});

module('Filtered Query');

// basic properties search 
test('Verify basic filtered search query', function() {
    var options = {
        type: 'profile',
        filter: 'some_field == "some_value"'
    };
    var filteredQuery = new Appacitive.Queries.FindAllQuery(options);
    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=1'
    url += '&query=' + encodeURIComponent('some_field == "some_value"');
    equal(filteredQuery.toRequest().url, url, 'Url formation correct in basic filtered query');
});

test('Verify customized filtered search query', function() {
    var options = {
        type: 'profile',
        pageNumber: 2,
        pageSize: 100,
        orderBy: 'name',
        isAscending: false,
        filter: 'some_field2 == "some_value2"'
    };
    var filteredQuery = new Appacitive.Queries.FindAllQuery(options);
    var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?pnum=2&psize=100&orderBy=name desc'
    url += '&query=' + encodeURIComponent('some_field2 == "some_value2"');
    equal(filteredQuery.toRequest().url, url, 'Url formation correct in customized filtered query');
});

test('Verify filter modification using setFilter in query', function() {
    var options = {
        type: 'profile',
        filter: Appacitive.Filter.Property('q').withinCircle(new Appacitive.GeoCoord(1, 2), 3, 'km')
    };
    var query = new Appacitive.Queries.FindAllQuery(options);

    options = {
        type: 'profile',
        filter: Appacitive.Filter.Property('q').lessThan(1234567890)
    };

    var updatedQuery = new Appacitive.Queries.FindAllQuery(options);
    query.filter(Appacitive.Filter.Property('q').lessThan(1234567890));
    deepEqual(updatedQuery, query, 'Filtered query modification correctly done in objectCollection.');
});

test('Verify filter and freetxt query modification using filter and freeText in objectCollection', function() {
    var query = new Appacitive.Queries.FindAllQuery({
        type: 'profile',
        pageNumber: 3,
        pageSize: 50,
        orderBy: 'name',
        isAscending: false,
        filter: Appacitive.Filter.Property('q').lessThan(3),
        freeText: 'test'
    });

    var newFilter = Appacitive.Filter.Property('q').lessThan(324233);
    query.filter(newFilter);
    if (query.filter().toString() == newFilter.toString()) {
        ok(true, 'Filter has changed');
    } else {
        ok(false, 'Filter didn\'t change');
    }

    query.freeText('newtest');
    if (query.freeText() == 'newtest') {
        ok(true, 'freeText has changed');
    } else {
        ok(false, 'freeText didn\'t change');
    }
});

var createUser = function() {
    var promise = new Appacitive.Promise();
    var user = testConstants.user;
    user.username = 'DeepClone #' + parseInt(Math.random() * 10000);
    Appacitive.Users.createUser(user).then(function(user) {
        promise.fulfill(user);
        start();
    }, function(d) {
        promise.reject(d);
    });
};

test('Filter query without objects', function() {
    var query = new Appacitive.Queries.GraphQuery({
        returnObjects: true,
        name: 'users'
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/graphquery?';

    equal(url, request.url, 'Request url generated is ok');
    equal('post', request.method.toLowerCase(), 'Request method is ok');
});


test('Filter query for objects', function() {
    var query = new Appacitive.Queries.GraphQuery('users');
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/filter?';

    equal(url, request.url, 'Request url generated is ok');
    equal('post', request.method.toLowerCase(), 'Request method is ok');
});

test('Filter query for objects with sorting', function() {
    var query = new Appacitive.Queries.GraphQuery({
        returnObjects: true,
        name: 'users',
        orderBy: 'name',
        isAscending: true
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/graphquery?orderBy=name asc';
    equal(url, request.url, 'Url generated has correct sort options - ascending');

    query = new Appacitive.Queries.GraphQuery({
        returnObjects: false,
        name: 'users',
        orderBy: 'name',
        isAscending: false
    });
    request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/filter?orderBy=name desc';
    equal(url, request.url, 'Url generated has correct sort options - descending');
});

test('Filter query for objects with pagination', function() {
    var query = new Appacitive.Queries.GraphQuery({
        returnObjects: true,
        name: 'users',
        pageNumber: 3
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/graphquery?pnum=3';
    equal(url, request.url, 'Url generated has correct pagination options - page number');

    query = new Appacitive.Queries.GraphQuery({
        returnObjects: false,
        name: 'users',
        pageSize: 100
    });
    request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/filter?pnum=1&psize=100';
    equal(url, request.url, 'Url generated has correct pagination options - page size');

    query = new Appacitive.Queries.GraphQuery({
        returnObjects: true,
        name: 'users',
        pageSize: 100,
        pageNumber: 10
    });
    request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/graphquery?pnum=10&psize=100';
    equal(url, request.url, 'Url generated has correct pagination options - page size & page number');
});

test('Filter query with sorting and pagination', function() {
    var query = new Appacitive.Queries.GraphQuery({
        returnObjects: true,
        name: 'users',
        pageSize: 100,
        pageNumber: 10,
        orderBy: 'name',
        isAscending: true,
        descending: 'age',
        fields: ['firstname', 'username']
    });
    var request = query.toRequest();

    var url = Appacitive.config.apiBaseUrl + 'search/users/graphquery?pnum=10&psize=100&orderBy=name asc,age desc&fields=firstname,username';
    equal(url, request.url, 'Url generated has correct pagination and sorting options');
});

asyncTest('Verify filter query works without pagination, and returns only ids', function() {
    //logout current user
    Appacitive.Users.logout(null, true);

    var total = 0;

    //Authenticate current user
    Appacitive.Users.login('chiragsanghvi', 'test123!@#').then(function(data) {
        return createUser();
    }).then(function() {
        //Fetch all users except admin user
        var query = new Appacitive.Queries.GraphQuery('users', {
            filter: Appacitive.Filter.Property('__utcdatecreated').greaterThan(Appacitive.User.current().createdAt).toString()
        });
        return query.fetch();
    }).then(function(ids, pi) {
        if ((ids.length > 0) && (typeof ids[0] == 'string')) ok(true, 'All userIds Fetched ');
        else ok(false, 'UserIds not returned');

        start();
    }, function(data) {
        if (!Appacitive.Users.current()) {
            ok(false, 'User authentication failed: ' + JSON.stringify(data));
        } else {
            ok(false, 'Could not fetch ids for type user');
        }
        start();
    });

});


asyncTest('Verify filter query works with pagination, and returns only objects', function() {
    //logout current user
    Appacitive.Users.logout(null, true);

    var total = 0,
        query;

    //Authenticate current user
    Appacitive.Users.login('chiragsanghvi', 'test123!@#').then(function() {
        return createUser();
    }).then(function(data) {
        //Fetch all users except admin user
        query = new Appacitive.Queries.GraphQuery({
            name: 'users',
            returnObjects: true,
            placeholders: {
                filter: Appacitive.Filter.Property('__utcdatecreated').greaterThan(Appacitive.User.current().createdAt).toString()
            },
            fields: ['username', 'firstname']
        });
        return query.fetch();
    }).then(function(users) {
        if ((users.length > 0) && (users[0] instanceof Appacitive.Object)) ok(true, 'User objects Fetched ');
        else ok(false, 'UserIds returned');

        return query.fetchNext();
    }).then(function(users) {
        if (users.pageNumber == 2) ok(true, 'User objects Fetched after changing the pagenumber');
        else ok(false, 'Wrong pagenumber found');
        start();
    }, function(data) {
        if (!Appacitive.Users.current()) {
            ok(false, 'User authentication failed: ' + JSON.stringify(data));
        } else {
            ok(false, 'Could not fetch users');
        }
        start();
    });

});
