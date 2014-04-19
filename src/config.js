(function (global) {

	"use strict";

	global.Appacitive.config = {
		apiBaseUrl: 'https://apis.appacitive.com/v1.0/'
	};

	if (global.navigator && (global.navigator.userAgent.indexOf('MSIE 8') != -1 || global.navigator.userAgent.indexOf('MSIE 9') != -1)) {
		global.Appacitive.config.apiBaseUrl = window.location.protocol + '//apis.appacitive.com/v1.0/';
	}

}(global));
