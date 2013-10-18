(function (global) {

	"use strict";

	global.Appacitive.config = {
		apiBaseUrl: 'https://apis.appacitive.com/'
	};

	if (typeof XDomainRequest != 'undefined') {
		global.Appacitive.config.apiBaseUrl = window.location.protocol + '//apis.appacitive.com/';
	}

}(global));
