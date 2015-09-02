module('Attribute tests');

test('Verify object::attributes is a function on objects', function() {
	var object = new Appacitive.Object('profile');
	equal(typeof object.attr, 'function', 'object::attributes is a function on objects');
});

test('Verify object::attributes returns blank object for unsaved object', function() {
	var object = new Appacitive.Object('profile');
	var attributes = object.attr();
	deepEqual(attributes, {}, 'object::attributes returns blank object on unsaved object');
});

test('Verify attributes can be set via returned object', function() {
	var object = new Appacitive.Object('profile');
	object.attr().key1 = 'value1';
	equal(object.attr().key1, 'value1', 'attributes can be set via returned object');
});

test('Verify attributes can be set via attributes function', function() {
	var object = new Appacitive.Object('profile');
	object.attr('key1', 'value1');
	equal(object.attr().key1, 'value1', 'attributes can be set via attributes function');
});

test('Verify attributes can be got via returned object', function() {
	var object = new Appacitive.Object('profile');
	object.attr().key1 = 'value1';
	equal(object.attr().key1, 'value1', 'attributes can be got via returned object');
});

test('Verify attributes can be got via attributes function', function() {
	var object = new Appacitive.Object('profile');
	object.attr().key1 = 'value1';
	equal(object.attr('key1'), 'value1', 'attributes can be got via attributes function');
});