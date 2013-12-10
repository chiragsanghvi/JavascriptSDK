(function (global) {

	"use strict";

	var _emailManager = function() {

		var config = {
			smtp: {
				username: null,
				password: null,
				host: "smtp.gmail.com",
				port: 465,
				enablessl: true
			},
			from: null,
			replyto: null
		};

		this.getConfig = function() {
			var _copy = config;
			return _copy;
		};

		var _sendEmail = function (email, callbacks) {
			
			var request = new global.Appacitive._Request({
				method: 'POST',
				type: 'email',
				op: 'getSendEmailUrl',
				callbacks: callbacks,
				data: email,
				entity: email,
				onSuccess: function(d) {
					request.promise.fulfill(d.email);
				}
			});
			return request.send();
		};

		this.setupEmail = function(options) {
			options = options || {};
			config.smtp.username = options.username || config.smtp.username;
			config.from = options.from || config.from;
			config.smtp.password = options.password || config.smtp.password;
			config.smtp.host = options.smtp.host || config.smtp.host;
			config.smtp.port = options.smtp.port || config.smtp.port;
			config.smtp.enablessl = options.enableSSL || config.smtp.enablessl;
			config.replyto = options.replyTo || config.replyto;
		};


		this.sendTemplatedEmail = function(options, callbacks) {
			
			if (!options || !options.to || !options.to.length || options.to.length === 0) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject || options.subject.trim().length === 0) {
				throw new Error('Subject is mandatory to send an email');
			}

			if(!options.from && config.from) {
				throw new Error('from is mandatory to send an email. Set it in config or send it in options on the portal');
			} 

			if (!options.templateName) {
				throw new Error('template name is mandatory to send an email');
			}

			var email = {
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject,
				from: options.from,
				body: {
					templatename: options.templateName || '',
					data : options.data || {},
					ishtml: (options.isHtml === false) ? false : true
				}
			};

			if (options.useConfig) {
				email.smtp = config.smtp;
				if(!options.from && !config.from) {
					throw new Error('from is mandatory to send an email. Set it in config or send it in options');
				}
				email.from = options.from || config.from;
				email.replyto = options.replyTo || config.replyto;
			}

			return _sendEmail(email, callbacks);
		};

		this.sendRawEmail = function(options, callbacks) {

			if (!options || !options.to || !options.to.length || options.to.length === 0) {
				throw new Error('Atleast one receipient is mandatory to send an email');
			}
			if (!options.subject || options.subject.trim().length === 0) {
				throw new Error('Subject is mandatory to send an email');
			}

			if(!options.from && config.from) {
				throw new Error('from is mandatory to send an email. Set it in config or send it in options on the portal');
			} 

			if (!options.body) {
				throw new Error('body is mandatory to send an email');
			} 

			var email = {
				to: options.to || [],
				cc: options.cc || [],
				bcc: options.bcc || [],
				subject: options.subject,
				from: options.from,
				body: {
					content: options.body || '',
					ishtml: (options.isHtml === false) ? false : true
				}
			};

			if (options.useConfig) {
				email.smtp = config.smtp;
				if(!options.from && !config.from) {
					throw new Error('from is mandatory to send an email. Set it in config or send it in options');
				}
				email.from = options.from || config.from;
				email.replyto = options.replyTo || config.replyto;
			}

			return _sendEmail(email, callbacks);
		};

	};

	global.Appacitive.Email = new _emailManager();

})(global);
