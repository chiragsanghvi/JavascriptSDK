module('Search All Query');
test('Basic search all query for objects', function() {
	var query = new Appacitive.Queries.FindAllQuery({
		type: 'profile'
	});
	var request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=20&pnum=1';

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

	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=20&pnum=1&orderBy=name&isAsc=true';
	equal(url, request.url, 'Url generated has correct sort options - ascending');
	
	query = new Appacitive.Queries.FindAllQuery({
		type: 'profile',
		orderBy: 'name2',
		isAscending: false
	});
	request = query.toRequest();

	url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=20&pnum=1&orderBy=name2&isAsc=false';
	equal(url, request.url, 'Url generated has correct sort options - descending');	
});

test('Basic search all query for objects with pagination', function() {
	var query = new Appacitive.Queries.FindAllQuery({
		type: 'profile',
		pageNumber: 3
	});
	var request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=20&pnum=3';
	equal(url, request.url, 'Url generated has correct pagination options - page number');
	
	query = new Appacitive.Queries.FindAllQuery({
		type: 'profile',
		pageSize: 100
	});
	request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=100&pnum=1';
	equal(url, request.url, 'Url generated has correct pagination options - page size');

	query = new Appacitive.Queries.FindAllQuery({
		type: 'profile',
		pageSize: 100,
		pageNumber: 10
	});
	request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=100&pnum=10';
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

	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=100&pnum=10&orderBy=name&isAsc=false';
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
	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=20&pnum=1'
	url += '&query=some_field == "some_value"';
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
	var url = Appacitive.config.apiBaseUrl + 'object/profile/find/all?psize=100&pnum=2&orderBy=name&isAsc=false'
	url += '&query=some_field2 == "some_value2"';
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

	var newFilter =  Appacitive.Filter.Property('q').lessThan(324233);
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