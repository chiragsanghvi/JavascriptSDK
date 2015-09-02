(function (global) {

	"use strict";

	var Appacitive = global.Appacitive;

	var _pushManager = function() {

		this.send = function(args, options) {
			
			if (!args) throw new Error("Please specify push options");

			var request = new Appacitive._Request({
				method: 'POST',
				type: 'push',
				op: 'getPushUrl',
				options: options,
				data: args,
				entity: args,
				onSuccess: function(d) {
					request.promise.fulfill(d.id);
				}
			});
			return request.send();
		};

		this.getNotification = function(notificationId, options) {

			if (!notificationId) throw new Error("Please specify notification id");

			var request = new Appacitive._Request({
				method: 'GET',
				type: 'push',
				op: 'getGetNotificationUrl',
				args: [notificationId],
				options: options,
				onSuccess: function(d) {
					request.promise.fulfill(d.pushnotification);
				}
			});
			return request.send();
		};

		this.getAllNotifications = function(pagingInfo, options) {
			
			if (!pagingInfo)
				pagingInfo = { pnum: 1, psize: 20 };
			else {
				pagingInfo.pnum = pagingInfo.pnum || 1;
				pagingInfo.psize = pagingInfo.psize || 20;
			}

			var request = new Appacitive._Request({
				method: 'GET',
				type: 'push',
				op: 'getGetAllNotificationsUrl',
				args: [pagingInfo],
				options: options,
				onSuccess: function(d) {
					request.promise.fulfill(d.pushnotifications, d.paginginfo);
				}
			});
			return request.send();
		};

	};

	Appacitive.Push = new _pushManager();

})(global);
