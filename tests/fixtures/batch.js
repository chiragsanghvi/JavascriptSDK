module('Multicaller Tests - Batch');

asyncTest('Creating session with valid Apikey', function() {
  Appacitive.Session.resetSession();
  Appacitive.Session.removeUserAuthHeader();
  Appacitive.initialize({apikey: testConstants.apiKey, env: testConstants.environment, appId: testConstants.appId });
  ok(true, 'Session created successfully.');
  start();
});

var MySchool = Appacitive.Connection.extend({
  relationName: 'myschool',
  constructor: function(epA, epB, attrs) {
    if (epA instanceof Appacitive.Object) {
      attrs = attrs || {};
      attrs.endpoints = [{ label: 'profile', object: epA }, { label: 'school', object: epB }];
      Appacitive.Connection.call(this, attrs);
    } else {
      Appacitive.Connection.apply(this, arguments);
    }
  }
});

var createProfile = function(attrs) {
  attrs = _extend({ __type: 'profile' }, attrs);
  var profile = new Appacitive.Object(attrs);
  var name = 'Arathorn' + parseInt(Math.random() * 10000);
  profile.set('name', name);
  return profile;
};

var createSchool = function(attrs) {
  attrs = _extend({ __type: 'school' }, attrs);
  var profile = new Appacitive.Object(attrs);
  var name = 'Scholl' + parseInt(Math.random() * 10000);
  profile.set('name', name);
  return profile;
};

var createConnection = function() {
  var school = new Appacitive.Object('school');
  var profile = new Appacitive.Object({ __type: 'profile', name:'chirag sanghvi'});
  
  var connectOptions = {
    endpoints: [{
      object: school,
      label: 'school'
    }, {
      object: profile,
      label: 'profile'
    }],
    relation: 'myschool'
  };

  //create connection
  return new Appacitive.Connection(connectOptions)
};

asyncTest('Update/Create objects/connections using Multicaller API', function() {

  var con1 = createConnection();
  var con2 = createConnection();

  con1.save().then(function() {

    con2.save().then(function() {


      var batch = new Appacitive.Batch()

      x = createProfile();
      x1 = createProfile();
      x2 = con1.endpoints('profile').object;
      x3 = createProfile(con1.endpoints('profile').object.toJSON());
      x4 = con2.endpoints('profile').object;
      x5 = createProfile({ age: 30 });

      batch.add([x,x,x1,x2,x3,x4,x5]);

      s1 = createSchool();
      s2 = con1.endpoints('school').object;
      s3 = createSchool(con1.endpoints('school').object.toJSON());
      s4 = con2.endpoints('school').object;
      s5 = createSchool({ location: new Appacitive.GeoCoord(12,2) });

      batch.add([s1,s2,s1,s3, s4,s5]);

      m = new MySchool(x,s1);
      m1 = new MySchool(x1,s4);
      m2 = new MySchool(x5,s5);
      m3 = new MySchool(x3,s2, {__id: con1.id, year: 1980 });
      m4 = new MySchool(x3,s2, {__id: con1.id, year: 1980 });
      m5 = new MySchool(x4,s4, {__id: con2.id });
      batch.add([m, m1, m2, m3 , m5, m4]);

      //Appacitive.config.apiBaseUrl = "http://stage-apis.appacitive.com/v1.0/";
      //Appacitive.Session.setApiKey("bBZQnuXc1vjwMtoXXLlQHLORdKKaEUq9euAQr40K0m8=");

      batch.toJSON();

      batch.on('sync', function() {
        
        var valid = true;

        batch.objects.forEach(function(o,i) { 
           if (o.isNew()) {
            ok(false, "object " + o.className + " "  + o.cid +" is still new at " + i);
            valid = false
          } else if (o.changed()) {
            ok(false, "object " + o.className + " " + o.id +" is still changed at " + i);
            valid = false;
          } 
        });
        
        batch.connections.forEach(function(o,i) { 
             if (o.isNew()) { 
              ok(false, "connection myschool " + o.cid + " is still new at " + i);
              valid = false;
             } else if (o.changed()) {
              ok(false, "connection myschool " + o.id + " is still changed at " + i);
              valid = false;
             } else { 
                if (!o.endpointA.object) { 
                  ok(false, o.id +" endpointa missing at " + i);
                  valid = false;
                } else if (!o.endpointB.object) { 
                  ok(false, o.id +" endpointb missing at " + i);
                  valid = false;
                } 
             }
        });

        if (valid) {
          ok(true, 'Multicaller operations done successfully');
        }
        start();
      });

      batch.on('error', function(status) {
        ok(false, status.message);
        start();
      });

      batch.execute();

    }, function(status) {
        ok(false, 'Could not create second connection, onError called with message'  + status.message);
        start();
    });

  }, function() {
    ok(false, 'Could not create first connection, onError called with message ' + status.message);
    start();
  });

});


asyncTest("Update or Create Objects using Collection.save", function() {

  var Profile = Appacitive.Object.extend('profile');
  var Profiles = Appacitive.Collection.extend({
    model : Profile
  });

  var profiles = new Profiles();

  profiles.add([new Profile(),new Profile(),new Profile(),new Profile(),new Profile(),new Profile(),new Profile(),new Profile(),new Profile(),new Profile()]);

  profiles.save().then(function(result) {
    var valid = true;

    profiles.forEach(function(o,i) { 
      if (o.isNew()) {
        ok(false, "object " + o.className + " "  + o.cid +" is still new at " + i);
        valid = false
      } else if (o.changed()) {
        ok(false, "object " + o.className + " " + o.id +" is still changed at " + i);
        valid = false;
      } 
    });

    if (valid) ok(true, 'Collection.save worked successfully'); 

    start();
  }, function(status) {
    ok(false, 'Could not Update or Create Objects using Collection.save, onError called with message ' + status.message);
    start();
  }); 

});

