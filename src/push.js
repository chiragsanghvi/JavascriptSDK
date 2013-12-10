(function (global) {

	"use strict";

	var _pushManager = function() {

		this.send = function(options, callbacks) {
			
			if (!options) throw new Error("Please specify push options");

			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'push',
				op: 'getPushUrl',
				callbacks: callbacks,
				data: options,
				entity: options,
				onSuccess: function(d) {
					request.promise.fulfill(d.id);
				}
			});
			return request.send();
		};

		this.getNotification = function(notificationId, callbacks) {

			if (!notificationId) throw new Error("Please specify notification id");

			var request = new global.Appacitive._Request({
				method: 'GET',
				type: 'push',
				op: 'getGetNotificationUrl',
				args: [notificationId],
				callbacks: callbacks,
				onSuccess: function(d) {
					request.promise.fulfill(d.pushnotification);
				}
			});
			return request.send();
		};

		this.getAllNotifications = function(pagingInfo, callbacks) {
			
			if (!pagingInfo)
				pagingInfo = { pnum: 1, psize: 20 };
			else {
				pagingInfo.pnum = pagingInfo.pnum || 1;
				pagingInfo.psize = pagingInfo.psize || 20;
			}

			var request = new global.Appacitive._Request({
				method: 'GET',
				type: 'push',
				op: 'getGetAllNotificationsUrl',
				args: [pagingInfo],
				callbacks: callbacks,
				onSuccess: function(d) {
					request.promise.fulfill(d.pushnotifications, d.paginginfo);
				}
			});
			return request.send();
		};

	};

	global.Appacitive.Push = new _pushManager();

})(global);
