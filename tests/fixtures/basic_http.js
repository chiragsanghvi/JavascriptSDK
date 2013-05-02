
var url = 'https://apis.appacitive.com/article/1/1';
var putUrl = 'https://apis.appacitive.com/article/1';



var basic_http_tests = function() {
	return;
	asyncTest('HTTP GET - ' + url, function() {
		var req1 = new Appacitive.HttpRequest();
		req1.url = url;
		req1.method = 'get';
		req1.onSuccess = function(response) {
			equal(true, true, 'HTTP GET - ' + url + ' successfull.');
			start();
		}
		req1.onError = function() {
			equal(false, true, 'HTTP GET - ' + url + ' failed.');				
			start();
		}
		Appacitive.http.send(req1);
	});

	asyncTest('HTTP POST - ' + url, function() {
		var req1 = new Appacitive.HttpRequest();
		req1.url = url;
		req1.method = 'post';
		req1.onSuccess = function(response) {
			equal(true, true, 'HTTP POST - ' + url + ' successfull.');
			start();
		}
		req1.onError = function() {
			equal(false, true, 'HTTP POST - ' + url + ' failed.');				
			start();
		}
		Appacitive.http.send(req1);
	});

	asyncTest('HTTP PUT - ' + putUrl, function() {
		var req1 = new Appacitive.HttpRequest();
		req1.url = putUrl;
		req1.method = 'put';
		req1.onSuccess = function(response) {
			equal(true, true, 'HTTP PUT - ' + putUrl + ' successfull.');
			start();
		}
		req1.onError = function() {
			equal(false, true, 'HTTP PUT - ' + putUrl + ' failed.');				
			start();
		}
		Appacitive.http.send(req1);
	});

	asyncTest('HTTP DELETE - ' + url, function() {
		var req1 = new Appacitive.HttpRequest();
		req1.url = url;
		req1.method = 'delete';
		req1.onSuccess = function(response) {
			equal(true, true, 'HTTP DELETE - ' + url + ' successfull.');
			start();
		}
		req1.onError = function() {
			equal(false, true, 'HTTP DELETE - ' + url + ' failed.');				
			start();
		}
		Appacitive.http.send(req1);
	});

	asyncTest('onError callback test', function() {
		var r = new Appacitive.HttpRequest();
		r.url = 'http://www.zzzz.iii';
		r.onSuccess = function() {
			ok(false, 'onSuccess called for 404 url');
			start();
		}
		r.onError = function() {
			ok(true, 'onError called as expected for 404 url');
			start();
		}
		Appacitive.http.send(r);
	})
}

basic_http_tests();
