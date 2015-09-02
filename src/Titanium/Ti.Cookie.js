(function (global) {

"use strict";

var Appacitive = global.Appacitive;

var cookieManager = function () {

	this.setCookie = function (name, value) {
		Appacitive.localStorage.set(name, value);
	};

	this.readCookie = function (name) {
		return Appacitive.localStorage.get(name);
	};

	this.eraseCookie = function (name) {
		Appacitive.localStorage.remove(name);
	};

};

Appacitive.Cookie = new cookieManager();

})(global);
