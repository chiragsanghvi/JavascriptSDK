(function (global) {

var cookieManager = function () {

	this.setCookie = function (name, value, minutes) {
		if (minutes) {
			var date = new Date();
			date.setTime(date.getTime() + (minutes*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		//else var expires = "";
		
		//for now lets make this a session cookie
		var expires = '';
		document.cookie = name + "=" + value + expires + "; path=/";
	};

	this.readCookie = function (name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for (var i=0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	};

	this.eraseCookie = function (name) {
		this.setCookie(name, "" ,-1);
	};

};

if (global.Appacitive.runtime.isBrowser)
	global.Appacitive.Cookie = new cookieManager();

})(global);