// monolithic file

(function(global
) {
    "use strict";

    var Appacitive = global.Appacitive;

    // httpBuffer class, stores a queue of the requests
    // and fires them. Global level pre and post processing 
    // goes here. 
    // requires httpTransport class that is able to actually 
    // send the request and receive the response
    /**
     * @constructor
     */
    var HttpBuffer = function(httpTransport) {

        // validate the httpTransport passed
        // and assign the callback
        if (!httpTransport || !httpTransport.send || !(typeof httpTransport.send == 'function')) {
            throw new Error('No applicable httpTransport class found');
        } else {
            httpTransport.onResponse = this.onResponse;
        }

        // internal handle to the http requests
        var _queue = [];

        // handle to the list of pre-processing functions
        var _preProcessors = {},
            _preCount = 0;

        // handle to the list of post-processing functions
        var _postProcessors = {},
            _postCount = 0;

        // public method to add a processor
        this.addProcessor = function(processor) {
            if (!processor) return;
            processor.pre = processor.pre || function() {};
            processor.post = processor.post || function() {};

            addPreprocessor(processor.pre);
            addPostprocessor(processor.post);
        };

        // stores a preprocessor
        // returns a numeric id that can be used to remove this processor
        var addPreprocessor = function(preprocessor) {
            _preCount += 1;
            _preProcessors[_preCount] = preprocessor;
            return _preCount;
        };

        // removes a preprocessor
        // returns true if it exists and has been removed successfully
        // else false
        var removePreprocessor = function(id) {
            if (_preProcessors[id]) {
                delete(_preProcessors[id]);
                return true;
            } else {
                return false;
            }
        };

        // stores a postprocessor
        // returns a numeric id that can be used to remove this processor
        var addPostprocessor = function(postprocessor) {
            _postCount += 1;
            _postProcessors[_postCount] = postprocessor;
            return _postCount;
        };

        // removes a postprocessor
        // returns true if it exists and has been removed successfully
        // else false
        var removePostprocessor = function(id) {
            if (_postProcessors[id]) {
                delete(_postProcessors[id]);
                return true;
            } else {
                return false;
            }
        };

        // enqueues a request in the queue
        // returns true is succesfully added
        this.enqueueRequest = function(request) {
            _queue.push(request);
        };


        this.changeRequestForCors = function(request) {
            var body = {
                m: request.method.toUpperCase()
            };
            request.headers.forEach(function(h) {
                body[h.key] = h.value;
            });
            request.prevHeaders = request.headers;
            request.headers = [];
            request.headers.push({
                key: 'Content-Type',
                value: 'text/plain; charset=utf-8'
            });
            request.method = 'POST';

            if (request.data) body.b = request.data;
            delete request.data;

            if (Appacitive.config.debug) {
                if (request.url.indexOf('?') === -1) request.url = request.url + '?debug=true';
                else request.url = request.url + '&debug=true';
            }

            if (Appacitive.config.metadata) {
                if (request.url.indexOf('?') === -1) request.url = request.url + '?metadata=true';
                else request.url = request.url + '&metadata=true';
            }

            try {
                request.data = JSON.stringify(body);
            } catch (e) {}
            return request;
        };

        // notifies the queue that there are requests pending
        // this will start firing the requests via the method 
        // passed while initalizing
        this.notify = function() {
            if (_queue.length === 0) return;

            // for convienience, extract the postprocessing object into an array
            var _callbacks = [];
            for (var processor in _postProcessors) {
                if (_postProcessors.hasOwnProperty(processor)) {
                    _callbacks.push(_postProcessors[processor]);
                }
            }

            while (_queue.length > 0) {
                var toFire = _queue.shift();

                // execute the preprocessors
                // if they return anything, pass it along
                // to be able to access it in the post processing callbacks
                var _state = [];
                for (var processor in _preProcessors) {
                    if (_preProcessors.hasOwnProperty(processor)) {
                        _state.push(_preProcessors[processor](toFire));
                    }
                }

                this.changeRequestForCors(toFire);

                // send the requests
                // and the callbacks and the 
                // results returned from the preprocessors
                httpTransport.send(toFire, _callbacks, _state);
            }
        };

        // callback to be invoked when a request has completed
        this.onResponse = function(responseData) {
            console.dir(responseData);
        };

    };

    // base httpTransport class
    /**
     * @constructor
     */
    var _HttpTransport = function() {
        var _notImplemented = function() {
            throw new Error('Not Implemented Exception');
        };
        var _notProvided = function() {
            throw new Error('Delegate not provided');
        };

        // implements this
        this.send = _notImplemented;
        this.inOnline = _notImplemented;

        // needs these callbacks to be set
        this.onResponse = function(response, request) {
            _notImplemented();
        };
        this.onError = function(request) {
            _notImplemented();
        };
    };

    // httpRequest class, encapsulates the request 
    // without bothering about how it is going to be fired.
    /**
     * @constructor
     */
    var HttpRequest = function(o) {
        o = o || {};
        this.url = o.url || '';
        this.data = o.data || {};
        this.headers = o.headers || [];
        this.method = o.method || 'GET';
        this.onSuccess = o.onSuccess || function() {};
        this.onError = o.onError || function() {};

        this.send = function(doNotStringify) {
            return new Appacitive._Http(this, doNotStringify);
        };
    };

    // browser based http transport class
    /**
     * @constructor
     */
    var BasicHttpTransport = function() {

        var _super = new _HttpTransport();

        _super.isOnline = function() {
            return true;
        };

        var _executeCallbacks = function(response, callbacks, states) {
            if (callbacks.length != states.length) {
                throw new Error('Callback length and state length mismatch!');
            }
            for (var x = 0; x < callbacks.length; x += 1) {
                callbacks[x].apply({}, [response, states[x]]);
            }
        };

        var that = _super;

        var _trigger = function(request, callbacks, states) {
            request.options = request.options || {};
            new Appacitive._Http({
                method: request.method,
                url: request.url,
                headers: request.headers,
                data: request.data,
                sync: request.options.sync,
                onSuccess: function(data, xhr) {
                    if (!data) {
                        that.onError(request, {
                            responseText: {
                                code: '400',
                                message: 'Invalid request'
                            }
                        });
                        return;
                    }
                    try {
                        data = JSON.parse(data);
                    } catch (e) {}

                    // execute the callbacks first
                    _executeCallbacks(data, callbacks, states);

                    if ((data.code >= 200 && data.code <= 300) || (data.status && data.status.code >= 200 && data.status.code <= 300)) {
                        that.onResponse(request, data);
                    } else {
                        data = data || {};
                        data = data.status || data;
                        data.message = data.message || 'Bad Request';
                        data.code = data.code || '400';
                        that.onError(request, {
                            responseText: data
                        });
                    }
                },
                onError: function(xhr, error) {
                    var data = {};

                    if (error) {
                        data = Appacitive.Error.toJSON(error);
                    } else {
                        data.message = xhr.responseData || xhr.responseText || 'Bad Request';
                        data.code = xhr.status || '400';
                    }
                    that.onError(request, {
                        responseText: data
                    });
                }
            });
        };

        _super.send = function(request, callbacks, states) {
            if (!Appacitive.Session.initialized) throw new Error("Initialize Appacitive SDK");
            if (typeof request.beforeSend == 'function') {
                request.beforeSend(request);
            }
            _trigger(request, callbacks, states);
        };

        return _super;
    };

    // http functionality provider
    /**
     * @constructor
     */
    var HttpProvider = function() {

        // actual http provider
        //var _inner = Appacitive.runtime.isBrowser ? new JQueryHttpTransport() : new NodeHttpTransport();
        var _inner = new BasicHttpTransport();

        // the http buffer
        var _buffer = new HttpBuffer(_inner);

        // used to pause/unpause the provider
        var _paused = false;

        // allow pausing/unpausing
        this.pause = function() {
            _paused = true;
        };

        this.unpause = function() {
            _paused = false;
        };

        // allow adding processors to the buffer
        this.addProcessor = function(processor) {
            var _processorError = new Error('Must provide a processor object with either a "pre" function or a "post" function.');
            if (!processor) throw _processorError;
            if (!processor.pre && !processor.post) throw _processorError;

            _buffer.addProcessor(processor);
        };

        // the method used to send the requests
        this.send = function(request) {

            request.promise = (Appacitive.Promise.is(request.promise)) ? request.promise : new Appacitive.Promise.buildPromise({
                error: request.onError
            });

            _buffer.enqueueRequest(request);

            // notify the queue if the actual transport 
            // is ready to send the requests
            if (_inner.isOnline() && _paused === false) {
                _buffer.notify();
            }

            return request.promise;
        };

        // method used to clear the queue
        this.flush = function(force) {
            if (!force) {
                if (_inner.isOnline()) {
                    _buffer.notify();
                }
            } else {
                _buffer.notify();
            }
        };

        // the error handler
        this.onError = function(request, response) {
            var error = response.responseText;
            Appacitive.logs.logRequest(request, error, error, 'error');

            if (request.entity && request.entity._triggerError) request.entity._triggerError(request.options, new Appacitive.Error(error));

            request.promise.reject(new Appacitive.Error(error), request.entity);
        };
        _inner.onError = this.onError;

        // the success handler
        this.onResponse = function(request, response) {
            if (request.onSuccess) {
                if (request.context) {
                    request.onSuccess.apply(request.context, [response]);
                } else {
                    request.onSuccess(response);
                }
            }
            Appacitive.logs.logRequest(request, response, response ? response.status : null, 'successful');
        };
        _inner.onResponse = this.onResponse;
    };

    // create the http provider and the request
    Appacitive.http = new HttpProvider();
    Appacitive.HttpRequest = HttpRequest;

    /* PLUGIN: Http Utilities */

    // compulsory plugin
    // handles session and shits
    (function(global) {

        var Appacitive = global.Appacitive;

        if (!Appacitive) return;
        if (!Appacitive.http) return;

        Appacitive.http.addProcessor({
            pre: function(request) {
                return request;
            },
            post: function(response, request) {
                try {
                    var _valid = Appacitive.Session.isSessionValid(response);
                    if (!_valid.status) {
                        if (_valid.isSession) {
                            if (Appacitive.Session.get() !== null) {
                                Appacitive.Session.resetSession();
                            }
                            Appacitive.http.send(request);
                        }
                    } else {

                        if (response && ((response.status && response.status.code && (response.status.code == '19036' || response.status.code == '421')) || (response.code && (response.code == '19036' || response.code == '421')))) {
                            Appacitive.Users.logout();
                        } else {
                            Appacitive.Session.incrementExpiry();
                        }
                    }
                } catch (e) {}
            }
        });

        Appacitive.http.addProcessor({
            pre: function(req) {
                return {
                    start: new Date().getTime(),
                    request: req
                };
            },
            post: function(response, args) {
                args.request.timeTakenInMilliseconds = new Date().getTime() - args.start;
            }
        });

    })(global);

    /* Http Utilities */

})(global);
