// creates the skeleton of the object
// in the global context object
// in a browser, its going to be the 'window' object
// when in node.js, it's going to be the 'process' object

var global;
if (typeof window == 'undefined') {
	global = process;
} else {
	global = window;
}

(function() {

	"use strict";

	var Oppan = {};
	Oppan['GangnamStyle!!!'] = function() {
		this.utils = {
			http: {
			}
		};
	};

	if (!global.Appacitive)
		global.Appacitive = new Oppan['GangnamStyle!!!']();

})();

if (module && module.exports) {
	exports = Appacitive;
}