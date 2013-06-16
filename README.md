Javascript SDK for appacitive
=====================

This open source library allows you to integrate applications built using javascript with the Appacitive platform.

To learn more about the Appacitive platform, please visit [www.appacitive.com](https://www.appacitive.com).

LICENSE

Except as otherwise noted, the Javascript SDK for Appacitive is licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html).


# Documentation 

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

ApiKey is central to interacting with the API as every call to the API needs to be authenticated. To access the ApiKey for your app, go to your app via the [portal](https://portal.appacitive.com) and go to the api key section from the left side. 

!["Getting your apikey"](http:\/\/appacitive.github.io\/images\/portal-apikey-small.png)

####Initialize your SDK, 

```javascript
Appacitive.initialize({ 
	apikey: /* a string, set your apikey over here : Mandatory*/, 
	env: /* a string, set it as 'live' or sandbox, default is live */ 
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

The player object is an instance of `Appactive.Article`. An `Appacitive.Article` is a class which encapsulates the data (the actual entity or the article) and methods that provide ways to update it, delete it etc. To see the raw entity that is stored within the `Appacitive.Article`, fire `player.getArticle()`.

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
alert(player.getArticle().name);	// John Doe
```
#### Saving
Saving a player to the server is easy.
```javascript
player.set('age','22');
player.save(function() {
	alert('saved successfully!');
}, function(err) {
	alert('error while saving!');
});
```
When you call save, the entity is taken and stored on Appacitive's servers. A unique identifier called `__id` is generated and is stored along with the player object. This identifier is also returned to the object on the client-side. You can access it directly using `id`.
This is what is available in the `player` object after a successful save.
```javascript
player.save(function(obj) {
	console.log("ID : " + player.id); //
	console.dir(palyer.getArticle());
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

Retrieving is done via the `fetch` method. Here's an example
```javascript
var player = new Appacitive.Article('player'); //You can initialize article in this way too.
// set an (existing) id in the object
player.id = {{existing_id}};
// retrieve the player
player.fetch(function(obj) {
	alert('Fetched player with name: ' + player.get('name'));
}, function(err, obj) {
	alert('Could not fetch, probably because of an incorrect id');
});
```
You can also retreive an article using get method on Appacitive.Article
```javascript
// retrieve the player
Appacitive.Article.get({ 
	schema:'player', id: '{{existing__id}}'
}, function(obj) {
	alert('Fetched player with name: ' + obj.get('name')); // artice obj is returned as argument to onsuccess
}, function(err, obj) {
	alert('Could not fetch, probably because of an incorrect id');
});
```

**Note**:  You can also mention in your object exactly which all fields you want returned so as to reduce payload. By default all fields are returned. Fiedls '__id' and `__schematype` are the fields which will always be returned. Every create, update and get call will return only these fields if specified.
```javascript
player.fields = ["name", "age", "__createby"] //will set fields to return __id, __schematype, name, age and __createdby
player.fields = [] //will set fields to return only __id and __schematype
player.fields = [*] //will set fields to return all user-defined properties and __id and __schematype
```
You can also retrieve multiple articles at a time, which will return an array of `Appacitive.Article` objects in its onSuccess callback. Here's an example
```javascript
Appacitive.Article.multiGet({ 
	schema: 'players', //name of schema
	ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of article ids to get,
	fields: ["name"]// this denotes the fields to be returned in the article object, to avoid increasing the payload
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
	});
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
```
You can also delete article with its connections in a simple call.
```javascript
player.del(function(obj) {
	alert('Deleted successfully');
}, function(err, obj) {
	alert('Delete failed')
}, true); // setting the third argument to true will delete its connections if they exist
```
You can also delete multiple articles at a time. Here's an example
```javascript
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
var newUser new Appacitive.User(userDetails);

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
	cookie     : true, // enable cookies to allow Parse to access the session
	xfbml      : true  // parse XFBML
	});
	// Additional initialization code here
};
```
Registering via facebook is done like so
```javascript
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
 3. After creating the user is logged-in and set as current user

The success callback is given one argument: `authresult`
```javascript
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```
* The `token` field is the user token. This is similar to the session token, but instead of authenticating the app with the server, it authenticates the logged in user with the app. More on this later, in the authentication section.
* The `user` field is the Appacitive User object. The data that exists in the user field got pulled from facebook when he/she logged in. Note: <span style="font-weight: bold">The user must agree to share his/her  email address with your app to be able to use facebook to signup/login.</span>

## Retrieve

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
**Note**: All `Appacitve.Article` operations can be performed on a `Appacitive.User` object. Infact its a subclass of `Appacitive.Article` class. So, above data documenation is valid for users too.
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
## Update
Again, there's no difference between updating a user and updating any other data. It is done via the `save` method.
```javascript
user.set('firstname', 'Superman');
user.save(function(obj) {
	alert('Update successful');
}, function(err) {
	alert('Update failed');
});
```

## Delete
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
## Authentication

Authentication is the core of user management. You can authenticate (log in) users in multiple ways. Once the user has authenticated successfully, you will be provided the user's details and an access token. This access token identifies the currently logged in user and will be used to implement access control. Each instance of an app can have one logged in user at any given time. However, you need to explicitly tell the SDK to start using the access token.
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
## Signup and login

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

## Login via username + password

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

## Login with facebook

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

## Login with twitter


Documentation Coming Soon!


## Linking accounts


Documentation Coming Soon!


## Create linked accounts


Documentation Coming Soon!


## Retreiving linked accounts


Documentation Coming Soon!


## Updating linked accounts


Documentation Coming Soon!


## Deleting linked accounts

Documentation Coming Soon!
