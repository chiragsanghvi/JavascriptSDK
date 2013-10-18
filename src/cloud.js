(function (global) {

	"use strict";

	var _cloud = function() {

		this.apis = [];

		this.declare = function() {
			if (arguments.length !== 2) throw { code: 400, message: "Invalid no. of argument provided to cloud function declare" };
			
			if (typeof arguments[0] != 'string') throw { code: 400, message: "Invalid api name provided to cloud api declare" };
			if (typeof arguments[1] != 'function') throw { coe: 400, message: "Invalid api callback provided to cloud api declare" };

			this.apis.push({ name: arguments[0], method: arguments[1] });
		};

		this.execute = function() {

			if (arguments.length < 2 || typeof arguments[0] != 'string' || typeof arguments[1] != 'object')
				throw new { code: 400, message: "Invalid list of arguments passed to incoke cloud api" };

			var name = arguments[0];

			var api = this.apis.filter(function(a) {
				return (a.name == name);
			});

			var request = arguments[1].request;
			var response = arguments[1].response;

			if (api.length > 0) {
				var method = api[0].method;
				setTimeout(function() {
					method.apply(null , [request, response]);	
				}, 0);
			} else {
				throw { code: '404', message: "Api with name " + arguments[0] + " doesn't exits" };
			}
		};

	};

	global.Appacitive.Cloud = new _cloud();

})(global);
