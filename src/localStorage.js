(function (global) {

	"use strict";

	var A_LocalStorage = function() {

		var _localStorage = (global.Appacitive.runtime.isBrowser) ? window.localStorage : {};

		this.set = function(key, value) {
			value = value || '';
			if (!key) return false;

		    if (typeof value == "object") {
		    	try {
			      value = JSON.stringify(value);
			    } catch(e){}
		    }
		    key = global.Appacitive.getAppPrefix(key);

			_localStorage[key] = value;
			return true;
		};

		this.get = function(key) {
			if (!key) return null;

			key = global.Appacitive.getAppPrefix(key);

			var value = _localStorage.getItem(key);
		   	if (!value) { return null; }

		    // assume it is an object that has been stringified
		    if (value[0] == "{") {
		    	try {
			      value = JSON.parse(value);
			    } catch(e){}
		    }

		    return value;
		};
		
		this.remove = function(key) {
			if (!key) return;
			key = global.Appacitive.getAppPrefix(key);
			try { delete _localStorage[key]; } catch(e){}
		}
	};

	global.Appacitive.localStorage = new A_LocalStorage();

})(global);