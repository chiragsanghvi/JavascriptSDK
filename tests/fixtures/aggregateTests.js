module('Aggregate tests');

test('Verify article::aggregates is a function on articles', function() {
	var article = new Appacitive.Article({ schema: 'article' });
	equal(typeof article.aggregate, 'function', 'article::aggregates is a function on articles');
});

test('Verify article::aggregates returns null for unsaved article', function() {
	var article = new Appacitive.Article({ schema: 'article' });
	var aggregates = article.aggregate();
	deepEqual(aggregates, {}, 'article::aggregates returns blank object on unsaved article');
});