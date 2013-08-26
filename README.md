Javascript SDK for appacitive
=====================

This open source library allows you to integrate applications built using javascript with the Appacitive platform.
To learn more about the Appacitive platform, please visit [www.appacitive.com](https://www.appacitive.com).

LICENSE

Except as otherwise noted, the Javascript SDK for Appacitive is licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html).

# Documentation 

##### Table of Contents  

* [Setup](#setup)  
* [Initialize](#initialize)  
* [API Sessions and Security](#api-sessions-and-security)  
* [Conventions](#conventions)  
* [Data storage and retrieval](#data-storage-and-retrieval)  
  * [Creating](#creating)  
  * [Retrieving](#retrieving)  
  * [Updating](#updating)  
  * [Deleting](#deleting)  
* [User Management](#user-management)  
  * [Create](#create)  
  * [Retrieve](#retrieve)   
  * [Update](#update)  
  * [Delete](#delete)  
  * [Authentication](#authentication)  
  * [User Session Management](#user-session-management)  
  * [Linking and Unlinking accounts](#linking-and-unlinking-accounts)  
  * [Password Management](#password-management)  
  * [Check-in](#check-in)  
* [Connections](#connections)  
  * [Creating & Saving](#creating--saving)  
  * [Retrieving](#retrieving-1)  
     * [Get Connection by Id](#get-connection-by-id)  
     * [Get Connected Articles](#get-connected-articles)  
     * [Get Connection by Endpoint Article Ids](#get-connection-by-endpoint-article-ids)  
     * [Get all connections between two Article Ids](#get-all-connections-between-two-article-ids)  
     * [Get Interconnections between one and multiple Article Ids](#get-interconnections-between-one-and-multiple-article-ids)
  * [Updating](#updating-1)  
  * [Deleting](#deleting-1)  
* [Emails](#emails)  
  * [Configuring](#configuring)  
  * [Sending Raw Emails](#sending-raw-emails)
  * [Sending Templated Emails](#sending-templated-emails)  
* [Push Notifications](#push-notifications)  
  * [Broadcast](#broadcast)  
  * [Platform specific Devices](#platform-specific-devices)  
  * [Specific List of Devices](#specific-list-of-devices)  
  * [To List of Channels](#to-list-of-channels)  
  * [Query](#query)  
* [Files](#files)  
  * [Creating Appacitive.File Object](#creating-appacitivefile-object)  
  * [Uploading](#uploading)  
  * [Downloading](#downloading)
  

## Setup

To get started, add sdk to your page.

```html
<!DOCTYPE html>
<html>
	<head>
		<script src="js/AppacitiveSDK.min.js"></script>
	</head>
	<body>
		<script>
			if (Appacitive) {
				alert('Appacitive loaded!')
			} else {
				alert('SDK did not load, verify you included jquery and the sdk file properly.');
			}
		</script>
	</body>
</html>
```
## Initialize

Before we dive into using the SDK, we need to grok a couple of things about the apikey.

ApiKey is central to interacting with the API as every call to the API needs to be authenticated. To access the ApiKey for your app, go to app listing via the [portal](https://portal.appacitive.com) and click on the key icon on right side. 

!["Getting your apikey"](http:\/\/appacitive.github.io\/images\/portal-apikey-small.png)

####Initialize your SDK, 

```javascript
Appacitive.initialize({ 
	apikey: /* a string, set your apikey over here : Mandatory */, 
	env: /* a string, set it as 'live' or sandbox, default is live */, 
	appId: /* a string, set your appId over here : Mandatory */
});
```
Now you are ready to use the SDK

### API Sessions and Security

Appacitive also provides a way to use sessions instead of apikey directly in your API calls. You can create a session as
```javascript
Appacitive.Session.create({ apikey: {{your_api_key_here}} }, function() {
    // your session is created and stored within the sdk and is commanded to use session instead of apikey
}, function(err) {
    // your session creation failed.
});
```
**Note** : On successful creation of session, SDK sets `Appacitive.session.useApiKey` to false which is true by default. This flag indicates whether to use ApiKey or Session for api calls. To change it use
```javascript
Appacitive.session.useApiKey = /*true or false */
//To get the session use 
Appacitive.Session.get();
//To set the session use 
Appacitive.Session.setSession('/* session */')
//To set the apikey use 
Appacitive.Session.setApiKey('/* apikey */')
```
## Conventions
```javascript
obj.save(function(obj) {
}, function(err, obj){
});
```
 1. The javascript SDK is an async library and all data calls are async. Most calls have a signature like `object::method(onSuccess, onError)` where `onSuccess` and `onError` are functions that'll get executed in case of the call being a success or a failure respectively.
 2. Every onSuccess callback for an object will get 1 argument viz. its own instance.
 3. Every onError callback for an object will get 2 argument viz. error object and its own instance.
     Error object basically contains a code and message.

----------


## Data storage and retrieval

All data is represented as entities. Entities of the same type are organized into collections. Collections act as the containers for entities. This will become clearer as you read on. Lets assume that we are building a game and we need to store player data on the server.

### Creating
To create a player via the sdk, do the following
```javascript
var players = new Appacitive.ArticleCollection('player');
var player = players.createNewArticle();
```
Huh?

An `Appacitive.ArticleCollection` comprises of entities (referred to as 'articles' in Appacitive jargon). To initialize a collection, we need to provide it some options. The mandatory argument is the `schema` argument.

What is a schema? In short, think of schemas as tables in a contemporary relational database. A schema has properties which hold values just like columns in a table. A property has a data type and additional constraints are configured according to your application's need. Thus we are specifying that the players collection is supposed to contain entities of the type 'player' (which should already defined in your application). The `players` collection is currently empty, ie it contains no actual entities.

Every `ArticleCollection` has a method called `createNewArticle` that initializes an empty entity (aka article) and returns it. Thus, `player` is an empty, initialized entity.

The player object is an instance of `Appacitive.Article`. An `Appacitive.Article` is a class which encapsulates the data (the actual entity or the article) and methods that provide ways to update it, delete it etc. To see the raw entity that is stored within the `Appacitive.Article`, fire `player.getArticle()`.

**Note**:  You can also instantiate an article object without using `ArticleCollection`. Doing so will return you `Appacitive.Article` object, on which you can perform all CRUD operations.
```javascript
var player = new Appacitive.Article({name: 'John Doe', schema: 'player'});
```
#### Setting Values
Now we need to name our player 'John Doe'. This can be done as follows
```javascript
 // values can be specified while creating the article
 var player = new Appacitive.Article({ name: 'John Doe' });

 // or we could use the setters
 player.set('name', 'John Doe');
```
#### Getting values
Lets verify that our player is indeed called 'John Doe'
```javascript
// using the getters
alert(player.get('name'));	// John Doe

// direct access via the raw object data
alert(player.toJSON().name);	// John Doe

//getting stringified respresentation of object
alert(player.toString());
```
#### Getting typed values
Appacitive returns all properties as string.Thus, there may be chances where we may need to cast them into native datatypes. 
SDK supports this, by allowing you to get values cast into a specific type.

```javascript
//get a 'date' object from a 'birth_date' property, birth_date is an property of date type in Appacitive
alert(player.get('birth_date', 'date'));

//get an 'integer' object from an 'age' property.
alert(player.get('age', 'integer'));

//get a 'boolean' object from an 'isenabled' property.
alert(player.get('isenabled', 'boolean'));

```

Types supported are `date`, `datetime`, `time`, `integer`, `decimal`, `boolean` and `string` 

#### Try-Get values

There're scenarios, when a user might need to get a non-null value for a property, so that his code doesn't needs to do null check.
This can be accomplished using `tryget` method.
```javascript
//get players age, if it is null return `12` as value
alert(player.tryGet('age', 12))
```
You can also type cast these values
```javascript
//get players age type casted into integer datatype, if it is null return 12 as value 
alert(player.tryGet('age', 12, 'integer'))
```


#### Saving
Saving a player to the server is easy.
```javascript
player.set('age','22');
player.save(function() {
	alert('saved successfully!');
}, function(err) {
	alert('error while saving!');
}, ["name", "age"] //optional
);
```
When you call save, the entity is taken and stored on Appacitive's servers. A unique identifier called `__id` is generated and is stored along with the player object. This identifier is also returned to the object on the client-side. You can access it directly using `id`.
This is what is available in the `player` object after a successful save.
```javascript
player.save(function(obj) {
	console.log("ID : " + player.id()); //
	console.dir(palyer.toJSON());
});
// output
/* 
ID: 14696753262625025
{
	"__id": "14696753262625025",
  	"__schematype": "player",
  	"__schemaid": "12709596281045355",
  	"__revision": "1",
  	"__createdby": "System",
  	"__lastmodifiedby": "System",
  	"__tags": [],
  	"__utcdatecreated": "2013-01-10T05:18:36.0000000",
  	"__utclastupdateddate": "2013-01-10T05:18:36.0000000",
  	"name": "John Doe",
  	"__attributes": {},
}
*/
```
You'll see a bunch of fields that were created automatically by the server. They are used for housekeeping and storing meta-information about the object. All system generated fields start with `__`, avoid changing their values. Your values will be different than the ones shown here.

### Retrieving

```javascript
// retrieve the player
Appacitive.Article.get({ 
	schema: 'player', //mandatory
	id: '{{existing__id}}', //mandatory
	fields: ["name"] //optional
}, function(obj) {
	alert('Fetched player with name: ' + obj.get('name')); // artice obj is returned as argument to onsuccess
}, function(err, obj) {
	alert('Could not fetch, probably because of an incorrect id');
});
```

Retrieving can also be done via the `fetch` method. Here's an example
```javascript
var player = new Appacitive.Article('player'); //You can initialize article in this way too.
// set an (existing) id in the object
player.id({{existing_id}});
// retrieve the player
player.fetch(function(obj) {
	alert('Fetched player with name: ' + player.get('name'));
}, function(err, obj) {
	alert('Could not fetch, probably because of an incorrect id');
}, ["name", "age"]//optional
);
```

**Note**:  You can mention exactly which all fields you want returned so as to reduce payload. By default all fields are returned. Fields `__id` and `__schematype` are the fields which will always be returned. Every create, save and fetch call will return only these fields, if they're specified in third argument to these calls.
```javascript
["name", "age", "__createby"] //will set fields to return __id, __schematype, name, age and __createdby
[] //will set fields to return only __id and __schematype
[*] //will set fields to return all user-defined properties and __id and __schematype
```
You can also retrieve multiple articles at a time, which will return an array of `Appacitive.Article` objects in its onSuccess callback. Here's an example
```javascript
Appacitive.Article.multiGet({ 
	schema: 'players', //name of schema : mandatory
	ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of article ids to get : mandatory
	fields: ["name"]// this denotes the fields to be returned in the article object, to avoid increasing the payload : optional
}, function(articles) { 
	// articles is an array of article objects
}, function(err) {
	alert("code:" + err.code + "\nmessage:" + err.message);
});
```
### Updating

Updating is also done via the `save` method. To illustrate: 
```javascript
// create a blank article
var player = new Appacitive.Article({
   	name: 'John Doe',
   	schema: 'player'
});
// save it
player.save(function() {
  // player has been saved successfully
  // now lets update the player's name
	player.set('name', 'Jane Doe');
	player.save(function() {
	       alert(player.get('name')); // Jane Doe
	}, function(err, obj) {
	       alert('update failed');
	}, ["name", "age"]);
});
```
As you might notice, update is done via the save method as well. The SDK combines the create operation and the update operation under the hood and provides a unified interface. This is done be detecting the presence of the property `__id` to decide whether the object has been created and needs updating or whether the object needs to be created. 
This also means that you should never delete/modify the `__id`/ id property on an entity.

### Deleting

Deleting is provided via the `del` method (`delete` is a keyword in javascript apparently o_O). Lets say we've had enough of John Doe and want to remove him from the server, here's what we'd do.
```javascript
player.del(function(obj) {
	alert('Deleted successfully');
}, function(err, obj) {
	alert('Delete failed')
});

//You can also delete article with its connections in a simple call.
player.del(function(obj) {
	alert('Deleted successfully');
}, function(err, obj) {
	alert('Delete failed')
}, true); // setting the third argument to true will delete its connections if they exist

// Multiple articles can also be deleted at a time. Here's an example
Appacitive.Article.multiDelete({ 	
	schema: 'players', //name of schema
	ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of article ids to delete
}, function() { 
	//successfully deleted all articles
}, function(err) {
	alert("code:" + err.code + "\nmessage:" + err.message);
});
```                                                        

----------

## User Management

Users represent your app's users. There is a host of different functions/features available in the SDK to make managing users easier. The `Appacitive.Users` module deals with user management.

### Create

There are multiple ways to create users.

#### Basic

You create users the same way you create any other data.
```javascript
// set the fields
var userDetails = {
    username: 'john.doe@appacitive.com',
	password: /* password as string */,
	email: 'johndoe@appacitive.com',
	firstname: 'John',
	lastname: 'Doe'
};

// now to create the user
Appacitive.Users.createUser(userDetails , function(obj) {
	alert('Saved successfully, id: ' + obj.get('__id'));
}, function(err, obj) {
	alert('An error occured while saving the user.');
});

// or you might also create the user via the familiar ArticleCollection.createNewArticle route
var users = new Appacitive.ArticleCollection({ schema: 'user' });
var newUser = users.createNewArticle(userDetails);

//or you might create user using basic article route
var newUser = new Appacitive.User(userDetails);

//and then call save on that object
newUser.save(function(obj) {
	alert('Saved successfully, id: ' + newUser.get('__id'));
}, function(err, obj) {
	alert('An error occured while saving the user.');
});
```
#### Creating Users via Facebook

You can give your users the option of signing up or logging in via facebook. For this you need to

 1. [Setup Facebook app](https://developers.facebook.com/apps).
 2. Follow these instructions to [include Facebook SDK](https://developers.facebook.com/docs/reference/javascript/) in your app.
 3. Replace your call to FB.init() with a call to Appacitive.Facebook.initialize().This is how you need to do it

```javascript
window.fbAsyncInit = function() {
	Appacitive.Facebook.initialize({
		appId      : 'YOUR_APP_ID', // Facebook App ID
		status     : true, // check login status
		cookie     : true, // enable cookies to allow Appacitive to access the session
		xfbml      : true  // parse XFBML
	});
	// Additional initialization code here
};

//Registering via facebook is done like so
Appacitive.Users.signupWithFacebook(function (authResult) {
	// user has been successfully signed up and set as current user
	// authresult contains the user and Appacitive-usertoken
}, function(err) {
	// there was an error signing up the user
});
```
So simple? Indeed.
These're the steps followed
 1. The user is shown Facebook login modal.
 2. After the user logs in successfully, our App gets the userinfo for that user and creates an Appacitive User.
 3. After creating, the user is logged-in and set as current user

The success callback is given one argument: `authresult`
```javascript
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```
* The `token` field is the user token. This is similar to the session token, but instead of authenticating the app with the server, it authenticates the logged in user with the app. More on this later, in the authentication section.
* The `user` field is the Appacitive User object. The data that exists in the user field got pulled from facebook when he/she logged in. Note: <span style="font-weight: bold">The user must agree to share his/her  email address with your app to be able to use facebook to signup/login.</span>

### Retrieve

There are three ways you could retreive the user

#### By id.
Fetching users by id is exactly like fetching articles/data. Let's say you want to fetch user with `__id` 12345.
```javascript
var users = new Appacitive.ArticleCollection({ schema: 'user' });
var user = users.createNewArticle({ __id: '12345' });
user.fetch(function (obj) {
	alert('Could not fetch user with id 12345');
}, function(err, obj) {
	alert('Could not fetch user with id 12345');
});
```
**Note**: All `Appacitive.Article` operations can be performed on `Appacitive.User` object. Infact its a subclass of `Appacitive.Article` class. So, above data documenation is valid for users too.
But, you need a user logged in to perform user-specific operations.
#### By username

```javascript
//fetch user by username
Appacitive.Users.getUserByUsername("john.doe", function(obj) {
	alert('Could not fetch user with id 12345');
}, function(err) {
	alert('Could not fetch user with id 12345');
});
```
#### By UserToken

```javascript
//fetch user by usertoken
Appacitive.Users.getUserByToken("{{usertoken}}", function(obj) {
	alert('Could not fetch user with id 12345');
}, function(err) {
	alert('Could not fetch user with id 12345');
});
```
### Update
Again, there's no difference between updating a user and updating any other data. It is done via the `save` method.
```javascript
user.set('firstname', 'Superman');
user.save(function(obj) {
	alert('Update successful');
}, function(err) {
	alert('Update failed');
});
```

### Delete
There are 3 ways of deleting a user.
#### Via the user id
```javascript
//To delete a user with an `__id` of, say, 1000.
Appacitive.Users.deleteUser('1000', function() {
	// deleted successfully
}, function(err) {
	// delete failed
});
```

#### Via the object
```javascript
//If you have a reference to the user object, you can just call 'del' on it to delete it.
user.del(function() {
	// deleted successfully
}, function(err) {
	// delete failed
});
```

#### Deleting the currently logged in user
```javascript
//You can delete the currently logged in user via a helper method.
Appacitive.Users.deleteCurrentUser(function() {
	// delete successful
}, function(err) {
	// delete failed
});
```
### Authentication

Authentication is the core of user management. You can authenticate (log in) users in multiple ways. Once the user has authenticated successfully, you will be provided the user's details and an access token. This access token identifies the currently logged in user and will be used to implement access control. Each instance of an app can have one logged in user at any given time. You can also explicitly set the accesstoken and tell the SDK to start using the access token.
```javascript
// the access token
// var token = /* ... */

// setting it in the SDK
Appacitive.session.setUserAuthHeader(token);
// now the sdk will send this token with all requests to the server
// Access control has started

// removing the auth token
Appacitive.session.removeUserAuthHeader();
// Access control has been disabled
```
#### Signup and login

This method allows to create a user, authenticate it and set it as current user
```javascript
// set the fields
var userDetails = {
    username: 'john.doe@appacitive.com',
	password: /* password as string */,
	email: 'johndoe@appacitive.com',
	firstname: 'John',
	lastname: 'Doe'
};

// now to create the user
Appacitive.Users.singup(userDetails , function(obj) {
	alert('Saved successfully, id: ' + obj.get('__id'));
}, function(err, obj) {
	alert('An error occured while saving the user.');
});
```

#### Login via username + password

You can ask your users to authenticate via their username and password.
```javascript

Appacitive.Users.login("username", "password", function (authResult) {
    // user has been logged in successfully
}, function(data) {
    // log in attempt failed
});

//The `authResult` is similar as given above.
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```

#### Login with facebook

You can ask your users to log in via facebook. The process is very similar to signing up with facebook.
```javascript
Appacitive.Users.loginWithFacebook(function (authResult) {
	// authentication successful
}, function() {
	// authentication unsuccessful
	// maybe incorrect credentials or maybe the user denied permissions
});

//As before the `authResult` parameter is the same.
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```

#### Current User

Whenever you use any signup or login method, the user is stored in localStorage and can be retrieved using `Appacitive.Users.currentUser`.So, everytime your app opens, you just need to check this value, to be sure whether the user is logged-in or logged-out.
```javascript
var cUser = Appacitive.User.currentUser();
if (cUser) {
    // user is logged in
} else {
    // user is not logged in
}
```
You can clear this value, calling `Appacitive.Users.logout()` method.
```javascript
Appacitive.Users.logout();
// this will now be null
var cUser = Appacitive.Users.currentUser();  
```

### User Session Management

Once the user has authenticated successfully, you will be provided the user's details and an access token. This access token identifies the currently logged in user and will be used to implement access control. Each instance of an app can have one logged in user at any given time.By default the SDK takes care of setting and unsetting this token. However, you can explicitly tell the SDK to start using another access token.
```javascript
// the access token
// var token = /* ... */

// setting it in the SDK
Appacitive.session.setUserAuthHeader(token);
// now the sdk will send this token with all requests to the server
// Access control has started

// removing the auth token
Appacitive.session.removeUserAuthHeader();
// Access control has been disabled
```
User session validation is used to check whether the user is authenticated and his usertoken is valid or not.
```javascript

// to check whether user is loggedin locally. This won't make any explicit apicall to validate user
Appacitive.Users.validateCurrentUser(function(isValid) {
	if(isValid) //user is logged in
});
// to check whether user is loggedin, explicitly making apicall to validate usertoken
Appacitive.Users.validateCurrentUser(function(isValid) {
	if (isValid)  //user is logged in
}, true); // set to true to validate usertoken making an apicall
```

### Linking and Unlinking accounts

#### Linking Facebook account

If you want to associate an existing loggedin Appacitive.User to a Facebook account, you can link it like so
```javascript
var user = Appacitive.User.currentUser();
user.linkFacebookAccount(function(obj) {
	console.dir(user.linkedAccounts);//You can access linked accounts of a user, using this field
}, function(err, obj){
	alert("Could not link FB account");
});
```
Under the hood the same steps followed for login are executed, except in this case the user is linked with facebook account.

#### Create Facebook linked accounts

If you want to associate a new Appacitive.User to a Facebook account, you can link it like so
```javascript
//create user object
var user = new Appacitive.User({
	username: 'john.doe@appacitive.com',
	password: /* password as string */,
	email: 'johndoe@appacitive.com',
	firstname: 'John',
	lastname: 'Doe'	
});
//link facebook account
user.linkFacebookAccount(function(obj) {
	console.dir(user.linkedAccounts);//You can access linked accounts of a user, using this field
}, function(err, obj){
	alert("Could not link FB account");
});
//create the user on server
user.save(function(obj) {
	console.dir(user.linkedAccounts);
}, function(err, obj) {
	alert('An error occured while saving the user.');
});

```
Under the hood the same steps followed for login are executed.

#### Retreiving Facebook linked account
```javascript
Appacitive.Users.currentUser().getAllLinkedAccounts(function() {
	console.dir(Appacitive.Users.currentUser.linkedAccounts);
}, function(err){
	alert("Could not reteive facebook linked account")
});
```
#### Delinking Facebook account
```javascript
Appacitive.Users.currentUser().unlinkFacebookAccount(function() {
	alert("Facebook account delinked successfully");
}, function(err){
	alert("Could not delink facebook account");
});
```
### Password Management

#### Reset Password

Users often forget their passwords for your app. So you are provided with an API to reset their passwords.To start, you ask the user for his username and call

```javascript
Appacitive.Users.sendResetPasswordEmail("{username}", "{subject for the mail}", function(){
	alert("Password reset mail sent successfully"); 
},function(){
	alert("Failed to reset password for user");
});
```

This'll basically send the user an email, with a reset password link. When user clicks on the link, he'll be redirected to an Appacitive page, which will allow him to enter new password and save it.

You can also create a custom reset password page or provide a custom reset password page URL from our UI.

On setting custom URL, the reset password link in the email will redirect user to that URL with a reset password token appended in the query string.

```javascript
//consider your url is 
http://help.appacitive.com

//after user clicks on the link, he'll be redirected to this url
http://help.appacitive.com?token=dfwfer43243tfdhghfog909043094
```
The token provided in url can then be used to change the password for that user.

So basically, following flow can be utilized for reset password

1. Validate token specified in URL

```javascript
Appacitive.Users.validateResetPasswordToken(token, function(user) {
	//token is valid and json user object is returned for that token
}, function(status) { 
	//token is invalid
});
```
2.If valid then allow the user to enter his new password and save it
```javascript
Appacitive.Users.resetPassword(token, newPassword, function() {
	//password for user has been updated successfully
}, function(status) { 
	//token is invalid
});
```

#### Update Password
Users need to change their passwords whenever they've compromised it. You can update it using this call:
```javascript
//You can make this call only for a loggedin user
Appacitive.Users.currentUser().updatePassword('{oldPassword}','{newPassword}', function(){
	alert("Password updated successfully"); 
},function(){
	alert("Failed to updated password for user");
});
```
### Check-in

Users can check-in at a particular co-ordinate uing this call. Basically this call updates users location.
```javascript
Appacitive.Users.currentUser().checkin({
	lat:18.57, lng: 75.55
}, function() {
	alert("Checked in successfully");
}, function(err) {
	alert("There was an error checking in");
});
```

----------

## Connections

All data that resides in the Appacitive platform is relational, like in the real world. This means you can do operations like fetching all games that any particular player has played, adding a new player to a team or disbanding a team whilst still keeping the other teams and their `players` data perfectly intact.

Two entities can be connected via a relation, for example two entites of type `person` might be connected via a relation `friend` or `enemy` and so on. An entity of type `person` might be connected to an entity of type `house` via a relation `owns`. Still here? OK, lets carry on.

One more thing to grok is the concept of labels. Consider an entity of type `person`. This entity is connected to another `person` via relation `marriage`. Within the context of the relation `marriage`, one person is the `husband` and the other is the `wife`. Similarly the same entity can be connected to an entity of type `house` via the relation `owns_house`. In context of this relation, the entity of type `person` can be referred to as the `owner`. 

`Wife`, `husband` and `owner` from the previous example are `labels`. Labels are used within the scope of a relation to give contextual meaning to the entities involved in that relation. They have no meaning or impact outside of the relation.

As with entities (articles), relations are also contained in collections.

Let's jump in!


### Creating &amp; Saving

#### New Connection between two existing Articles

Before we go about creating connections, we need two entities. Consider the following

```javascript
var people = new Appacitive.ArticleCollection({ schema: 'person' })
		, tarzan = people.createNewArticle({ name: 'Tarzan' })
		, jane = people.createNewArticle({ name: 'Jane' });
	
// save the entites tarzan and jane
// ...
// ...

// initialize a connection collection
var marriages = new Appacitive.ConnectionCollection({ relation: 'marriage' });

// setup the connection of type 'marriage'
var marriage = marriages.createNewConnection({ 
  endpoints: [{
      articleid: tarzan.id(),  //mandatory
      label: 'husband'  //mandatory
  }, {
      articleid: jane.id(),  //mandatory
      label: 'wife' //mandatory
  }] 
});

```

If you've read the previous guide, most of this should be familiar. What happens in the `createConnection` method is that the relation is configured to actually connect the two entities. We initialize with the `__id`s of the two entities and specify which is which for example here, Tarzan is the husband and Jane is the wife. 

In case you are wondering why this is necessary then here is the answer, it allows you to structure queries like 'who is tarzan's wife?' or 'which houses does tarzan own?' and much more. Queries are covered in later guides.

`marriage` is an instance of `Appacitive.Connection`. Similar to an entity, you may call `toJSON` on a connection to get to the underlying object.

#### New Connection between two new Articles

There is another easier way to connect two new entities. You can pass the new entities themselves to the connection while creating it.

```javascript
var tarzan = new Appacitive.Article({ schema: 'person', name: 'Tarzan' })
		, jane = new Appacitive.Article({ schema: 'person', name: 'Jane' });

// initialize and sets up a connection
// This is another way to initialize a connection object without collection
// You can pass same options in the previous way of creating connection as well
var marriage = new Appacitive.Connection({ 
  relation: 'marriage',
  endpoints: [{
      article: tarzan,  //mandatory
      label: 'husband'  //mandatory
  }, {
      article: jane,  //mandatory
      label: 'wife' //mandatory
  }],
  date: '01-01-2010'
});

// call save
marriage.save(function() {
    alert('saved successfully!');
}, function() {
    alert('error while saving!');
});

```

This is the recommended way to do it. In this case, the marriage relation will create the entities tarzan and jane first and then connect them using the relation `marriage`.

Here's the kicker: it doesn't matter whether tarzan and jane have been saved to the server yet. If they've been saved, then they will get connected via the relation 'marriage'. And if both (or one) hasn't been saved yet, when you call `marriage.save()`, the required entities will get connected and stored on the server. So you could create the two entities and connect them via a single `.save()` call, and if you see the two entities will also get reflected with save changes, so your object is synced.

#### Setting Values
```javascript
//This works exactly the same as in case of your standard entities.
marriage.set('date', '01-10-2010');
```

#### Getting values
```javascript
//Again, this is similar to the entities.
alert(marriage.get('date')) // returns 01-01-2010

//You can also get typed values similar to standard entities.
alert(marriage.get('date', 'date'));

//and it also supports the tryget similar to standard entities
alert(marriage.get('date', new Date(), 'date'));
```

### Retrieving

#### Get Connection by Id

```javascript
Appacitive.Connection.get({
	relation: 'marriage', //mandatory
    id: '{{existing__id}}', //mandatory
    fields: ["name"] //optional
},function(obj) {
	alert('Fetched marriage which occured on: ' + obj.get('date'));
}, function(err) {
	alert('Could not fetch, probably because of an incorrect __id');
});
```
Retrieving can also be done via the `fetch` method. Here's an example
```javascript
var marriage = new Appacitive.Connection('marriage');

// set an (existing) id in the object
marriage.set('__id', '{{existing_id}}');

// retrieve the marriage connection
marriage.fetch(function(obj) {
    alert('Fetched marriage which occured on: ' + marriage.get('date'));
}, function(err, obj) {
    alert('Could not fetch, probably because of an incorrect __id');
}, ["date"] //optional
);
```
The marriage object is similar to the article object, except you get two new fields viz. endpointA and endpointB which contain the id and label of the two entities that this object connects.

```javascript
//marriage.endpointA
{label: "husband", type: "person", articleid: "35097613532529604"}

//marriage.endpointB
{label: "wife", type: "person", articleid: "435097612324235325"}

//marriage.enpoints()
[
  {label: "husband", type: "person", articleid: "35097613532529604"},
  {label: "wife", type: "person", articleid: "435097612324235325"}
]
```

#### Get Connected Articles

Consider `Jane` has a lot of freinds whom she wants to invite to her marriage. She can simply get all her freinds who're of type `person` connected with `Jane` through a relation `freinds` with label for jane as `me` and freinds as `freind` using this search

```javascript
//Get an instance of person Article for Jane 
var jane = new Appacitive.Article({ __id : '123345456', schema : 'person');

//call fetchConnectedArticles with all options that're supported by queries syntax
// we'll cover queries in next section
jane.fetchConnectedArticles({ 
	relation : 'freinds', //mandatory
    label: 'freind' //madatory for a relation between same schema and differenct labels
}, function(obj, pi) {
	console.log(jane.children["freinds"]);
}, function (err, obj) {
	alert("code:" + err.code + "\nmessage:" + err.message);
});

```
On success, `jane` object is populated with a freind property in its `children`. So, `jane.children.freinds` will give you a list of all freinds of `Appacitive.Article` type.
These articles also contain a connection property which consists of its link properties with `jane`.

```javascript
// list of all connected articles to jane
jane.children.freinds

//connection connecting jane to each article
jane.children.freinds[0].connection
```

In this query, you provide a relation type (name) and a label if both endpoints are of same type and what is returned is a list of all the articles connected to above article. 

Such queries come helpful in a situation where you want to know all the interactions of a specific kind for of a particular article in the system.

#### Get Connection by Endpoint Article Ids

Appacitive also provides a reverse way to fetch a connection  between two articles.
If you provide two article ids of same or different schema types, all connections between those two articles are returned.

Consider you want to check whether `Tarzan` and `Jane` are married, you can do it as
```javascript
//'marriage' is the relation between person schema
//and 'husband' and 'wife' are the endpoint labels
Appacitive.Connection.getBetweenArticlesForRelation({ 
    relation: "marriage", //mandatory
    articleAId : "22322", //mandatory 
    articleBId : "33422", //mandatory
    label : "wife" //madatory for a relation between same schema and differenct labels
}, function(marriage){
	if(marriage != null) {
    	// connection obj is returned as argument to onsuccess
    	alert('Tarzan and jane are married at location ', marriage.get('location'));
    } else {
    	alert('Tarzan and jane are not married');
    }
}, function(err) {
    alert('Could not fetch, probably because of an incorrect id');
});

//For a relation between same schema type and differenct endpoint labels
//'label' parameter becomes mandatory for the get call

```

Conside you want to check that a particular `house` is owned by `Jane`, you can do it by fetching connection for relation `owns_house` between `person` and `house`.
```javascript
Appacitive.Connection.getBetweenArticlesForRelation({ 
    relation: "owns_house", 
    articleAId : "22322", // person schema entity id
    articleBId : "33422" //house schema entity id
}, function(obj){
    if(obj != null) {
    	alert('Jane owns this house');
    } else {
    	alert("Jane doesn't owns this house");
    }
}, function(err, obj) {
    alert('Could not fetch, probably because of an incorrect id');
});
```

#### Get all connections between two Article Ids

Consider `jane` is connected to `tarzan` via a `marriage` and a `freind` relationship. If we want to fetch al connections between them we could do this as

```javascript
Appacitive.Connection.getBetweenArticles({
	articleAId : "22322", // id of jane
    articleBId : "33422" // id of tarzan
}, function(connections, pi) {
	console.log(connections);
}, function(err) {
	alert("code:" + err.code + "\nmessage:" + err.message);
});
```
On success, we get a list of all connections that connects `jane` and `tarzan`.

#### Get Interconnections between one and multiple Article Ids

Consider, `jane` wants to what type of connections exists between her and a group of persons and houses , she could do this as
```javascript
Appacitive.Connection.getInterconnects({
	articleAId: '13432',
    articleBIds: ['32423423', '2342342', '63453425', '345345342']
}, function(connections) {
	console.log(connections);
}, function(err) {
	alert("code:" + err.code + "\nmessage:" + err.message);
});
```

This would return all connections with article id 13432 on one side and '32423423', '2342342', '63453425' or '345345342' on the other side, if they exist.

### Updating


Updating is done exactly in the same way as entities, i.e. via the `save()` method. 

*Important*: Updating the endpoints (the `__endpointa` and the `__endpointb` property) will not have any effect and will fail the call. In case you need to change the connected entities, you need to delete the connection and create a new one. 
```javascript
marriage.set('location', 'Las Vegas');

marriage.save(function(obj) {
    alert('saved successfully!');
}, function(err, obj) {
    alert('error while saving!');
});
```
As before, do not modify the `__id` property.

 
### Deleting

Deleting is provided via the `del` method.
```javascript
marriage.del(function() {
	alert('Tarzan and Jane are no longer married.');
}, function(err, obj) {
	alert('Delete failed, they are still married.')
});


// Multiple coonection can also be deleted at a time. Here's an example
Appacitive.Article.multiDelete({ 	
	relation: 'freinds', //name of relation
	ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of connection ids to delete
}, function() { 
	//successfully deleted all connections
}, function(err) {
	alert("code:" + err.code + "\nmessage:" + err.message);
});
```

----------

## Emails

### Configuring

Sending emails from the sdk is quite easy. There are primarily two types of emails that can be sent

* Raw Emails
* Templated Emails

Email is accessed through the Appacitive.Email module. Before you get to sending emails, you need to configure smtp settings. You can either configure it from the portal or in the `Email` module with your mail provider's settings.

```javascript
Appacitive.Email.setupEmail({
    username: /* username of the sender email account */,
    from: /* display name of the sender email account*/,
    password: /* password of the sender */,
    host: /* the smtp host, eg. smtp.gmail.com */,
    port: /* the smtp port, eg. 465 */,
    enablessl: /* is email provider ssl enabled, true or false, default is true */,
    replyto: /* the reply-to email address */
});
```
Now you are ready to send emails.

### Sending Raw Emails

A raw email is one where you can specify the entire body of the email. An email has the structure
```javascript
var email = {
    to: /* a string array containing the recipient email addresses */,
    cc: /* a string array containing the cc'd email addresses */,
    bcc: /* a string array containing the bcc'd email addresses */,
    from: /* email id of user */,
    subject: /* string containing the subject of the email */,
    body: /* html or string that will be the body of the email */,
    ishtml: /* bool value specifying the body is html or string, default is true */,
    useConfig: /* set true to use configure settings in email module in SDK */
};
```
And to send the email
```javascript
Appacitive.Email.sendRawEmail(email, function (email) {
    alert('Successfully sent.');
}, function(err) {
    alert('Email sending failed.')
});
```

### Sending Templated Emails

You can also save email templates in Appacitive and use these templates for sending mails. The template can contain placeholders that can be substituted before sending the mail. 

For example, if you want to send an email to every new registration, it is useful to have an email template with placeholders for username and confirmation link.

Consider we have created an email template where the templatedata is -

```javascript
"Welcome [#username] ! Thank you for downloading [#appname]."
```
Here, [#username] and [#appname] denote the placeholders that we would want to substitute while sending an email. An email has the structure

```javascript
var email = {
    to: /* a string array containing the recipient email addresses */,
    cc: /* a string array containing the cc'd email addresses */,
    bcc: /* a string array containing the bcc'd email addresses */,
    subject: /* string containing the subject of the email */,
    from: /* email id of user */,
    templateName: /*name of template to be send */,
    data: /*an object with placeholder names and their data eg: {username:"test"} */
    useConfig: /* set true to use configure settings in email module in SDK*/
};
```
And to send the email,
```javascript
Appacitive.Email.sendTemplatedEmail(email, function (email) {
    alert('Successfully sent.');
}, function(err) {
    alert('Email sending failed.')
});
```

`Note`: Emails are not transactional. This implies that a successful send operation would mean that your email provider was able to dispatch the email. It DOES NOT mean that the intended recipient(s) actually received that email.

----------

## Push Notifications

Using Appacitive platform you can send push notification to iOS devices, Android base devices and Windows phone.
 
We recommend you to go through **[this](http://appacitive.github.io/docs/current/rest/push/index.html)** section, which explains how you can configure Appacitive app for Push notification. You will need to provide some basic one time configurations like certificates, using which we will setup push notification channels for different platforms for you. Also we provide a Push Console using which you can send push notification to the users.

In Javascript SDK, static object `Appacitive.Push` provides methods to send push notification.

Appacitive provides four ways to select the sender list

* Broadcast
* Platform specific Devices
* Specific List of Devices
* To List of Channels
* Query

First we'll see how to send a push notification and then we will discuss the above methods with their options one by one.

```javascript
var options = {..}; //Some options specific to senders
Appacitive.Push.send(options, function(notification) {
	alert('Push notification sent successfully');
}, function(err) {
	alert('Sending Push Notification failed.');
});
```

### Broadcast

If you want to send a push notification to all active devices, you can use the following options

```javascript
var options = {
	"broadcast": true, // set this to true for broadcast
	"platformoptions": {
    	// platform specific options
		"ios": {
			"sound": "test"
		},
		"android": {
			"title": "test title"
		}
	},
    "data": {
    	// message to send
		"alert": "Push works!!!",
        // Increment existing badge by 1
		"badge": "+1",
        //Custom data field1 and field2
		"field1": "my custom value",
        "field2": "my custom value"
	},
	"expireafter": "100000" // Expiry in seconds
}
```

### Platform specific Devices

If you want to send push notifications to specific platforms, you can use this option. To do so you will need to provide the devicetype in the query.

```javascript
var options = {
	"query": "*devicetype == 'ios'",
	"broadcast": false, // set this to true for broadcast
	"platformoptions": {
    	// platform specific options
		"ios": {
			"sound": "test"
		},
		"android": {
			"title": "test title"
		}
	},
    "data": {
    	// message to send
		"alert": "Push works!!!",
        // Increment existing badge by 1
		"badge": "+1",
        //Custom data field1 and field2
		"field1": "my custom value",
        "field2": "my custom value"
	},
	"expireafter": "100000" // Expiry in seconds
}
```

### Specific List of Devices

If you want to send push notifications to specific devices, you can use this option. To do so you will need to provide the device ids.

```javascript
var options = {
	"deviceids": [
		"{deviceId}",
		"{deviceId2}",
		"{deviceId3}"
	],
	"broadcast": false, // set this to true for broadcast
	"platformoptions": {
    	// platform specific options
		"ios": {
			"sound": "test"
		},
		"android": {
			"title": "test title"
		}
	},
    "data": {
    	// message to send
		"alert": "Push works!!!",
        // Increment existing badge by 1
		"badge": "+1",
        //Custom data field1 and field2
		"field1": "my custom value",
        "field2": "my custom value"
	},
	"expireafter": "100000" // Expiry in seconds
}
```

### To List of Channels

Device object has a Channel property, using which you can club multiple devices. This is helpful if you want to send push notification using channel.

```javascript
var options = {
	"channels": [
		"{nameOfChannel}"
	],
	"broadcast": false, // set this to true for broadcast
	"platformoptions": {
    	// platform specific options
		"ios": {
			"sound": "test"
		},
		"android": {
			"title": "test title"
		}
	},
    "data": {
    	// message to send
		"alert": "Push works!!!",
        // Increment existing badge by 1
		"badge": "+1",
        //Custom data field1 and field2
		"field1": "my custom value",
        "field2": "my custom value"
	},
	"expireafter": "100000" // Expiry in seconds
}
```

### Query

You can send push notifications to devices using a Query. All the devices which comes out as result of the query will receive the push notification.

```javascript
var options = {
	"query": "{{add your query here}}",
	"broadcast": false, // set this to true for broadcast
	"platformoptions": {
    	// platform specific options
		"ios": {
			"sound": "test"
		},
		"android": {
			"title": "test title"
		}
	},
    "data": {
    	// message to send
		"alert": "Push works!!!",
        // Increment existing badge by 1
		"badge": "+1",
        //Custom data field1 and field2
		"field1": "my custom value",
        "field2": "my custom value"
	},
	"expireafter": "100000" // Expiry in seconds
}
```

----------------

## Files

Appacitive supports file storage and provides api's for you to easily upload and download file. In the background we use amazon's S3 services for persistance. To upload or download files, the SDK provides `Appacitive.File` class, which you can instantiate to perform operations on file.

### Creating Appacitive.File Object

To construct an instance of `Appacitive.File` class, you must know the content type (mimeType) of the file because this is a required parameter. Optionally you can provide name/id of the file by which it will be saved on the server.

Thses are the options you need to initialize a file object
```javascript
var options = {
	fileId: //  a unique string representing the filename on server,
    contentType: // Mimetype of file,
    fileData: // data to be uploaded, this could be bytes or HTML5 fileupload instance data
};
```

If you don't provide contentType, then the SDK will try to get the MimeType from the HTML5 fileData object or it'll set it as 'text/plain'.

To upload a file, the SDK provides three ways.

#### Byte Stream

If you have a byte stream, you can use the following interface to upload data.
```javascript
var bytes = [ 0xAB, 0xDE, 0xCA, 0xAC, 0XAE ];

//create file object
var file = new Appacitive.File({
	fileId: 'serverFile.png',
    fileData: bytes,
    contentType: 'image/png'
});
```

#### HTML5 File Object

If you've a fileupload control in your HTML5 app which allows the user to pick a file from their local drive to upload, you can simply create the object as
```javascript
//consider this as your fileupload control
<input type="file" id="imgUpload">

//in a handler or in a function you could get a reference to it, if you've selected a file
var fileData = $('#imgUpload')[0].files[0];

//create file object
var file = new Appacitive.File({
	fileId: fileData.name,
    fileData: fileData
});
```
Here, we gave the fileId as the name of the original file. There're three things to be noted :

1. If you don't provide a fileId, a unique id for the file is generated and saved by the server.

2. If you provide a fileId which already exists on the server, then on saving, this new file will replace the old file.

3. If you don't provide contentType, then the SDK will infer it from the fileData object or set it as text/plain.

#### Custom Upload

If you want to upload a file without using SDK, you can get an upload URL by calling its instance method `getUploadUrl`, and simply upload your file onto this url.
```javascript
file.getUploadUrl(function(url) {
   //alert("Upload url:" + url);
}, function(err) {
   //alert("Error getting upload url for file");
});
```

### Uploading

Once you're done creating `Appacitive.File` object, simply call save to save it on the server.
```javascript
// save it on server
file.save(function(url) {
  alert('Download url is ' + url);
}, function(err) {
  //alert("Error uploading file");
});
```

After save, the onSuccess callback gets a url in response which can be saved in your object and is also reflected in the file object. This url is basically a download url which you could use to render it in your DOM.

```javascript
//file object after upload
{
  fileId: 'test.png',
  contentType: 'image/png',
  url: '{{some url}}'
}

//if you don't provide fileId while upload, then you'll get a unique fileId set in you file object
{
  fileId: '3212jgfjs93798',
  contentType: 'image/png',
  url: '{{some url}}'
}
```

### Downloading

Using the method `getDownloadUrl` in file object you can download a file which was uploaded to the Appacitive system.

To construct the instance of `Appacitive.File`, you will need to provide the fileId of the file, which was returned by the system or set by you when you uploaded the file.
```javascript
//create file object
var file = new Appacitive.File({
	fileId: "test.png"
});

// call to get donwload url
file.getDownloadUrl(function(url) {
    alert("Download url:" + url);
    $("#imgUpload").attr('src',file.url);
}, function(err) {
	alert("Downloading file");
});
```
