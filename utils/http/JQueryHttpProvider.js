// jquery based http provider


Appacitive.utils.http.JQueryHttpProvider = function() {

	this.get = function(request, onSuccess, onError) {
		$.ajax({
			url: request.url,
			type: 'GET',
			async: true,
			success: (onSuccess || function(){}),
			error: (onError || function(){})
		});
	};

	this.post = function(request, onSuccess, onError) {
		$.ajax({
			url: request.url,
			type: 'POST',
			dataType: 'json',
			data: request.data,
			async: true,
			success: (onSuccess || function(){}),
			error: (onError || function(){})
		});
	};

	this.put = function(request, onSuccess, onError) {
		$.ajax({
			url: request.url,
			type: 'PUT',
			dataType: 'json',
			async: true,
			success: (onSuccess || function(){}),
			error: (onError || function(){})
		});
	};

	this.del = function(request, onSuccess, onError) {
		$.ajax({
			url: request.url,
			type: 'DELETE',
			async: true,
			success: (onSuccess || function(){}),
			error: (onError || function(){})
		});
	};

};
