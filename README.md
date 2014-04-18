Javascript SDK for appacitive
=====================

This open source library allows you to integrate applications built using javascript with the Appacitive platform.
To learn more about the Appacitive platform, please visit [www.appacitive.com](https://www.appacitive.com).

LICENSE

Except as otherwise noted, the Javascript SDK for Appacitive is licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html).

# Documentation 

For v0.9 API Version, refer [here](https://github.com/chiragsanghvi/JavascriptSDK/tree/release0.9)

##### Table of Contents  

* [Setup](#setup)  
* [Initialize](#initialize)  
* [Conventions](#conventions)  
* [Data storage and retrieval](#data-storage-and-retrieval)  
  * [Creating](#creating)
    * [Setting Values](setting-values)  
    * [Getting Values](Getting-values)  
    * [Getting Typed Values](getting-typed-values)  
  * [Extending Object](#extending-object)
  * [Retrieving](#retrieving)
    * [Get Object](#getting-object)  
    * [Multiget Objects](#multiget-objects)  
  * [Updating](#updating)  
  * [Deleting](#deleting)
  * [Multidelete](#multidelete-objects)  
* [Arrays](#arrays)
* [Counters](#counters)
* [GeoPoint](#geopoint)
* [Connections](#connections)  
  * [Creating & Saving](#creating--saving)  
  * [Retrieving](#retrieving-1)  
     * [Get Connection by Id](#get-connection-by-id)
     * [Multiget Connections](#multiget-connections)  
     * [Get all Connections for an Endpoint Object Id](#get-all-connections-for-an-endpoint-object-id)
     * [Get Connected Objects](#get-connected-objects)  
     * [Get Connection by Endpoint Object Ids](#get-connection-by-endpoint-object-ids)  
     * [Get all connections between two Object Ids](#get-all-connections-between-two-object-ids)  
     * [Get Interconnections between one and multiple Object Ids](#get-interconnections-between-one-and-multiple-object-ids)
  * [Updating](#updating-1)  
  * [Deleting](#deleting-1)
  * [Multidelete](#multidelete-connections)
* [Extending Connection](#extending-connection)  
* [Queries](#queries)
  * [Modifiers](#modifiers)
    * [Paging](#pagination)
    * [Sorting](#sorting)
    * [Fields](#fields)
    * [Filter](#filter)
    * [Geolocation](#geolocation)
      * [GeoPoint](#geopoint)
      * [Radial Search](#radial-search)
      * [Polygon Search](#polygon-search)
    * [Tag Based Searches](#tag-based-searches)
      * [Query data tagged with one or more of the given tags](#query-data-tagged-with-one-or-more-of-the-given-tags)
      * [Query data tagged with all of the given tags](#query-data-tagged-with-all-of-the-given-tags)
    * [Composite Filters](#composite-filters)
    * [FreeText](#freetext)
  * [Counts](#counts)
* [Graph Search](#graph-search)  
  * [Creating graph queries](#creating-graph-queries)  
  * [Executing Filter graph queries](#executing-filter-graph-queries)   
  * [Executing projection graph queries](#executing-projection-graph-queries)  
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

## Conventions
```javascript
//callbacks
obj.save({ 
  success: function(obj) {}, 
  error: function(err, obj){} 
});

//promise
var promise = obj.save();
promise.then(function(obj) {}, function(err, obj){} );
```
 1. The javascript SDK is an async library and all data calls are async. Most calls have a signature like `object::method({ success: onSuccess, error: onError })` where `onSuccess` and `onError` are functions that'll get executed in case of the call being a success or a failure respectively.
 2. Every data call also returns a promise.
 3. Every onSuccess callback for an object will get 1 argument viz. its own instance.
 4. Every onError callback for an object will get 2 argument viz. error object and its own instance.
     Error object basically contains a code and message.

----------


## Data storage and retrieval

All data is represented as entities. This will become clearer as you read on. Lets assume that we are building a game and we need to store player data on the server.

### Creating
To create a player via the sdk, do the following
```javascript
var player = new Appacitive.Object('player');
```
Huh?

An `Appacitive.Object` comprises of an entity (referred to as 'object' in Appacitive jargon). To initialize an object, we need to provide it some options. The mandatory argument is the `__type` argument.

What is a type? In short, think of types as tables in a contemporary relational database. A type has properties which hold values just like columns in a table. A property has a data type and additional constraints are configured according to your application's need. Thus we are specifying that the player is supposed to contain an entity of the type 'player' (which should already be defined in your application).

The player object is an instance of `Appacitive.Object`. An `Appacitive.Object` is a class which encapsulates the data (the actual entity or the object) and methods that provide ways to update it, delete it etc. To see the raw entity that is stored within the `Appacitive.Object`, fire `player.toJSON()`.


#### Extending Object

Each `Appacitive.Object` is an instance of a specific subclass of a particular `type` by default. To create a subclass of particular type of your own, you extend `Appacitive.Object` with `typename` and provide instance properties, as well as optional classProperties to be attached directly to the constructor function. 

```javascript
// create a new subclass of Appacitive.Object.
var Player = Appacitive.Object.extend('player');  //Name subclass using pascal casing

// create an instance of that class 
var tyson = new Player(); 
```

You can add additional methods and properties to your subclasses of `Appacitive.Object` as shown below

```javascript
// a subclass of Appacitive.Object
var Player = Appacitive.Object.extend('player', {
  
  //override constructor, which allows you to replace the actual constructor function
  constructor: function(attrs) { 

    attrs.firstname = attrs.name.split(' ')[0];
    attrs.lastname = attrs.name.split(' ')[1];

    //Invoke internal constructor
    Appacitive.Object.call(this, atts); 
  },

  //instance methods
  isAdult: function() {
    return this.tryGet('age',0 , 'integer') >= 18 ? true: false ;
  }

}, {
  // Class methods
  findAdultPlayers: function() {
    
    //create a query with filterring on age
    var query = this.findAllQuery({
      filter: Appacitive.Filter.Property('age').greaterThanEqualTo(18)
    });

    //call fetch and return promise 
    return query.fetch();  
  }
});
```
When creating an instance of a subclass, you can pass in the initial values of the properties, which will be set on the `Appacitive.Object` instance.

```javascript
var tyson = new Player({ name 'Mike Tyson', age: '47' });
alert(tyson.isAdult()); //displays true

Player.findAdultPlayers().then(function(res) { 
  console.log(res.length + ' players'); 
});
```

Above example depicts use of (queries)[#queries], which we'll discuss in coming sections. By default whenever you extend `Appacitive.Object` class you also extend some of the static methods used for querying and fetching data viz. 

 * [get](#getting-object) 
 * [multiGet](#multiget-objects) 
 * [multiDelete](#multidelete-objects) 
 * [findAllQuery](#queries)

*Note :* For all these operations you won't need to pass the `type`, it'll be implicitly picked up from the extended class.

#### Setting Values

Now we need to name our player 'John Doe'. This can be done as follows
```javascript
 // values can be specified while creating the object
 var Player = Appacitive.Object.extend('player');
 var player = new Player({ name: 'John Doe' });

 // or we could use the setters
 player.set('name', 'John Doe');
```
#### Getting values
Lets verify that our player is indeed called 'John Doe'
```javascript
// using the getters
alert(player.get('name'));  // John Doe

// direct access via the raw object data
alert(player.toJSON().name);  // John Doe

//getting stringified respresentation of object
alert(player.toString());
```
To delete a single field from an object use the unset method
```javascript
player.unset('name');
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
Types supported are `date`, `datetime`, `time`, `integer`, `decimal`, `boolean`, `string` and `geocode`. `Geocode` will return an instance of `Appacitive.GeoCoord` type.

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

//saving using (promise)[#promise]
player.save().then(function() {
  alert('saved successfully!');
});

// or using callbacks

player.save({
  success : function() {
    alert('saved successfully!');
  },
  error: function(status) {
    alert("save failed due to " + status.message);
  }
});


```
When you call save, the entity is taken and stored on Appacitive's servers. A unique identifier called `__id` is generated and is stored along with the player object. This identifier is also returned to the object on the client-side. You can access it directly using `id`.
This is what is available in the `player` object after a successful save.
```javascript

if (player.isNew()) console.log("Creating player");
if (!player.isNew()) console.log("Updating player");

//isNew determines that an object is created or not

player.save().then(function(obj) {
  console.log("ID : " + player.id()); //
  console.dir(palyer.toJSON());
});
// output
/* 
ID: 14696753262625025
{
  "__id": "14696753262625025",
    "__type": "player",
    "__typeid": "12709596281045355",
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

Appacitive allows to retrieve one object using `Appacitive.Object.get` and multiple objects using `Appacitive.Object.multiGet` method.

#### Getting Object

```javascript

// retrieve the player
Appacitive.Object.get({ 
  type: 'player', //mandatory
  id: '{{existing__id}}', //mandatory
  fields: ["name"] //optional
}).then(function(obj) {
  alert('Fetched player with name: ' + obj.get('name')); // artice obj is returned as argument to onsuccess
});

// or via extended class
var Player = Appacitive.Object.extend('player');
Player.get({ 
  id: '{{existing__id}}', //mandatory
  fields: ["name"] //optional
}).then(function(obj) {
  alert('Fetched player with name: ' + obj.get('name')); // artice obj is returned as argument to onsuccess
});

```

Retrieving can also be done via the `fetch` method. Here's an example
```javascript
//extend class
var Player = Appacitive.Object.extend('player');

// create a new object
var player = new Player(); //You can initialize object in this way too.

// set an (existing) id in the object
player.id({{existing_id}});

// set fields to be returned in the object 
player.fields(["name"]);

// retrieve the player
player.fetch().then(function(obj) {
  alert('Fetched player with name: ' + player.get('name'));
});
```

**Note**:  You can mention exactly which all fields you want returned so as to reduce payload. By default all fields are returned. Fields `__id` and `__type` are the fields which will always be returned. Every create, save and fetch call will return only these fields, if they're specified in third argument to these calls.
```javascript
["name", "age", "__createby"] //will set fields to return __id, __type, name, age and __createdby
[] //will set fields to return only __id and __type
[*] //will set fields to return all user-defined properties and __id and __type
```

#### Multiget Objects

You can also retrieve multiple objects at a time, which will return an array of `Appacitive.Object` objects in its onSuccess callback. Here's an example

```javascript
Appacitive.Object.multiGet({ 
  type: 'players', //name of type : mandatory
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of object ids to get : mandatory
  fields: ["name"]// this denotes the fields to be returned in the object object, to avoid increasing the payload : optional
}).then(function(objects) { 
  // objects is an array of object objects
});


//or via extended class 
var Player = Appacitive.Object.extend('player');
Player.multiGet({ 
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of object ids to get : mandatory
  fields: ["name"]// this denotes the fields to be returned in the object object, to avoid increasing the payload : optional
}).then(function(objects) { 
  // objects is an array of object objects
});

```
### Updating

Updating is also done via the `save` method. To illustrate: 
```javascript
// extend class
var Player = Appacitive.Object.extend('player');

// create a blank object
var player = new Player({ name: 'john Doe'});

// set hobbies as an array property
player.set('hobbies', ['swimming', 'trekking']);

// set score of player
player.set('score', 220);

// isNew determines that an object is created or not
// this'll be true for now
if (player.isNew()) console.log("Creating player");

// save it
player.save().then(function() {
  // player has been saved successfully
  // this will be false
  if (!player.isNew()) console.log("Updating player");

  // now lets update the player's name
  player.set('name', 'Jane Doe');

  // add a new hobby
  player.add('hobbies', 'rappelling');

  // increment the score of player by 20
  player.increment('score', 20);

  // returns a promise
  return player.save();
}).then(function() {
  console.log(player.get('name')); // Jane Doe
  console.log(player.get('bobbies')) // ['swimming', 'trekking', 'rappelling'];
  console.log(player.get('score')) // 240
}, function(err, obj) {
  if (player.isNew())  alert('create failed');
  else  alert('update failed');
});
```
As you might notice, update is done via the save method as well. The SDK combines the create operation and the update operation under the hood and provides a unified interface. This is done be detecting the presence of the property `__id` to decide whether the object has been created and needs updating or whether the object needs to be created. 
This also means that you should never delete/modify the `__id`/ id property on an entity.

Appacitive automatically figures out which data has changed so only "dirty" fields will be sent. Thus, you don't end up overriding data that you didn't intend to update.

#### Arrays

Appacitive allows to set `string`, 'integer' and `decimal` type of properties as *multivalued* i.e. allow storing array data in them.

These operations allow you to atomically change the array value for a particular property :

*add* add the given value to the multivalued property.
*addUnique* add the given value to the multivalued property, only if it is unique.
*remove* remove all occurances of the given value from the multivalued property.

```javascript
//add items to multivalued property 'hobbies' of player
player.add('hobbies', 'hiking');
player.addUnique('hobbies', 'rappelling');

//remove item from 'hobbies'
player.remove('hobbies', 'swimming');

//call save to persist the changes
player.save();
```
Value will be updated after calling `save`.

#### Counters

Appacitive allows to atomically increment/decrement a numeric property which will be used as a counter. 

Calling increment method will ensure that the current value of the counter will be incremented by the value provided, even if another call updates the value before this call can execute. Value will be updated once a call to save() is made.

The example below walks you through how to increment a field, and how to make sure that increment gets executed.

```javascript
//increment score by 1
player.increment('score') 
      //or 
//increment score by 10
player.increment('score', 10); 
```
You can also increment the amount by passing in a second argument to increment. When no amount is specified, 1 is used by default.

### Deleting

Deleting is provided via the `del` method (`delete` is a keyword in javascript apparently o_O). Lets say we've had enough of John Doe and want to remove him from the server, here's what we'd do.
```javascript
player.destroy().then(function(obj) {
  alert('Deleted successfully');
});

//You can also delete object with its connections in a simple call.
player.destroy(true).then(function(obj) {
  alert('Deleted successfully');
}); // setting the first argument to true will delete its connections if they exist
```

### Multidelete Objects

Multiple objects can also be deleted at a time. Here's an example

```
Appacitive.Object.multiDelete({   
  type: 'players', //name of type
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of object ids to delete
}, function() { 
  //successfully deleted all objects
}, function(err) {
  alert("code:" + err.code + "\nmessage:" + err.message);
});

// or via extended class
var Player = Appacitive.Object.extend('player');

Player.multiDelete({   
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of object ids to delete
}, function() { 
  //successfully deleted all objects
}, function(err) {
  alert("code:" + err.code + "\nmessage:" + err.message);
});

```                                                        

----------

## Connections

All data that resides in the Appacitive platform is relational, like in the real world. This means you can do operations like fetching all games that any particular player has played, adding a new player to a team or disbanding a team whilst still keeping the other teams and their `players` data perfectly intact.

Two entities can be connected via a relation, for example two entites of type `person` might be connected via a relation `friend` or `enemy` and so on. An entity of type `person` might be connected to an entity of type `house` via a relation `owns`. Still here? OK, lets carry on.

One more thing to grok is the concept of labels. Consider an entity of type `person`. This entity is connected to another `person` via relation `marriage`. Within the context of the relation `marriage`, one person is the `husband` and the other is the `wife`. Similarly the same entity can be connected to an entity of type `house` via the relation `owns_house`. In context of this relation, the entity of type `person` can be referred to as the `owner`. 

`Wife`, `husband` and `owner` from the previous example are `labels`. Labels are used within the scope of a relation to give contextual meaning to the entities involved in that relation. They have no meaning or impact outside of the relation.

As with entities (objects), relations are also contained in collections.

Let's jump in!

### Creating &amp; Saving

#### Extending Connection

Each `Appacitive.Connection` is an instance of a specific subclass of a particular `relation` by default. To create a subclass of particular relation of your own, you extend `Appacitive.Connection` with `relationName` and provide instance properties, as well as optional classProperties to be attached directly to the constructor function. 

```javascript
// create a new subclass of Appacitive.Connection.
var Friend = Appacitive.Connection.extend('friends');  //Name subclass using pascal casing


// create an instance of that class 
var frnd = new Friend({
  endpoints: [{
    label: 'me',
    endpoint: jane //instance of Appacitive.Object person type
  }, {
    label: 'friend',
    endpint: joe   //instance of Appacitive.Object person type
  }]
}); 
```

You can add additional methods and properties to your subclass of `Appacitive.Connection` as shown below

```javascript
// a subclass of Appacitive.Connection
var Friend = Appacitive.Connection.extend('friends', {
  
  //override constructor, which allows you to replace the actual constructor function
  constructor: function(attrs) { 

    // set friend type in numbers
    switch(attrs.type) {
      case 'close'  : attrs.type = 0;
                      break;
      case 'mutual' : attrs.type = 1;
                      break;
      default : attrs.type = 3;
    }

    //Invoke internal constructor
    Appacitive.Connection.call(this, atts); 
  },

  //instance methods
  getFriendType: function() {
    switch (this.get('type')) {
      case '0': return 'close';
      case '1': return 'mutual';
      default : return 'known';
    }
  }

}, {
  // Class methods
  findAllCloseFriends: function() {
    
    //create a query with filterring on age
    var query = this.findAllQuery({
      filter: Appacitive.Filter.Property('type').equalTo(0)
    });

    //call fetch and return promise 
    return query.fetch();  
  }
});
```
When creating an instance of a subclass, you're required to pass the endpoints and you can also pass in the initial values of the properties, which will be set on the `Appacitive.Connection` instance.

```javascript
var frnd = new Friend({ 
  endpoints: [{
      label: 'me',
      endpoint: jane //instance of Appacitive.Object person type
    }, {
      label: 'friend',
      endpint: joe   //instance of Appacitive.Object person type
    }],
  type: 'close'  
});

alert(frnd.getFriendType()); //displays close

Friend.findAllCloseFriends().then(function(res) { 
  console.log(res.length + ' close friends'); 
});
```

Above example depicts use of (queries)[#queries], which we'll discuss in coming sections. By default whenever you extend `Appacitive.Object` class you also extend some of the static methods used for querying and fetching data viz. 

 * [get](#get-connection-by-id) 
 * [multiGet](#multiget-connections) 
 * [multiDelete](#multidelete-connections) 
 * [findAllQuery](#queries) 
 * [betweenObjectsForRelationQuery](#get-connection-by-endpoint-object-ids) 

*Note :* For all these operations you won't need to pass the `relation`, it'll be implicitly picked up from the extended class.

#### New Connection between two existing Objects

Before we go about creating connections, we need two entities. Consider the following

```javascript
var Person = Appacitive.Object('person');

var  tarzan = new Person({ name: 'Tarzan' })
    , jane =  new Person({ name: 'Jane' });

// save the entites tarzan and jane
// ...
// ...

// initialize and set up a connection
var Marriage = Appcitive.Connection.extend('marriage');

var marriage = new Marriage({ 
  endpoints: [{
      object: tarzan,  //mandatory
      label: 'husband'  //mandatory
  }, {
      object: jane,  //mandatory
      label: 'wife' //mandatory
  }],
  date: '01-01-2010'
});

// call save
marriage.save().then(function(obj) {
    alert('saved successfully!');
});

```

If you've read the previous guide, most of this should be familiar. What happens in the `Appacitive.Connection` class is that the relation is configured to actually connect the two entities. We initialize with the `__id`s of the two entities and specify which is which for example here, Tarzan is the husband and Jane is the wife. 

In case you are wondering why this is necessary then here is the answer, it allows you to structure queries like 'who is tarzan's wife?' or 'which houses does tarzan own?' and much more. Queries are covered in later guides.

`marriage` is an instance of an extended class `Marriage` of `Appacitive.Connection`. Similar to an entity, you may call `toJSON` on a connection to get to the underlying object.

#### New Connection between two new Objects

There is another easier way to connect two new entities. You can pass the new entities themselves to the connection while creating it.

```javascript
var Person = Appacitive.Object('person');

var  tarzan = new Person({ name: 'Tarzan' })
    , jane =  new Person({ name: 'Jane' });

// initialize and sets up a connection
// This is another way to initialize a connection object without collection
// You can pass same options in the previous way of creating connection as well

var Marriage = Appcitive.Connection.extend('marriage');

var marriage = new Marriage({ 
  endpoints: [{
      object: tarzan,  //mandatory
      label: 'husband'  //mandatory
  }, {
      object: jane,  //mandatory
      label: 'wife' //mandatory
  }],
  date: '01-01-2010'
});

// call save
marriage.save().then(function(obj) {
    alert('saved successfully!');
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
}).then(function(obj) {
  alert('Fetched marriage which occured on: ' + obj.get('date'));
});

//or via extended class

var Marriage = Appacitive.Connection.extend('marriage');

Marriage.get({
  relation: 'marriage', //mandatory
  id: '{{existing__id}}', //mandatory
  fields: ["name"] //optional
}).then(function(obj) {
  alert('Fetched marriage which occured on: ' + obj.get('date'));
});
```
Retrieving can also be done via the `fetch` method. Here's an example

```javascript

var Marriage = Appacitive.Connection.extend('marriage');

var marriage = new Marriage();

// set an (existing) id in the object
marriage.set('__id', '{{existing_id}}');

//set fields to return
marriage.fields(["date"]);

// retrieve the marriage connection
marriage.fetch().then(function(obj) {
    alert('Fetched marriage which occured on: ' + marriage.get('date'));
});
```
The marriage object is similar to the object, except you get two new fields viz. endpointA and endpointB which contain the id and label of the two entities that this object connects.

```javascript
//marriage.endpointA
{label: "husband", type: "person", objectid: "35097613532529604"}

//marriage.endpointB
{label: "wife", type: "person", objectid: "435097612324235325"}

//marriage.enpoints()
[
  {label: "husband", type: "person", objectid: "35097613532529604"},
  {label: "wife", type: "person", objectid: "435097612324235325"}
]
```

#### Multiget Connections

You can also retrieve multiple connection at a time, which will return an array of `Appacitive.Connection` objects in its onSuccess callback. Here's an example

```javascript
Appacitive.Connection.multiGet({ 
  type: 'marriage', //name of type : mandatory
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of connection ids to get : mandatory
  fields: ["name"]// this denotes the fields to be returned in the object connection, to avoid increasing the payload : optional
}).then(function(objects) { 
  // connections is an array of connection objects
});


//or via extended class 

var Marriage = Appacitive.Connection.extend('marriage');

Marriage.multiGet({ 
  type: 'marriage', //name of type : mandatory
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of connection ids to get : mandatory
  fields: ["name"]// this denotes the fields to be returned in the object connection, to avoid increasing the payload : optional
}).then(function(objects) { 
  // connections is an array of connection objects
});
```

#### Get Connected Objects

Consider `Jane` has a lot of friends whom she wants to invite to her marriage. She can simply get all her friends who're of type `person` connected with `Jane` through a relation `friends` with label for jane as `me` and friends as `friend` using this search

```javascript
//Get an instance of person Object for Jane 
var Person = new Appacitive.Object('person');

var jane = new Person({ __id : '123345456');

//call getConnectedObjects with all options that're supported by queries syntax
// we'll cover queries in next section
var query = jane.getConnectedObjects({ 
  relation : 'friends', //mandatory
  returnEdge: true, // set to false to stop returning connection
  label: 'friend' //mandatory for a relation between same type and different labels
});

query.fetch().then(function(results) {
  console.log(jane.children["friends"]);
});

```
On success, `jane` object is populated with a friend property in its `children`. So, `jane.children.friends` will give you a list of all friends of `Appacitive.Object` type.
These objects also contain a connection property which consists of its link properties with `jane`.

```javascript
// list of all connected objects to jane
jane.children.friends

//connection connecting jane to each object
jane.children.friends[0].connection
```

In this query, you provide a relation type (name) and a label if both endpoints are of same type and what is returned is a list of all the objects connected to above object. 
Such queries come helpful in a situation where you want to know all the interactions of a specific kind for of a particular object in the system.

#### Get all Connections for an Endpoint Object Id

Scenarios where you may need to just get all connections of a particular relation for an objectId, this query comes to rescue.

Consider `Jane` is connected to some objects of type `person` via `invite` relationship, that also contains a `bool` property viz. `attending`,  which is false by default and will be set to true if that person is attending marriage.

Now she wants to know who all are attending her marriage without actually fetching their connected `person` object, this can be done as

```javascript
//set an instance of person Object for Jane 
var Person = new Appacitive.Object('person');

var jane = new Person({ __id : '123345456');

//call getConnections with all options that're supported by queries syntax
// we'll cover queries in dept in next section
var query = jane.getConnections({
  relation: 'invite', //mandatory
  label: 'invitee', //mandatory
  filter: Appacitive.Filter.Property('attending').equalTo(true)
});

query.fetch().then(function(invites) {
  //invites is an array of connections
  console.log(invites);
});
```

In this query, you provide a relation type (name) and a label of opposite side whose conenction you want to fetch and what is returned is a list of all the connections for above object. 

#### Get Connection by Endpoint Object Ids

Appacitive also provides a reverse way to fetch a connection  between two objects.
If you provide two object ids of same or different type types, all connections between those two objects are returned.

Consider you want to check whether `Tarzan` and `Jane` are married, you can do it as
```javascript
//'marriage' is the relation between person type
//and 'husband' and 'wife' are the endpoint labels

var query = Appacitive.Connection.getBetweenObjectsForRelation({ 
    relation: "marriage",
    objectAId : "22322", //mandatory 
    objectBId : "33422", //mandatory
    label : "wife" //madatory for a relation between same type and differenct labels
});

//construct query by extending class
var Marriage = Appacitive.Connection.extend('marriage');

var query = Marriage.getBetweenObjectsForRelation({ 
    objectAId : "22322", //mandatory 
    objectBId : "33422", //mandatory
    label : "wife" //madatory for a relation between same type and differenct labels
});

//fire the query to fetch

query.fetch().then(function(marriage){
    if (marriage != null) {
      // connection obj is returned as argument to onsuccess
      alert('Tarzan and jane are married at location ', marriage.get('location'));
    } else {
      alert('Tarzan and jane are not married');
    }
});

//For a relation between same type type and differenct endpoint labels
//'label' parameter becomes mandatory for the get call

```

Conside you want to check that a particular `house` is owned by `Jane`, you can do it by fetching connection for relation `owns_house` between `person` and `house`.
```javascript
var Owns_house = Appacitive.Connection.extend('owns_house');

var query = Owns_house.getBetweenObjectsForRelation({ 
    objectAId : "22322", // person type entity id
    objectBId : "33422" //house type entity id
});

query.fetch().then(function(obj) {
    if(obj != null) {
      alert('Jane owns this house');
    } else {
      alert("Jane doesn't owns this house");
    }
});
```

#### Get all connections between two Object Ids

Consider `jane` is connected to `tarzan` via a `marriage` and a `friend` relationship. If we want to fetch al connections between them we could do this as

```javascript
var query = Appacitive.Connection.getBetweenObjects({
  objectAId : "22322", // id of jane
  objectBId : "33422" // id of tarzan
});

query.fetch().then(function(connections) {
  console.log(connections);
});
```
On success, we get a list of all connections that connects `jane` and `tarzan`.

#### Get Interconnections between one and multiple Object Ids

Consider, `jane` wants to what type of connections exists between her and a group of persons and houses , she could do this as
```javascript
var query = Appacitive.Connection.getInterconnects({
  objectAId: '13432',
    objectBIds: ['32423423', '2342342', '63453425', '345345342']
});

query.fetch().then(function(connections) {
  console.log(connections);
}, function(err) {
  alert("code:" + err.code + "\nmessage:" + err.message);
});
```

This would return all connections with object id 13432 on one side and '32423423', '2342342', '63453425' or '345345342' on the other side, if they exist.

### Updating


Updating is done exactly in the same way as entities, i.e. via the `save()` method. 

*Important*: Updating the endpoints (the `__endpointa` and the `__endpointb` property) will not have any effect and will fail the call. In case you need to change the connected entities, you need to delete the connection and create a new one. 
```javascript
marriage.set('location', 'Las Vegas');

marriage.save().then(function(obj) {
    alert('saved successfully!');
});
```
As before, do not modify the `__id` property.

 
### Deleting

Deleting is provided via the `del` method.
```javascript
marriage.destroy().then(function() {
  alert('Tarzan and Jane are no longer married.');
});
```

### Multidelete Connections

Multiple coonection can also be deleted at a time. Here's an example
```
Appacitive.Connection.multiDelete({   
  relation: 'friends', //name of relation
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of connection ids to delete
}).then(function() { 
  //successfully deleted all connections
});

//by extending class
var Friends = Appacitive.Connection.extend('friends');

Friends.multiDelete({   
  ids: ["14696753262625025", "14696753262625026", "14696753262625027"], //array of connection ids to delete
}).then(function() { 
  //successfully deleted all connections
});

```

----------

## Queries

All searching in SDK is done via `Appacitive.Queries` object. You can retrieve many objects at once, put conditions on the objects you wish to retrieve, and more.

```javascript

var filter = Appacitive.Filter.Property("firstname").equalTo("John");

var query = new Appacitive.Queries.FindAllQuery(
  type: 'player', //mandatory 
  //or relation: 'friends'
  fields: [*],      //optional: returns all user fields only
  filter: filter,   //optional  
  pageNumber: 1 ,   //optional: default is 1
  pageSize: 20,     //optional: default is 50
  orderBy: '__id',  //optional: default is by relevance
  isAscending: false  //optional: default is false
}); 

// success callback
var successHandler = function(players) {
  //`players` is `PagedList` of `Object`

  console.log(players.total); //total records for query
  console.log(players.pageNumber); //pageNumber for this set of records
  console.log(players.pageSize); //pageSize for this set of records

  // fetching other left players
  if (!players.isLastPage) {
    // if this is not the last page then fetch further records 
    query.fetchNext(successHandler);
  }
};

// make a call
query.fetch().then(successHandler);

```

You can also use these queries directly from your extended classes for relations and types, which also return a query.

```javascript
//for type
var Player = Appacitive.Object.extend('player');

var query = Player.findAllQuery(
  type: 'player', //mandatory 
  fields: [*],      //optional: returns all user fields only
  filter: filter,   //optional  
  pageNumber: 1 ,   //optional: default is 1
  pageSize: 20,     //optional: default is 50
  orderBy: '__id',  //optional: default is by relevance
  isAscending: false  //optional: default is false
}); 

// for relation

var Player = Appacitive.Connection.extend('friends');

var query = Player.findAllQuery(
  relation: 'friends', //mandatory 
  fields: [*],      //optional: returns all user fields only
  filter: filter,   //optional  
  pageNumber: 1 ,   //optional: default is 1
  pageSize: 20,     //optional: default is 50
  orderBy: '__id',  //optional: default is by relevance
  isAscending: false  //optional: default is false
}); 

```


Go ahead and explore the query returned. The query contains a private object which is an instance of the `Appacitive.HttpRequest` class which we'll disccus ahead . This request gets transformed into an actual ajax request and does the fetching. In case you are interested in the actual rest endpoints, fire the `toRequest` method on the query. This will return a representation of the http request.

### Modifiers

Notice the `pageSize`, `pageNumber`, `orderBy`, `isAscending`, `filter`, `fields`  and `freeText` in the query? These're the options that you can specify in a query. Lets get to those.

#### Pagination

All queries on the Appacitive platform support pagination and sorting. To specify pagination and sorting on your queries, you need to access the query from within the collection and set these parameters.

```javascript
var query = new Appacitive.Queries.FindAllQuery({ 
  type: 'person' // or relation: 'friends'
});

//set pageSize
query.pageSize(30);
//get pageSize
alert(query.pageSize()); // will print 30

//set pageNumber
query.pageNumber(2);
//get pageNumber
alert(query.pageNumber()); // will print 2


people.fetch().then(function() {
    // this is the 2nd page of results
    // where each page is 10 results long
});
```
**Note**: By default, pageNumber is 1 and pageSize is 50

#### Sorting

Queries can be sorted similarly. Lets take the same example from above:
```javascript
var query = people.query();

//set orderBy to specify the field on which you want to sort
query.orderBy('name');
//get orderBy
alert(query.orderBy()); //will print name

//set whether sortOrder is ascending or not 
query.isAscending(true);
//get orderBy
alert(query.isAscending()); // will print true
```

#### Fields

You can also mention exactly which all fields you want returned in query results. 

Fields `__id` and `__type`/`__relationtype`  are the fields which will always be returned. 
```javascript
//set fields
query.fields(["name", "age", "__createby"]); //will set fields to return __id, __type, name, age and __createdby

query.fields([]); //will set fields to return only __id and __type
query.fields([*]); //will set fields to return all user-defined properties and __id and __type
```
**Note**: By default fields is set as empty, so it returns all fields.

#### Filter

Filters are useful for limiting or funneling your results. They can be added on properties, attributes, aggregates and tags.

Adding filters in a query is done using the `Appacitive.Filter` object, which has following functions to initialize a new filter.

```javascript
Appacitive.Filter.Property
Appacitive.Filter.Attribute
Appacitive.Filter.Aggregate
Appacitive.Filter.TaggedWithOneOrMore
Appacitive.Filter.TaggedWithAll
Appacitive.Filter.Or
Appacitive.Filter.And
```

Lets first discuss how to use **Appacitive.Filter.Property**, **Appacitive.Filter.Attribute** and **Appacitive.Filter.Aggregate**. 

All of these take one argument, which is either the property or the attribute or the aggregate name on which you want to filter

```javascript
var name = new Appacitive.Filter.Property('name');
var nickName = new Appacitive.Filter.Attribute('nickname');
var count = new Appacitive.Filter.Aggregate('count');
```

In response it returns you an expression object, which has all the conditional methods that can be applied for respective property/ attribute/aggregate. 

Most of these methods other than

```javascript
var nameFilter = name.equalTo('jane'); // exact match
var nickNameFilter = nickName.like('an'); // like match
var countFilter = count.lessThan(20); // less than search
```

This returns you a filter object, which can be directly assigned to query
```javascript
query.filter(nameFilter);
query.filter(nickNameFilter);
query.filter(countFilter);

//you can also set it as
query.filter(new Appacitive.Filter.Property('name').equalTo('name'));
```

**List of all filters and their support**

| Filter        | Property         | Attribute  | Aggregate |
| ------------- |:-----:| :-----:|:-----:|
| equalTo      | Y | Y | Y |
| equalToDate      | Y | - | - |
| equalToTime      | Y | - | - |
| equalToDateTime      | Y | - | - |
| greaterThan      | Y | - | Y |
| greaterThanDate      | Y | - | - |
| greaterThanTime      | Y | - | - |
| greaterThanDateTime      | Y | - | - |
| greaterThanEqualTo      | Y | - | Y |
| greaterThanEqualToDate      | Y | - | - |
| greaterThanEqualToTime      | Y | - | - |
| greaterThanEqualToDateTime      | Y | - | N |
| lessThan      | Y | N | Y |
| lessThanDate      | Y | N | N |
| lessThanTime      | Y | N | N |
| lessThanDateTime      | Y | N | N |
| lessThanEqualTo      | Y | N | Y |
| lessThanEqualToDate      | Y | N | N |
| lessThanEqualToTime      | Y | N | N |
| lessThanEqualToDateTime      | Y | N | N |
| between      | Y | Y | Y |
| betweenDate      | Y | - | - |
| betweenTime      | Y | - | - |
| betweenDateTime      | Y | - | - |
| like      | Y | Y | N |
| startsWith      | Y | Y | N |
| endsWith      | Y | Y | N |
| contains      | Y | Y | N |

```javascript
//First name like "oh"
var likeFilter = Appacitive.Filter.Property("firstname").like("oh");

//First name starts with "jo"
var startsWithFilter = Appacitive.Filter.Property("firstname").startsWith("jo");

//First name ends with "oe"
var endsWithFilter = Appacitive.Filter.Property("firstname").endsWith("oe");

//First name matching several different values
var containsFilter = Appacitive.Filter.Property("firstname").contains(["John", "Jane", "Tarzan"]);

//Between two dates
var start = new Date("12 Dec 1975");
var end = new Date("12 Jun 1995");
var betweenDatesFilter = Appacitive.Filter.Property("birthdate").betweenDate(start, end);

//Between two datetime objects
var betweenDateTimeFilter = Appacitive.Filter.Property("__utclastupdateddate").betweenDateTime(start, end);

//Between some time
var betweenTimeFilter = Appacitive.Filter.Property("birthtime").betweenTime(start, end);

//Between some two numbers
var betweenFilter = Appacitive.Filter.Property("age").between(23, 70);

//Greater than a date
var date = new Date("12 Dec 1975");
var greaterThanDateFilter = Appacitive.Filter.Property("birthdate").greaterThanDate(date);

//Greater than a datetime
var greaterThanDateTimeFilter = Appacitive.Filter.Property("birthdate").greaterThanDateTime(date);

//Greater than a time
var greaterThanTimeFilter = Appacitive.Filter.Property("birthtime").greaterThanTime(date);

//greater then some number 
var greaterThanFilter = Appacitive.Filter.Property("age").greaterThan(25);

//Same works for greaterThanEqualTo, greaterThanEqualToDate, greaterThanEqualToDateTime and greaterThanEqualToTime
//and for lessThan, lessThanDate, lessThanDateTime and lessThanTime
//and for lessThanEqualTo, lessThanEqualToDate, lessThanEqualToDateTime and lessThanEqualToTime
// and for equalTo, equalToDate, equalToDateTime, equalToTime
```

#### Geolocation

Appacitive supports geolocations, allowing you to save and search geo data. You can specify a property type as a `geography` type for a given type or relation. 

##### GeoPoint

`Appacitive.GeoCoord` is a simple wrapper around lat and lon coordinates. It's used in geolocation queries and in setting property values.

```javascript
var geopoint = new Appacitive.GeoCoords(lat, lon);
 
lat: the latitude coordinates. Range: -90, 90 
lon: the longitude coordinates. Range: -180, 180
```

Let's create a geography property and save it as `location` in type `hotel`. We'll use the `Appacitive.GeoCoord` object to help with creating the property. It's a helper object that will convert the geopoint data to the string format we need via toString.

```javascript
//for example

var Hotel = Appacitive.Object.extend('hotel'); 
  
var location = new Appacitive.GeoCoord(16.734, 80.3423); //lat, lon
var hilton = new Hotel({ name: 'Hotel Hilton', location: location }); // you can assign geocoord objects directly to properties

//or set it in object
hilton.set('location', location);

// or set it as raw in object
hilton.set('location', '16.734, 80.3423');

hilton.save().then(function(obj) {
    alert(hilton.get('location')); // will display 16.734, 80.3423

    var loc = hilton.get('location', 'geocode')); // will return you an instance of Appacitive.GeoCoord type

    alert("Latitude: " + loc.lat() + ', longitude: ' + loc.lng());
});
  
location.toJSON();
 
Returns a JSON representation of the lat long coordinates:

{
  latitude: 16.734,
  longitude: 80.3423
}

```

These properties are essential latitude-longitude pairs. Such properties support geo queries based on a user defined radial or polygonal region on the map. These are extremely useful for making map based or location based searches. E.g., searching for a list of all restaurants within 20 miles of a given users locations.

##### Radial Search

A radial search allows you to search for all records of a specific type which contain a geocode which lies within a predefined distance from a point on the map. A radial search requires the following parameters.

```javascript
//create Appacitive.GeoCoord object
var center = new Appacitive.GeoCoord(36.1749687195, -115.1372222900);

//create filter
var radialFilter = Appacitive.Filter.Property('location').withinCircle(center, 10, 'km');

//create query object
var Hotel = Appacitive.Object.extend('hotel');

var query = Hotel.FindAllQuery({
  filter: radialFilter
});


// or without extending
var query = new Appacitive.Object.FindAllQuery({
  type: 'hotel',
  filter: radialFilter
});

//or set it in an existing query
query.filter(radialFilter);

query.fetch();
```

##### Polygon Search

A polygon search is a more generic form of geographcal search. It allows you to specify a polygonal region on the map via a set of geocodes indicating the vertices of the polygon. The search will allow you to query for all data of a specific type that lies within the given polygon. This is typically useful when you want finer grained control on the shape of the region to search.

```javascript
//create Appacitive.GeoCoord objects
var pt1 = new Appacitive.GeoCoord(36.1749687195, -115.1372222900);
var pt2 = new Appacitive.GeoCoord(34.1749687195, -116.1372222900);
var pt3 = new Appacitive.GeoCoord(35.1749687195, -114.1372222900);
var pt4 = new Appacitive.GeoCoord(36.1749687195, -114.1372222900);
var geocodes = [ pt1, pt2, pt3, pt4 ];

//create polygon filter
var polygonFilter = Appacitive.Filter.Property("location")
                                         .withinPolygon(geocodes);


//create query object
var Hotel = Appacitive.Object.extend('hotel');
var query = Hotel.FindAllQuery();

// or without extending
var query = new Appacitive.Object.FindAllQuery({
  type: 'hotel'
});

//or set it in an existing query
query.filter(polygonFilter);

//call fetch
query.fetch();
```

#### Tag Based Searches

The Appacitive platform provides inbuilt support for tagging on all data (objects, connections, users and devices). You can use this tag information to query for a specific data set. The different options available for searching based on tags is detailed in the sections below.

##### Query data tagged with one or more of the given tags

For data of a given type, you can query for all records that are tagged with one or more tags from a given list. For example - querying for all objects of type message that are tagged as personal or private.

```javascript
//create the filter 
//accepts an array of tags
var tagFilter = Appacitive.Filter
                      .taggedWithOneOrMore(["personal", "private"]);

//create the query
var Message = Appacitive.Object('message');
var query = Message.FindAllQuery({
  filter: tagFilter
});

//or withour extending
var query = new Appacitvie.Filter.FindAllQuery({
  type: 'message',
  filter: tagFilter
});

//or set it in an existing query
query.filter(tagFilter);

//call fetch
query.fetch();
```

##### Query data tagged with all of the given tags

An alternative variation of the above tag based search allows you to query for all records that are tagged with all the tags from a given list. For example, querying for all objects of type message that are tagged as personal AND private.

```javascript
//create the filter 
//accepts an array of tags
var tagFilter = Appacitive.Filter
                          .taggedWithAll(["personal", "test"]);

//create the query
var Message = Appacitive.Object('message');
var query = Message.FindAllQuery({
  filter: tagFilter
});

//or withour extending
var query = new Appacitvie.Filter.FindAllQuery({
  type: 'message',
  filter: tagFilter
});

//or set it in an existing query
query.filter(tagFilter);

//call fetch
query.fetch();
```

#### Composite Filters

Compound filters allow you to combine multiple filters into one single query. Multiple filters can be combined using `Appacitive.Filter.Or` and `Appacitive.Filter.And` operators. NOTE: All types of filters with the exception of free text filters can be combined into a compound query.

```javascript
//Use of `And` and `Or` operators
var center = new Appacitive.GeoCoord(36.1749687195, -115.1372222900);

//AND filter
var complexFilter = 
      Appacitive.Filter.And(
          //OR filter
          Appacitive.Filter.Or( 
             Appacitive.Filter.Property("firstname").startsWith("jo"),
             Appacitive.Filter.Property("lastname").like("oe")
          ),
          Appacitive.Filter.Property("location")
              .withinCircle(center, 
                      10, 
                      'mi') // can be set to 'km' or 'mi'
      );

//Or you can do it as

var complexFilter = Appacitive.Filter.Property("firstname").startsWith("jo")
          .Or(Appacitive.Filter.Property("lastname").like("oe"))
          .And(Appacitive.Filter.Property("location")
                      .withinCircle(center, 10, 'mi')) // can be set to 'km' or 'mi'
          

//create query object
var Player = Appacitive.Object.extend('player');
var query = Player.findAllQuery();

//or without extending
var query = new Appacitive.Queries.FindAllQuery({
  type: 'player'
});

//set filter in query
query.filter(complexFilter);

//add more filters
query.filter(query.filter.And( Appacitive.Filter.Property('gender').equalTo('male')));

//fire the query
query.fetch();

```

#### FreeText

There are situations when you would want the ability to search across all text content inside your data. Free text queries are ideal for implementing this kind of functionality. As an example, consider a free text lookup for users which searches across the username, firstname, lastname, profile description etc.You can pass multiple values inside a free text search. It also supports passing certain modifiers that allow you to control how each search term should be used. This is detailed below.

```javascript
//create the query
var Message = Appacitive.Object.extend('message');
var query = Message.findAllQuery({
  freeText: 'champs palais'
});

//or without extending
var query = new Appacitvie.Filter.FindAllQuery({
  type: 'message',
  freeText: 'champs palais'
});

//or set it in the query
query.freeText('champs palais');

//call fetch
query.fetch();
```

### Counts

You can always count the number of records for a search, instead of retreiving all records

```javascript
var query = new Appacitive.Filter.FindAllQuery({
  type: 'message',
  freeText: 'champs palais'
});

query.count().then(function(noOfRecords) {
  //There're noOfRecords for above query
});
```

----------

## Graph Search

Graph queries offer immense potential when it comes to traversing and mining for connected data. There are two kinds of graph queries, filter and projection.

### Creating graph queries

You can create filter and projection graph queries from the management portal. When you create such queries from the portal, you are required to assign a unique name with every saved search query. You can then use this name to execute the query from your app by making the appropriate api call to Appacitive.

### Executing Filter graph queries

You can execute a saved graph query (filter or projection) by using it’s name that you assigned to it while creating it from the management portal. You will need to send any placeholders you might have set up while creating the query as a list of key-value pairs in the body of the request. Note that graph queries are HTTP POST calls.

```javascript

// Name of graph filter query
var filterQueryName = "sample_filter";  

// any placeholders if provided : optional
var placeholderFillers = { key1: "value1", key2: "value2" };

// create a query of filter type and provide it with name and placeholders
var query = new Appacitive.Queries.GraphFilterQuery(filterQueryName, placeholderFillers);

// call fetch
query.fetch().then(function(ids) {
  console.log(ids.length + " found");
}, function(status) {
  console.log("Error running filter query");
});
```

### Executing projection graph queries

Executing saved projection queries works the same way as executing saved filter queries. The only difference is that you also need to pass the initial ids as an array of strings to feed the projection query. The response to a projection query will depend on how you design your projection query. Do test them out using the query builder from the query tab on the management portal and from the test harness.

```javascript

// Name of graph projection query
var projectQueryName = "sample_filter";

//an array of ids of root article : mandatory
var rootIds = ["34912447775245454", "34322447235528474", "34943243891025029"];

// any placeholders if provided : optional
var placeholderFillers = { key1: "value1", key2: "value2" };

var query = new Appacitive.Queries.GraphProjectQuery(projectQueryName, rootIds, placeholderFillers);

query.fetch().then(function(results) {
  /* results object contains list of objects for provided ids
     Each object contains a children property
     Children contains array of objects 
     of specified child elements in query
     eg: */ 

  console.log("This id '" + results[0].id() + "' has " 
       + results[0].children["friends"].length) + " friends and owns "
       + results[0].children["owns"].length) + " houses");
}, function(status) {
  console.log("Error running project query");
});
```
-----------

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
Appacitive.Users.createUser(userDetails).then(function(obj) {
  alert('Saved successfully, id: ' + obj.get('__id'));
}, function(err, obj) {
  alert('An error occured while saving the user.');
});

//or you might create user using basic object route
var newUser = new Appacitive.User(userDetails);

//and then call save on that object
newUser.save().then(function(obj) {
  alert('Saved successfully, id: ' + newUser.get('__id'));
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
    status     : false, // check login status
    cookie     : true, // enable cookies to allow Appacitive to access the session
    xfbml      : true  // parse XFBML
  });
  // Additional initialization code here
};

//Registering via facebook is done like so

//Login with facebook
Appacitive.Facebook.requestLogin().then(function(fbResponse) {
  console.log('Facebook login successfull with access token: ' + Appacitive.Facebook.accessToken());
  
  // signup with Appacitive
  return Appacitive.Users.signupWithFacebook(Appacitive.Facebook.accessToken());

}).then(function (authResult) {
  // user has been successfully signed up and set as current user
  // authresult contains the user and Appacitive-usertoken
}, function(err) {
  if (global.Appacitive.Facebook.accessToken()) {
    // there was an error during facebook login
  } else {
    // there was an error signing up the user
  }
});

```
So simple? Indeed.
These're the steps followed
 1. The user is shown Facebook login modal.
 2. After the user logs in successfully, SDK gets the accessToken which can be set and retrieved using `Appacitive.Facebook.AccessToken()`, and sends it to our App
 3. Our app gets the userinfo for that accessToken and creates an Appacitive User.
 4. After creating, the user is logged-in and set as current user

The success callback is given one argument: `authresult`
```javascript
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```
* The `token` field is the user token. This is similar to the session token, but instead of authenticating the app with the server, it authenticates the logged in user with the app. More on this later, in the authentication section.
* The `user` field is the Appacitive User object. The data that exists in the user field got pulled from facebook when he/she logged in. Note: <span style="font-weight: bold">The user must agree to share his/her  email address with your app to be able to use facebook to signup/login.</span>

**Note :** For nodejs you just need to set the `Appacitive.Facebook.accessToken()` value, and call Appacitive.Users.signupWithFacebook with the token.

### Retrieve

There are three ways you could retreive the user

#### By id.
Fetching users by id is exactly like fetching objects/data. Let's say you want to fetch user with `__id` 12345.
```javascript
var user = new Appacitive.User({ __id: '12345'});

user.fetch().then(function (obj) {
  alert('Could not fetch user with id 12345');
});
```
**Note**: All `Appacitive.Object` operations can be performed on `Appacitive.User` object. Infact its a subclass of `Appacitive.Object` class. So, above data documenation is valid for users too.
But, you need a user logged in to perform user-specific operations like update, fetch and delete.
#### By username

```javascript
//fetch user by username
Appacitive.Users.getUserByUsername("john.doe").then(function(obj) {
  alert('Could not fetch user with id 12345');
});
```
#### By UserToken

```javascript
//fetch user by usertoken
Appacitive.Users.getUserByToken("{{usertoken}}").then(function(obj) {
  alert('Could not fetch user with id 12345');
});
```
### Update
Again, there's no difference between updating a user and updating any other data. It is done via the `save` method.
```javascript
user.set('firstname', 'Superman');
user.save().then(function(obj) {
  alert('Update successful');
});
```

### Delete
There are 3 ways of deleting a user.
#### Via the user id
```javascript
//To delete a user with an `__id` of, say, 1000.
Appacitive.Users.deleteUser('1000').then(function() {
  // deleted successfully
});
```

#### Via the object
```javascript
//If you have a reference to the user object, you can just call 'del' on it to delete it.
user.destroy().then(function() {
  // deleted successfully
});
```

#### Deleting the currently logged in user
```javascript
//You can delete the currently logged in user via a helper method.
Appacitive.Users.deleteCurrentUser().then(function() {
  // delete successful
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

//Setting accessToken doesn't takes care of setting user associated for it. For that you will need to set current user too specified in further sections.

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
Appacitive.Users.signup(userDetails).then(function(authResult) {
  conole.log(authResult.token);
  alert('Saved successfully, id: ' + authResult.user.get('__id'));
});

//The `authResult` is.
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```

#### Login via username + password

You can ask your users to authenticate via their username and password.
```javascript

Appacitive.Users.login("username", "password").then(function (authResult) {
    // user has been logged in successfully
});

//The `authResult` is similar as given above.
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```

#### Login with Facebook

You can ask your users to log in via facebook. The process is very similar to signing up with facebook.
```javascript

//Login with facebook
Appacitive.Facebook.requestLogin().then(function(fbResponse) {
  console.log('Facebook login successfull with access token: ' + Appacitive.Facebook.accessToken());
  
  // signup with Appacitive
  return Appacitive.Users.loginWithFacebook(Appacitive.Facebook.accessToken());

}).then(function (authResult) {
  // user has been successfully signed up and set as current user
  // authresult contains the user and Appacitive-usertoken
}, function(err) {
  if (global.Appacitive.Facebook.accessToken()) {
    // there was an error during facebook login
  } else {
    // there was an error during user login
  }
});


//As before the `authResult` parameter is the same.
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```

#### Login with Twitter

You can ask your users to log in via Twitter. This'll require you to implement twitter login and provide the SDK with consumerkey, consumersecret, oauthtoken and oauthtokensecret
```javascript

//For login with twitter, pass twitter credentials to SDK
Appacitive.Users.loginWithTwitter({
  oauthtoken: {{twitterObj.oAuthToken}} ,
  oauthtokensecret: {{twitterObj.oAuthTokenSecret}},
  consumerKey: {{twitterObj.consumerKey}},
  consumerSecret: {{twitterObj.consumerSecret}}
}).then(function(authResult){
  //User logged-in successfully
});

//As before the `authResult` parameter is the same.
{
    "token": "UjRFNVFKSWdGWmtwT0JhNU9jRG5sV0tOTDlPU0drUE1TQXJ0WXBHSlBreWVYdEtFaWRNV2k3TXlUK1BxSlMwcFp1L09wcHFzQUpSdTB3V3NBOFNVa2srNThYUUczYzM5cGpnWExUOHVMcmNZVmpLTHB4K1RLM3BRS2JtNXJCbHdoMWsxandjV3FFbFFacEpYajlNQmNCdm1HbWdsTHFDdzhlZjJiM0ljRUUyVUY2eUl2cllDdUE9PQ==",
    "user": Appacitive.User object
}
```

#### Current User

Whenever you use any signup or login method, the user is stored in localStorage and can be retrieved using `Appacitive.Users.current`.So, everytime your app opens, you just need to check this value, to be sure whether the user is logged-in or logged-out.
```javascript
var cUser = Appacitive.User.current();
if (cUser) {
    // user is logged in
} else {
    // user is not logged in
}
```

You can explicitly set the current user as

```javascript
var user = new Appacitive.User({
    __id : '2121312'
    username: 'john.doe@appacitive.com'
    email: 'johndoe@appacitive.com',
    firstname: 'John',
    lastname: 'Doe'
});

Appacitive.Users.setCurrentUser(user, token);

//Now current user points to `john.doe`
console.log(Appacitive.Users.current().get('__id'));

```

You can clear currentuser, calling `Appacitive.Users.logout()` method.
```javascript
var makeAPICall = true

//setting makeAPICall true will tell the SDK to make an API call and invalidate the token
//setting it false won't make an API call and simply reset the token and currentUser

Appacitive.Users.logout(makeAPICall).then(function() {
  // user is looged out 
  // this will now be null
  var cUser = Appacitive.Users.current();  
});

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
Appacitive.Users.validateCurrentUser().then(function(isValid) {
  if(isValid) //user is logged in
});
// to check whether user is loggedin, explicitly making apicall to validate usertoken
// pass true as first argument to validate usertoken making an apicall
Appacitive.Users.validateCurrentUser(true).then(function(isValid) {
  if (isValid)  //user is logged in
}); 
```

### Linking and Unlinking accounts

#### Linking Facebook account

**Note:** here, we consider that the user has already logged-in with facebook using `Appacitive.Facebook.requestLogin` method

If you want to associate an existing loggedin Appacitive.User to a Facebook account, you can link it like so

```javascript
var user = Appacitive.User.current();
user.linkFacebook(global.Appacitive.Facebook.accessToken()).then(function(obj) {
  //You can access linked accounts of a user, using this field
  console.dir(user.linkedAccounts()); 
});
```

#### Create Facebook linked accounts

**Note:** here, we consider that the user has already logged-in with facebook using `Appacitive.Facebook.requestLogin` method

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
user.linkFacebook(global.Appacitive.Facebook.accessToken());

//create the user on server
user.save().then(function(obj) {
  console.dir(user.linkedAccounts());
});

```
#### Linking Twitter account

**Note:** here, we consider that the user has already logged-in with twitter

If you want to associate an existing loggedin Appacitive.User to a Twitter account, you can link it like so

```javascript
var user = Appacitive.User.current();
user.linkTwitter({
  oauthtoken: {{twitterObj.oAuthToken}} ,
  oauthtokensecret: {{twitterObj.oAuthTokenSecret}},
  consumerKey: {{twitterObj.consumerKey}},
  consumerSecret: {{twitterObj.consumerSecret}}
}).then(function(obj) {
  //You can access linked accounts of a user, using this field
  console.dir(user.linkedAccounts()); 
});
```

#### Create Twitter linked accounts

**Note:** here, we consider that the user has already logged-in with twitter

If you want to associate a new Appacitive.User to a Twitter account, you can link it like so
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
user.linkTwitter({
  oauthtoken: {{twitterObj.oAuthToken}} ,
  oauthtokensecret: {{twitterObj.oAuthTokenSecret}},
  consumerKey: {{twitterObj.consumerKey}},
  consumerSecret: {{twitterObj.consumerSecret}}
});

//create the user on server
user.save().then(function(obj) {
  console.dir(user.linkedAccounts());
});

```


#### Retreiving all linked accounts
```javascript
Appacitive.Users.current().getAllLinkedAccounts().then(function() {
  console.dir(Appacitive.Users.current().linkedAccounts());
});
```

#### Delinking Facebook account
```javascript
//specify account which needs to be delinked
Appacitive.Users.current().unlink('facebook').then(function() {
  alert("Facebook account delinked successfully");
});
```
### Password Management

#### Reset Password

Users often forget their passwords for your app. So you are provided with an API to reset their passwords.To start, you ask the user for his username and call

```javascript
Appacitive.Users.sendResetPasswordEmail("{username}", "{subject for the mail}").then(function(){
  alert("Password reset mail sent successfully"); 
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
Appacitive.Users.validateResetPasswordToken(token).then(function(user) {
  //token is valid and json user object is returned for that token
});
```
2.If valid then allow the user to enter his new password and save it
```javascript
Appacitive.Users.resetPassword(token, newPassword).then(function() {
  //password for user has been updated successfully
});
```

#### Update Password
Users need to change their passwords whenever they've compromised it. You can update it using this call:
```javascript
//You can make this call only for a loggedin user
Appacitive.Users.current().updatePassword('{oldPassword}','{newPassword}').then(function(){
  alert("Password updated successfully"); 
});
```
### Check-in

Users can check-in at a particular co-ordinate uing this call. Basically this call updates users location.
```javascript
Appacitive.Users.current().checkin(new Appacitive.GeoCoord(18.57, 75.55)).then(function() {
  alert("Checked in successfully");
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
Appacitive.Email.sendRawEmail(email).then(function (email) {
    alert('Successfully sent.');
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
Appacitive.Email.sendTemplatedEmail(email).then(function (email) {
    alert('Successfully sent.');
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
Appacitive.Push.send(options).then(function(notification) {
  alert('Push notification sent successfully');
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
file.getUploadUrl().then(function(url) {
   //alert("Upload url:" + url);
});
```

### Uploading

Once you're done creating `Appacitive.File` object, simply call save to save it on the server.
```javascript
// save it on server
file.save().then(function(url) {
  alert('Download url is ' + url);
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
file.getDownloadUrl().then(function(url) {
    alert("Download url:" + url);
    $("#imgUpload").attr('src',file.url);
});
```
