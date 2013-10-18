(function (global) {

"use strict";

var cookieManager = function () {

	this.setCookie = function (name, value) {
		global.Appacitive.localStorage.set(name, value);
	};

	this.readCookie = function (name) {
		return global.Appacitive.localStorage.get(name);
	};

	this.eraseCookie = function (name) {
		global.Appacitive.localStorage.remove(name);
	};

};

global.Appacitive.Cookie = new cookieManager();

})(global);
