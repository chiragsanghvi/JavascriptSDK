var testConstants = {
	appName: 'sdk',
	accountName: 'hub',
	appId: '55755117867172146', //'14700033921384718',
	apiKey: 'dEajAsKVjD47Zknnyh5L1HUHVD/dDZHAXjcQFbbw/bA=', //'bY1Oeq3rBLUPpmqX8jKGjJ7gAIYyIIwvyet+nj9/7+c=',
	adminUserAuthToken: 'YTU4TVVBVVNqQXFiODdUWUxldWthb00rd21aYlBCR3phSjZuQzYwSjI0S25DdmJIMzMyQ1dWditYSnVYV3I3eXhqdENiaE5yUmo5dTB3V3NBOFNVa2hmcStGZ05vVDdqVVJOL3RvR2tHQkdxR09SQ0V0a0ZHVTNrMUg4MGx0RDE5NDhuT01PVVJWcnBIVFRkUGsya2VoRWNVNU1JTWNRYTVRYlJkY2g3Y09jPQ==',
	adminUserId: '55755590958449080', //'56373180423602642',
	environment: 'sandbox',
	user: {
		username: 'chiragsanghvi',
		password: 'test123!@#',
		email: 'csanghvi@appacitive.com',
		firstname: 'Chirag',
		lastname: 'Sanghvi'
	},
	populateDefaultUserFields: function(user) {
		user.set('password', testConstants.user.password);
		user.set('email', testConstants.user.email);
		user.set('firstname', testConstants.user.firstname);
		user.set('lastname', testConstants.user.lastname);
	}
};