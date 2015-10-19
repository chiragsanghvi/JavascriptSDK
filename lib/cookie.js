(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    if (typeof document != 'undefined' && _type.isString(document.cookie)) {

        Appacitive.Cookie = new (function() {

            this.setCookie = function(name, value, minutes, erase) {
                name = Appacitive.getAppPrefix(name);
                var expires = '';
                if (minutes) {
                    var date = new Date();
                    date.setTime(date.getTime() + (minutes * 60 * 1000));
                    expires = "; expires=" + date.toGMTString();
                }

                if (!erase) {
                    //for now lets make this a session cookie if it is not an erase
                    if (!Appacitive.Session.persistUserToken) expires = '';
                    else expires = "; expires=" + new Date("2020-12-31").toGMTString();
                } else {
                    expires = '; expires=Thu, 01-Jan-1970 00:00:01 GMT';
                }
                var domain = 'domain=' + window.location.hostname;
                if (window.location.hostname == 'localhost') domain = '';

                document.cookie = name + "=" + value + expires + "; path=/;" + domain;
            };

            this.readCookie = function(name) {
                name = Appacitive.getAppPrefix(name);
                var nameEQ = name + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            };

            this.eraseCookie = function(name) {
                this.setCookie(name, "", -1, true);
            };

        })();

    } 

})(global);
