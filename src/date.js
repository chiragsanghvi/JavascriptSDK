(function (global) {
  
  "use strict";

  global.Appacitive.Date = {};

  var pad = function (n) {
      if (n < 10) return '0' + n;
      return n;
  };

  global.Appacitive.Date.parseISODate = function (str) {
    try {
        var regexp = new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z?$");

        var isOnlyDate = false;
        if (!regexp.exec(str)) return new Date(str);
          
        var parts = str.split('T'),
          dateParts = parts[0].split('-'),
          timeParts = parts[1].split('Z'),
          timeSubParts = timeParts[0].split(':'),
          timeSecParts = timeSubParts[2].split('.'),
          timeHours = Number(timeSubParts[0]),
          date = new Date();

        date.setUTCFullYear(Number(dateParts[0]));
        date.setUTCMonth(Number(dateParts[1])-1);
        date.setUTCDate(Number(dateParts[2]));
        
        date.setUTCHours(Number(timeHours));
        date.setUTCMinutes(Number(timeSubParts[1]));
        date.setUTCSeconds(Number(timeSecParts[0]));
        if (timeSecParts[1]) date.setUTCMilliseconds(Number(timeSecParts[1].substring(0, 3)));

        return date;
    } catch(e) {return null;}
  };

  global.Appacitive.Date.toISOString = function (date) {
    try {
      date = date.toISOString();
      date = date.replace('Z','0000Z');
      return date;
    } catch(e) { return null;}
  };

  global.Appacitive.Date.toISODate = function(date) {
    if (date instanceof Date) return String.format("{0}-{1}-{2}", date.getFullYear(), pad((date.getMonth() + 1)), pad(date.getDate()));
    throw new Error("Invalid date provided Appacitive.Date.toISODate method");
  };

  global.Appacitive.Date.toISOTime = function(date) {
    var padMilliseconds = function (n) {
                if (n < 10) return n + '000000';
           else if (n < 100) return n + '00000';
           else if (n < 1000) return n + '0000';
           else if (n < 10000) return n + '000';
           else if (n < 100000) return n + '00';
           else if (n < 1000000) return n + '0';
           return n;
    };
    if (date instanceof Date) return String.format("{0}:{1}:{2}.{3}", pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds()), padMilliseconds(date.getMilliseconds()));
    throw new Error("Invalid date provided Appacitive.Date.toISOTime method");
  };

  global.Appacitive.Date.parseISOTime = function(str) {
    try {
      var date = new Date();
    
      var parts = str.split('T');
      if (parts.length === 1) parts.push(parts[0]);
      
      var regexp = new RegExp("^([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z?$");
      if (!regexp.exec(parts[1])) {
         return null;
      }

      var timeParts = parts[1].split('Z'),
      timeSubParts = timeParts[0].split(':'),
      timeSecParts = timeSubParts[2].split('.'),
      timeHours = Number(timeSubParts[0]);
      
      if (parts.length > 1) {
        date.setUTCHours(Number(timeHours));
        date.setUTCMinutes(Number(timeSubParts[1]));
        date.setUTCSeconds(Number(timeSecParts[0]));
        if (timeSecParts[1]) date.setUTCMilliseconds(Number(timeSecParts[1].substring(0, 3)));
      } else {
        date.setHours(Number(timeHours));
        date.setMinutes(Number(timeSubParts[1]));
        date.setSeconds(Number(timeSecParts[0]));
        if (timeSecParts[1]) date.setMilliseconds(Number(timeSecParts[1].substring(0, 3)));
      }

      return date;
    } catch(e) {return null;}
  };

})(global);
