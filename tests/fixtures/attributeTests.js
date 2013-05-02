module('Attribute tests');

test('Verify article::attributes is a function on articles', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	equal(typeof article.attributes, 'function', 'article::attributes is a function on articles');
});

test('Verify article::attributes returns blank object for unsaved article', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	var attributes = article.attributes();
	deepEqual(attributes, {}, 'article::attributes returns blank object on unsaved article');
});

test('Verify attributes can be set via returned object', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	article.attributes().key1 = 'value1';
	equal(article.attributes().key1, 'value1', 'attributes can be set via returned object');
});

test('Verify attributes can be set via attributes function', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	article.attributes('key1', 'value1');
	equal(article.attributes().key1, 'value1', 'attributes can be set via attributes function');
});

test('Verify attributes can be got via returned object', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	article.attributes().key1 = 'value1';
	equal(article.attributes().key1, 'value1', 'attributes can be got via returned object');
});

test('Verify attributes can be got via attributes function', function() {
	var articles = new Appacitive.ArticleCollection({ schema: 'article' });
	var article = articles.createNewArticle();
	article.attributes().key1 = 'value1';
	equal(article.attributes('key1'), 'value1', 'attributes can be got via attributes function');
});