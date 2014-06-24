(function (global) {

	"use strict";

	var Appacitive = global.Appacitive;

	if (Appacitive.runtime.isBrowser) {

		var A_LocalStorage = function() {

			var _localStorage = (Appacitive.runtime.isBrowser) ? window.localStorage : { getItem: function() { return null; } };

			var isLocalStorageSupported = function() {
				var testKey = 'test';
				try {
					_localStorage.setItem(testKey, '1');
					_localStorage.removeItem(testKey);
					return true;
				} catch (error) {
					return false;
				}
			};

			this.set = function(key, value) {
				value = value || '';
				if (!key) return false;

			    if (_type.isObject(value) || _type.isArray(value)) {
			    	try {
				       value = JSON.stringify(value);
				    } catch(e){}
			    }

				if (!isLocalStorageSupported()) {
					Appacitive.Cookie.setCookie(key, value);
					return this;
				} else {
					key = Appacitive.getAppPrefix(key);
				    
				    _localStorage[key] = value;
				    return this;
				}
			};

			this.get = function(key) {
				if (!key) return null;

				var value;

				if (!isLocalStorageSupported()) {
					value = Appacitive.Cookie.readCookie(key);
				} else {
					key = Appacitive.getAppPrefix(key);
					value = _localStorage.getItem(key);
			   	}

			   	if (!value) { return null; }

			    // assume it is an object that has been stringified
			    if (value[0] === "{") {
			    	try {
				      value = JSON.parse(value);
				    } catch(e){}
			    }

			    return value;
			};
			
			this.remove = function(key) {
				if (!key) return;
				if (!isLocalStorageSupported()) {
					Appacitive.Cookie.eraseCookie(key);
					return;
				}
				key = Appacitive.getAppPrefix(key);
				try { delete _localStorage[key]; } catch(e){}
			};
		};
		Appacitive.localStorage = new A_LocalStorage();

	} else {
		var A_LocalStorage = function() {
			
            var _localStorage = [];

            this.set = function(key, value) {
                value = value || '';
                if (!key || _type.isString(key)) return false;

                key = Appacitive.getAppPrefix(key);

                _localStorage[key] = value;
                return this;
            };

            this.get = function(key) {
                if (!key || _type.isString(key)) return null;

                key = Appacitive.getAppPrefix(key);

                var value = _localStorage[key];
	            if (!value) { return null; }

                return value;
            };
            
            this.remove = function(key) {
                if (!key || _type.isString(key)) return;
                key = Appacitive.getAppPrefix(key);
                try { delete _localStorage[key]; } catch(e){}
            };
        };

        Appacitive.localStorage = new A_LocalStorage();
	}
})(global);
