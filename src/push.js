(function(global) {

	"use strict";

	var _pushManager = function() {

		this.send = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if(!options)
				throw new Error("Please specify push options");

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getPushUrl();

			request.method = 'post';
			request.data = options;

			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.id);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};

			request.onError = function(d){
				onError(d || "Server error");
			}

			global.Appacitive.http.send(request);
		};

		this.getNotification = function(notificationId, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if(!notificationId)
				throw new Error("Please specify notification id");

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getGetNotificationUrl(notificationId);

			request.method = 'get';

			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.pushnotification);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};

			request.onError = function(d){
				onError(d || "Server error");
			}

			global.Appacitive.http.send(request);
		};

		this.getAllNotifications = function(pagingInfo, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if(!pagingInfo)
				pagingInfo = { pnum: 1, psize: 20 };
			else {
				pagingInfo.pnum = pagingInfo.pnum || 1;
				pagingInfo.psize = pagingInfo.psize || 20;
			}

			var request =  new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.push.getGetAllNotificationsUrl(pagingInfo);

			request.method = 'get';

			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.pushnotifications, d.paginginfo);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};

			request.onError = function(d){
				onError(d || "Server error");
			}

			global.Appacitive.http.send(request);
		};

	};

	global.Appacitive.Push = new _pushManager();

})(global);