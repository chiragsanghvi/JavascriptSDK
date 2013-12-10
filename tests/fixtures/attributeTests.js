module('Attribute tests');

test('Verify article::attributes is a function on articles', function() {
	var article = new Appacitive.Article('profile');
	equal(typeof article.attr, 'function', 'article::attributes is a function on articles');
});

test('Verify article::attributes returns blank object for unsaved article', function() {
	var article = new Appacitive.Article('profile');
	var attributes = article.attr();
	deepEqual(attributes, {}, 'article::attributes returns blank object on unsaved article');
});

test('Verify attributes can be set via returned object', function() {
	var article = new Appacitive.Article('profile');
	article.attr().key1 = 'value1';
	equal(article.attr().key1, 'value1', 'attributes can be set via returned object');
});

test('Verify attributes can be set via attributes function', function() {
	var article = new Appacitive.Article('profile');
	article.attr('key1', 'value1');
	equal(article.attr().key1, 'value1', 'attributes can be set via attributes function');
});

test('Verify attributes can be got via returned object', function() {
	var article = new Appacitive.Article('profile');
	article.attr().key1 = 'value1';
	equal(article.attr().key1, 'value1', 'attributes can be got via returned object');
});

test('Verify attributes can be got via attributes function', function() {
	var article = new Appacitive.Article('profile');
	article.attr().key1 = 'value1';
	equal(article.attr('key1'), 'value1', 'attributes can be got via attributes function');
});