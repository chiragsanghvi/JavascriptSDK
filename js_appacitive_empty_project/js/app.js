Appacitive.initialize({ 
	apikey: "{apikey}",// The master or client api key for your app on appacitive.
	env: "sandbox",      // The environment that you are targetting (sandbox or live).
	appId: "{appId}"     // The app id for your app on appacitive. 
});

$(function() {

	Appacitive.ping({ 
		success: function(response) {
			$('#divSuccess').show();
			console.log(response);
		}, 
		error: function(error) {
			$('#divError').html('Appacitive Ping Failed. Response: <br/>' + error.message)                   
						  .show();
		}
	});

});