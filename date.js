(function(global) {
  
  global.Appacitive.parseISODate = function (str) {
    try{
      var date = new Date(str); 
      if (isNaN(date)) {
        var regexp = new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z$");
        if(!regexp.exec(str)) {
           return null;
        } else {
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
           if (timeSecParts[1]) date.setUTCMilliseconds(Number(timeSecParts[1]));

           return date;
        }
      } else {
        return date;
      }
    } catch(e) {return null;}
  }

  global.Appacitive.toISOString = function (date) {
    try {
      var date = date.toISOString();
      var i = date.indexOf('Z');
      date = replace('Z','0000Z');
      return date;
    } catch(e) { return null;}
  }

})(global);