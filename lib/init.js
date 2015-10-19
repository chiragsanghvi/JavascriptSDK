var global = {};

(function() {

    "use strict";

    // create the global object
    var _initialize = function() {
        var t;
        if (!global.Appacitive) {
            // create the global object
            // Export the Appacitive object for **CommonJS**, with backwards-compatibility
            // for the old `require()` API. If we're not in CommonJS, add `Appacitive` to the
            // global object.
            global.Appacitive = {
                runtime: {}
            };

            if (typeof process !== 'undefined' && !!process.versions && !!process.versions.node) {
                global.Appacitive.runtime.isNode = true;
            } else if (typeof window !== 'undefined') {
                global = window;
                global.Appacitive = {
                    runtime: {
                        isBrowser: true
                    }
                };
            }
        }
    };
    _initialize();


})(this);
