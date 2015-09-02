module('Aggregate tests');

test('Verify object::aggregates is a function on objects', function() {
	var object = new Appacitive.Object({ __type: 'object' });
	equal(typeof object.aggregate, 'function', 'object::aggregates is a function on objects');
});

test('Verify object::aggregates returns null for unsaved object', function() {
	var object = new Appacitive.Object({ __type: 'object' });
	var aggregates = object.aggregate();
	deepEqual(aggregates, {}, 'object::aggregates returns blank object on unsaved object');
});