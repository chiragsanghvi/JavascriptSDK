module('Aggregate tests');

test('Verify article::aggregates is a function on articles', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	equal(typeof article.aggregates, 'function', 'article::aggregates is a function on articles');
});

test('Verify article::aggregates returns null for unsaved article', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	var aggregates = article.aggregates();
	deepEqual(aggregates, {}, 'article::aggregates returns blank object on unsaved article');
});

test('Verify aggregates can not be set via returned object', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle({ $aggregate1: 12345 });
	article.aggregates().$aggregate1 = 'value1';
	ok(article.aggregates().$aggregate1 == 12345, 'aggregates can not be set via returned object');

	article = articles.createNewArticle();
	article.aggregates().$aggregate1 = 'value1';
	ok(article.aggregates().$aggregate1 == undefined, 'aggregates can not be set via returned object');
});

test('Verify aggregates can not be set via aggregates function', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	try {
		article.aggregates('key1', 'value1');
		ok(false, 'Aggregate value changed.');
	} catch (e) {
		ok(true, 'Aggregate update failed with message: ' + (e || {}).message || 'No error message');
	}
});

test('Verify aggregates can be got via returned object', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle({ $aggregate1: 12345 });
	equal(article.aggregates().$aggregate1, 12345, 'aggregates can be got via returned object');
});

test('Verify aggregates can be got via aggregates function', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle({ $aggregate1: 12345 });
	equal(article.aggregates('$aggregate1'), 12345, 'aggregates can be got via aggregates function');
});