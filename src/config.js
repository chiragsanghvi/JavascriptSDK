(function (global) {

	"use strict";

	global.Appacitive.config = {
		apiBaseUrl: 'https://apis.appacitive.com/v1.0/'
	};

	if (typeof XDomainRequest != 'undefined') {
		global.Appacitive.config.apiBaseUrl = window.location.protocol + '//apis.appacitive.com/v1.0/';
	}

}(global));
