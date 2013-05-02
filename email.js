(function(global) {

	"use strict";

	var _emailManager = function() {

		var config = {
			username: null,
			from: null,
			frompassword: null,
			smtphost: 'smtp.google.com',
			smtpport: 587,
			enablessl: true,
			replyto: null
		};

		this.getConfig = function() {
			var _copy = config;
			return _copy;
		};

		this.sendTemplatedEmail = function(options) {
			throw new Error('Not implemented yet');
		};

		this.setupEmail = function(options) {
			options = options || {};
			config.username = options.username || config.username;
			config.from = options.from || config.from;
			config.frompassword = options.frompassword || config.frompassword;
			config.smtphost = options.smtphost || config.smtphost;
			config.smtpport = options.smtpport || config.smtpport;
			config.enablessl = options.enablessl || config.enablessl;
			config.replyto = options.replyto || config.replyto;
		};

		this.sendRawEmail = function(options, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};

			if (!options || !options.to || !options.to.length || options.to.length != 1) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject) {
				throw new Error('Subject is mandatory to send an email');
			}

			var email = {
				configuration: config,
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject || 'Appacitive',
				body: {
					"BodyText": options.body || '',
					"IsBodyHTML": true,
					"__type": "RawBody"
				}
			};
			var request = new global.Appacitive.HttpRequest();
			request.url = global.Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.email.getSendEmailUrl();
			request.method = 'post';
			request.data = email;
			request.onSuccess = function(d) {
				if (d && d.status && d.status.code == '200') {
					onSuccess(d.email);
				} else {
					d = d || {};
					d.status = d.status || {};
					onError(d.status.message || 'Server error');
				}
			};
			global.Appacitive.http.send(request);
		};

	};

	global.Appacitive.email = new _emailManager();

})(global);