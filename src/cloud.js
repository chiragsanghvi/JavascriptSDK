(function (global) {

	"use strict";

	var _cloud = function() {

		var apis = [];

		var registerApi = function() {

			if (arguments.length !== 2) throw "Invalid no. of arguments provided to cloud function declare" ;
			
			if (typeof arguments[0] !== 'string') throw "Error: Provide name fo cloud api" ;
			if (typeof arguments[1] !== 'function') throw "Error: Invalid api function provided for cloud api" ;

			var name = arguments[0];

			var regExp = /^[A-Za-z][A-Za-z_0-9]*$/;
		    if (!regExp.test(name)) {
		    	throw "Error: Invalid name for api function " + name;
		    }

			apis[name.toLowerCase()] = arguments[1];
		};

		this.declare = function() {
			registerApi.apply(null, arguments);			
		};

		this.declare.toString = function() { return "function () { [native code] }"; }

		var executeApi = function() {
			if (arguments.length < 2 || typeof arguments[0] !== 'string' || typeof arguments[1] !== 'object')
				throw new "Error: Invalid list of arguments passed to cloud api" ;

			var name = arguments[0].toLowerCase();

			var request = arguments[1].request;
			var response = arguments[1].response;

			if (typeof apis[name] == 'function') {
				var method = apis[name];
				setTimeout(function() {
					method.apply(null , [request, response]);	
				}, 0);
			} else {
				throw { code: '404', message: "Error: Api with name " + arguments[0] + " doesn't exits" };
			}
		};

		this.execute = function() {
			executeApi.apply(null, arguments);			
		};

		this.execute.toString = function() { return "function () { [native code] }"; }

	};

	global.Appacitive.Cloud = new _cloud();

})(global);
