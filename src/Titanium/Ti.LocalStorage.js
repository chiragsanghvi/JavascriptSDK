(function (global) {

	"use strict";

	var Appacitive = global.Appacitive;

	var A_LocalStorage = function() {

		var _localStorage = Ti.App.Properties;

		this.set = function(key, value) {
			value = value || '';
			if (!key) return false;

		    if (typeof value === "object") {
		    	try {
			      value = JSON.stringify(value);
			    } catch(e){}
		    }
		    key = Appacitive.getAppPrefix(key);

			_localStorage.setString(key, value);
			return this;
		};

		this.get = function(key) {
			if (!key) return null;

			key = Appacitive.getAppPrefix(key);

			var value = _localStorage.getString(key);
		   	if (!value) { return null; }

		    // assume it is an object that has been stringified
		    if (value[0] === "{") {
		    	try {
			      value = JSON.parse(value);
			    } catch(e){}
		    }

		    return value;
		};
		
		this.remove = function(key) {
			if (!key) return;
			key = Appacitive.getAppPrefix(key);
			try { _localStorage.removeProperty(key); } catch(e){}
		};
	};

	Appacitive.localStorage = new A_LocalStorage();

})(global);
