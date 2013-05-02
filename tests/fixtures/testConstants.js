var testConstants = {
	appName: 'sdk',
	accountName: 'hub',
	apiKey: 'bY1Oeq3rBLUPpmqX8jKGjJ7gAIYyIIwvyet+nj9/7+c=',
	adminUserAuthToken: 'eGdQb3NEcTBLRnlUazA3TU1URzJGOUFWek9tMGZJVFFHcnIzRTJ6RGpuS3poNWV5Rm10MHN5WlBoWCtYWDRpMkpwWEVWMFVhdEMrYUt4dldGR1dENldEZnZpeFIrdDBXNzVHaDFpZ2xBVWVCNVRnaU1rYjU1ZEtOeHlNZzZrOG92eERIcVZkREJpaW0zTmJsSGZHUHVCMHd3aUZnNVRTNQ==',
	environment: 'sandbox',
	user: {
		username: 'bchakravarty@appacitive.com',
		password: 'test123!@#',
		email: 'bchakravarty@appacitive.com',
		firstname: 'Biswarup',
		lastname: 'Chakravarty'
	},
	populateDefaultUserFields: function(user) {
		user.set('password', testConstants.user.password);
		user.set('email', testConstants.user.email);
		user.set('firstname', testConstants.user.firstname);
		user.set('lastname', testConstants.user.lastname);
	}
};