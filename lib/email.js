(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

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

        var _sendEmail = function(email, options) {

            var request = new Appacitive._Request({
                method: 'POST',
                type: 'email',
                op: 'getSendEmailUrl',
                options: options,
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


        this.sendTemplatedEmail = function(args, options) {

            if (!args || !args.to || !args.to.length || args.to.length === 0) {
                throw new Error('Atleast one receipient is mandatory to send an email');
            }
            if (!args.subject || args.subject.trim().length === 0) {
                throw new Error('Subject is mandatory to send an email');
            }

            if (!args.from && config.from) {
                throw new Error('from is mandatory to send an email. Set it in config or send it in options on the portal');
            }

            if (!args.templateName) {
                throw new Error('template name is mandatory to send an email');
            }

            var email = {
                to: args.to || [],
                cc: args.cc || [],
                bcc: args.bcc || [],
                subject: args.subject,
                from: args.from,
                body: {
                    templatename: args.templateName || '',
                    data: args.data || {},
                    ishtml: (args.isHtml === false) ? false : true
                }
            };

            if (args.useConfig) {
                email.smtp = config.smtp;
                if (!args.from && !config.from) {
                    throw new Error('from is mandatory to send an email. Set it in config or send it in options');
                }
                email.from = args.from || config.from;
                email.replyto = args.replyTo || config.replyto;
            }

            return _sendEmail(email, options);
        };

        this.sendRawEmail = function(args, options) {

            if (!args || !args.to || !args.to.length || args.to.length === 0) {
                throw new Error('Atleast one receipient is mandatory to send an email');
            }
            if (!args.subject || args.subject.trim().length === 0) {
                throw new Error('Subject is mandatory to send an email');
            }

            if (!args.from && config.from) {
                throw new Error('from is mandatory to send an email. Set it in config or send it in options on the portal');
            }

            if (!args.body) {
                throw new Error('body is mandatory to send an email');
            }

            var email = {
                to: args.to || [],
                cc: args.cc || [],
                bcc: args.bcc || [],
                subject: args.subject,
                from: args.from,
                body: {
                    content: args.body || '',
                    ishtml: (args.isHtml === false) ? false : true
                }
            };

            if (args.useConfig) {
                email.smtp = config.smtp;
                if (!args.from && !config.from) {
                    throw new Error('from is mandatory to send an email. Set it in config or send it in options');
                }
                email.from = args.from || config.from;
                email.replyto = args.replyTo || config.replyto;
            }

            return _sendEmail(email, options);
        };

    };

    Appacitive.Email = new _emailManager();

})(global);
