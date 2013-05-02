module('Basic Functionality Check');

test("Global object test", function() {
	ok(window.Appacitive, "Global 'Appacitive' object created.");
});

test("Runtime detection test", function() {
	ok(Appacitive.runtime.isBrowser, "Environment (browser) detected successfully.");
});

test('Testing basic GUID generation', function() {
	var numIterations = 10000;
	var hashMap = {};
	var generateAndCheck = function() {
		var guid = new Appacitive.GUID();
		if (hashMap[guid]) {
			ok(false, 'GUID collision for ' + guid + ' and ' + hashMap[guid] + '.');
		}
	};
	var counter = 0;
	while(counter < numIterations) {
		generateAndCheck();
		counter += 1;
	}
	ok(true, counter + ' unique guids generated');
});