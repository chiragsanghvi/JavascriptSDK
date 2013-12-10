
(function(global) {

    "use strict";
	
    var getUrl = function(options) {
    	var ctx = global.Appacitive.storage.urlFactory[options.type];
    	return global.Appacitive.config.apiBaseUrl + ctx[options.op].apply(ctx, options.args || []);
    };

    var _request = function(options) {

		if (!options || !_type.isObject(options)) throw new Error("Please specify request options");

		this.promise = global.Appacitive.Promise.buildPromise(options.callbacks);

		var request = this.request = new global.Appacitive.HttpRequest();
		
		request.url = getUrl(options);

		request.method = options.method || 'get';
		
		request.data = options.data || {} ;

		request.onSuccess = options.onSuccess;
		request.onError = options.onError;

		request.promise = this.promise;

		if (options.entity) request.entity = options.entity; 

		return this;
    };

    _request.prototype.send = function() {
    	return global.Appacitive.http.send(this.request);
    };

    global.Appacitive._Request = _request;

})(global);