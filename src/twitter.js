(function (global) {

	"use strict";

	var A_Twitter = function() {

		var _accessToken = null, _accessTokenSecret = null;

		this.__defineSetter__('accessToken', function(v) {
			_accessToken = v;
		});

		this.__defineSetter__('accessTokenSecret', function(v) {
			_accessTokenSecret = v;
		});

	};

	global.Appacitive.twitter = new A_Twitter();

})(global);