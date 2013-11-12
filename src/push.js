(function (global) {

	"use strict";

	var _pushManager = function() {

		this.send = function(options, callbacks) {
			
			if (!options) throw new Error("Please specify push options");

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getPushUrl();

			request.method = 'post';
			request.data = options;

			request.onSuccess = function(d) {
				promise.fulfill(d.id);
			};
			request.promise = promise;
			request.entity = options; 
			return global.Appacitive.http.send(request);
		};

		this.getNotification = function(notificationId, callbacks) {
			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			if (!notificationId) throw new Error("Please specify notification id");

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getGetNotificationUrl(notificationId);

			request.method = 'get';

			request.onSuccess = function(d) {
				promise.fulfill(d.pushnotification);
			};
			request.promise = promise;
			return global.Appacitive.http.send(request);
		};

		this.getAllNotifications = function(pagingInfo, callbacks) {
			
			if (!pagingInfo)
				pagingInfo = { pnum: 1, psize: 20 };
			else {
				pagingInfo.pnum = pagingInfo.pnum || 1;
				pagingInfo.psize = pagingInfo.psize || 20;
			}

			var promise = global.Appacitive.Promise.buildPromise(callbacks);

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getGetAllNotificationsUrl(pagingInfo);

			request.method = 'get';

			request.onSuccess = function(d) {
				promise.fulfill(d.pushnotifications, d.paginginfo);
			};
			request.promise = promise;
			return global.Appacitive.http.send(request);
		};

	};

	global.Appacitive.Push = new _pushManager();

})(global);
