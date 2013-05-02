module('Search All Query');
test('Basic search all query for articles', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile'
	});
	var request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=200&pnum=1&orderBy=__UtcLastUpdatedDate&isAsc=false';

	equal(url, request.url, 'Request url generated is ok');
	equal('get', request.method.toLowerCase(), 'Request method is ok');
});

test('Basic search all query for articles with sorting', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		orderBy: 'name',
		isAscending: true
	});
	var request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=200&pnum=1&orderBy=name&isAsc=true';
	equal(url, request.url, 'Url generated has correct sort options - ascending');
	
	query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		orderBy: 'name2',
		isAscending: false
	});
	request = query.toRequest();

	url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=200&pnum=1&orderBy=name2&isAsc=false';
	equal(url, request.url, 'Url generated has correct sort options - descending');	
});

test('Basic search all query for articles with pagination', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		pageNumber: 3
	});
	var request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=200&pnum=3&orderBy=__UtcLastUpdatedDate&isAsc=false';
	equal(url, request.url, 'Url generated has correct pagination options - page number');
	
	query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		pageSize: 100
	});
	request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=100&pnum=1&orderBy=__UtcLastUpdatedDate&isAsc=false';
	equal(url, request.url, 'Url generated has correct pagination options - page size');

	query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		pageSize: 100,
		pageNumber: 10
	});
	request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=100&pnum=10&orderBy=__UtcLastUpdatedDate&isAsc=false';
	equal(url, request.url, 'Url generated has correct pagination options - page size & page number');
});

test('Basic search all query with sorting and pagination', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		pageSize: 100,
		pageNumber: 10,
		orderBy: 'name',
		isAscending: false
	});
	var request = query.toRequest();

	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=100&pnum=10&orderBy=name&isAsc=false';
	equal(url, request.url, 'Url generated has correct pagination and sorting options');
});


// check query with articleCollection.setQuery
test('Verify default basic search all query in article collection', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile'
	});
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Default query setting correctly in article collection.');
});

test('Verify custom search all query in article collection', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		pageNumber: 3,
		pageSize: 50,
		orderBy: 'name',
		isAscending: false
	});
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Custom query setting correctly in article collection.');
});

test('Verify query modification using setOptions in articleCollection', function() {
	var options = {
		type: 'article',
		schema: 'profile'
	};
	var query = new Appacitive.queries.SearchAllQuery(options);
	var collection = new Appacitive.ArticleCollection(options);
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Default query setting correctly in articleCollection.');

	options = {
		type: 'article',
		schema: 'profile',
		pageNumber: 1,
		pageSize: 200,
		orderBy: '__UtcLastUpdatedDate',
		isAscending: true
	};
	query = new Appacitive.queries.SearchAllQuery(options);
	collection.setOptions(options);
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Query modification correctly done in articleCollection.');
});


module('Filtered Query');
// basic properties search 
test('Verify basic filtered search query', function() {
	var options = {
		type: 'article',
		schema: 'profile',
		filter: 'some_field == "some_value"'
	};
	var filteredQuery = new Appacitive.queries.BasicFilterQuery(options);
	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=200&pnum=1&orderBy=__UtcLastUpdatedDate&isAsc=false'
	url += '&query=some_field == "some_value"';
	equal(filteredQuery.toRequest().url, url, 'Url formation correct in basic filtered query');
});

test('Verify customized filtered search query', function() {
	var options = {
		type: 'article',
		schema: 'profile',
		pageNumber: 2,
		pageSize: 100,
		orderBy: 'name',
		isAscending: false,
		filter: 'some_field2 == "some_value2"'
	};
	var filteredQuery = new Appacitive.queries.BasicFilterQuery(options);
	var url = Appacitive.config.apiBaseUrl + 'article.svc/profile/find/all?psize=100&pnum=2&orderBy=name&isAsc=false'
	url += '&query=some_field2 == "some_value2"';
	equal(filteredQuery.toRequest().url, url, 'Url formation correct in customized filtered query');
});


// properties search with article collection
// check query with articleCollection.setQuery
test('Verify default filtered search all query in article collection', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		filter: 'a=b'
	});
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Default filtered query setting correctly in article collection.');
});

test('Verify custom filtered query in article collection', function() {
	var query = new Appacitive.queries.SearchAllQuery({
		type: 'article',
		schema: 'profile',
		pageNumber: 3,
		pageSize: 50,
		orderBy: 'name',
		isAscending: false,
		filter: 'c>3'
	});
	var collection = new Appacitive.ArticleCollection({ schema: 'profile' });
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Custom filtered query setting correctly in article collection.');
});

test('Verify filtered query modification using setOptions in articleCollection', function() {
	var options = {
		type: 'article',
		schema: 'profile',
		filter: 'q within_circle (1,2,3km)'
	};
	var query = new Appacitive.queries.SearchAllQuery(options);
	var collection = new Appacitive.ArticleCollection(options);
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Default filtered query setting correctly in articleCollection.');

	options = {
		type: 'article',
		schema: 'profile',
		pageNumber: 1,
		pageSize: 200,
		orderBy: '__UtcLastUpdatedDate',
		isAscending: true,
		filter: 'q < 1234567890'
	};
	query = new Appacitive.queries.SearchAllQuery(options);
	collection.setOptions(options);
	var collectionQuery = collection.getQuery();
	deepEqual(query, collectionQuery, 'Filtered query modification correctly done in articleCollection.');
});

test('Verify filtered query orderBy in ArticleCollection', function() {
	var models = new Appacitive.ArticleCollection({ schema: 'profile' });
	models.setFilter('somep == somev');
	models.getQuery().extendOptions({ orderBy: 'orderByField' });
	var qUrl = models.getQuery().toRequest().url;
	equal(qUrl.indexOf('orderByField') != -1, true, 'orderBy sets properly, url: ' + qUrl);
})