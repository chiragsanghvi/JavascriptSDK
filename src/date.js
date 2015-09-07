(function (global) {
  
  "use strict";

  var Appacitive = global.Appacitive;
  
  Appacitive.Date = {};

  var pad = function (n) {
      if (n < 10) return '0' + n;
      return n;
  };

  /**
   * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
   * © 2011 Colin Snover <http://zetafleet.com>
   * Released under MIT license.
   */
  Appacitive.Date.parse = function (date) {
      var timestamp, struct, minutesOffset = 0,numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];

      // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
      // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
      // implementations could be faster
      //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
      if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}|\d{7}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
          // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
          for (var i = 0, k; (k = numericKeys[i]); ++i) {
              struct[k] = +struct[k] || 0;
          }

          // allow undefined days and months
          struct[2] = (+struct[2] || 1) - 1;
          struct[3] = +struct[3] || 1;

          if (struct[8] !== 'Z' && struct[9] !== undefined) {
              minutesOffset = struct[10] * 60 + struct[11];

              if (struct[9] === '+') {
                  minutesOffset = 0 - minutesOffset;
              }
          }

          timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
      }
      else {
          timestamp = Date.parse ? Date.parse(date) : NaN;
      }

      return timestamp;
  };      

  Appacitive.Date.parseISODate = function (str) {
    try {
        return  new Date(Appacitive.Date.parse(str));
    } catch(e) { return null; }
  };

  Appacitive.Date.toISOString = function (date) {
    try {
      date = date.toISOString();
      date = date.replace('Z','0000Z');
      return date;
    } catch(e) { return null;}
  };

  Appacitive.Date.toISODate = function(date) {
    if (date instanceof Date) return String.format("{0}-{1}-{2}", date.getFullYear(), pad((date.getMonth() + 1)), pad(date.getDate()));
    throw new Error("Invalid date provided Appacitive.Date.toISODate method");
  };

  Appacitive.Date.toISOTime = function(date) {
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

  Appacitive.Date.parseISOTime = function(str) {
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
