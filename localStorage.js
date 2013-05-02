(function (global) {

	"use strict";

	var A_LocalStorage = function() {

		var _localStorage = window.localStorage || {};

		this.set = function(key, value) {
			value = value || '';
			if (!key) return false;
			_localStorage[key] = value;
			return true;
		};

		this.get = function(key) {
			return (!key ? null : _localStorage[key] || null);
		};

	};

	global.Appacitive.localStorage = new A_LocalStorage();

})(global);