/** workaround for __getter__ and __setter__ API's for IE
**/

try {
   if (!Object.prototype.__defineGetter__ && Object.defineProperty({},"x",{get: function(){return true}}).x) {
      Object.defineProperty(Object.prototype, "__defineGetter__",
         {
         	enumerable: false, 
         	configurable: true,
          	value: function(name,func)
             {Object.defineProperty(this,name,
                 {
                 	get:func,
                 	enumerable: true,
                 	configurable: true
                 });
      }});
      Object.defineProperty(Object.prototype, "__defineSetter__",
         {
         	enumerable: false, 
         	configurable: true,
          	value: function(name,func)
             {
             	Object.defineProperty(this,name,
                 {
                 	set:func,
                 	enumerable: true,
                 	configurable: true
                 });
      }});
   }
} catch(defPropException) {/*Do nothing if an exception occurs*/};


if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun) {
        var len = this.length >>> 0;
        if (typeof fun != "function") {
            throw new TypeError();
        }

        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) {
                fun.call(thisp, this[i], i, this);
            }
        }
    };
}