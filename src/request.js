
(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
	
    var getUrl = function(options) {
    	var ctx = Appacitive.storage.urlFactory[options.type];

    	var description =  options.op.replace('get','').replace('Url', '') + ' ' + options.type;

    	return { 
    		url:  Appacitive.config.apiBaseUrl + ctx[options.op].apply(ctx, options.args || []),
    		description: description
    	};
    };

    var _request = function(options) {

		if (!options || !_type.isObject(options)) throw new Error("Please specify request options");

		this.promise = Appacitive.Promise.buildPromise(options.options);

		var request = this.request = new Appacitive.HttpRequest();
		
		var tmp = getUrl(options);

		request.url = tmp.url;

		request.description = tmp.description;

		request.method = options.method || 'get';
		
		request.data = options.data || {} ;

		request.onSuccess = options.onSuccess;
		
		request.onError = options.onError;

		request.promise = this.promise;

		request.options = options.options;

		if (options.entity) request.entity = options.entity; 

		return this;
    };

    _request.prototype.send = function() {
    	return Appacitive.http.send(this.request);
    };

    Appacitive._Request = _request;

})(global);