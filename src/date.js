(function(global) {
  
  global.Appacitive.Date = {};

  global.Appacitive.Date.parseISODate = function (str) {
    try {
      var date = new Date(str);
      if (isNaN(date)) {
        var regexp = new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z$");
        var isOnlyDate = false;
        if (!regexp.exec(str)) {
           regexp = new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})");
           if (!regexp.exec(str)) {
              return null  
           } else {
              isOnlyDate = true;
           }
        }  

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
        
        if (!isOnlyDate) {
          date.setUTCHours(Number(timeHours));
          date.setUTCMinutes(Number(timeSubParts[1]));
          date.setUTCSeconds(Number(timeSecParts[0]));
          if (timeSecParts[1]) date.setUTCMilliseconds(Number(timeSecParts[1]));
        }
        return date;
      } else {
        return date;
      }
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
    try {
      date = date.toISOString().split('T')[0];
      return date;
    } catch(e) { return null; }
  };

  global.Appacitive.Date.toISOTime = function(date) {
    try {
      date = date.toISOString().split('T')[1];
      date = date.replace('Z','0000Z');
      return date;
    } catch(e) { return null; }
  };

  global.Appacitive.Date.parseISOTime = function(str) {
    try {
      var date = new Date();
    
      var parts = str.split('T');
      if (parts.length == 1) parts.push(parts[0]);
      
      var regexp = new RegExp("^([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z$");
      if (!regexp.exec(parts[1])) {
         return null;
      }

      var timeParts = parts[1].split('Z'),
      timeSubParts = timeParts[0].split(':'),
      timeSecParts = timeSubParts[2].split('.'),
      timeHours = Number(timeSubParts[0]);
      
      date.setUTCHours(Number(timeHours));
      date.setUTCMinutes(Number(timeSubParts[1]));
      date.setUTCSeconds(Number(timeSecParts[0]));
      if (timeSecParts[1]) date.setUTCMilliseconds(Number(timeSecParts[1]));
    
      return date;
    } catch(e) {return null;}
  };

})(global);