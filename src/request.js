
(function(global) {

    "use strict";
	
    var getUrl = function(options) {
    	var ctx = global.Appacitive.storage.urlFactory[options.type];

    	var description =  options.op.replace('get','').replace('Url', '') + ' ' + options.type;

    	return { 
    		url:  global.Appacitive.config.apiBaseUrl + ctx[options.op].apply(ctx, options.args || []),
    		description: description
    	};
    };

    var _request = function(options) {

		if (!options || !_type.isObject(options)) throw new Error("Please specify request options");

		this.promise = global.Appacitive.Promise.buildPromise(options.callbacks);

		var request = this.request = new global.Appacitive.HttpRequest();
		
		var tmp = getUrl(options);

		request.url = tmp.url;

		request.description = tmp.description;

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