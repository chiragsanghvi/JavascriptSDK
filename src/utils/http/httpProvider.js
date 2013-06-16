// creates the http library based on the current platform

Appacitive.utils.httpProvider = (function() {
	
	if (Appacitive.platform.isNode) {
		return new Appacitive.utils.http.NodeHttpProvider();
	} else {
		return new Appacitive.utils.http.JQueryHttpProvider();
	}

})();