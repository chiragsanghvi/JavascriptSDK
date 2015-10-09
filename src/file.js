(function(global) {

    "use strict";

    var Appacitive = global.Appacitive;
    var _type = Appacitive.utils._type;
    var _extend = Appacitive.utils._extend;
    var _deepExtend = Appacitive.utils._deepExtend;

    var _file = function(ops) {

        ops = ops || {};
        this.fileId = ops.fileId;
        this.contentType = ops.contentType;
        this.fileData = ops.fileData;
        var that = this;

        var _getUrls = function(url, onSuccess, promise, description, options) {
            var request = new Appacitive.HttpRequest();
            request.url = url;
            request.method = 'GET';
            request.description = description;
            request.onSuccess = onSuccess;
            request.promise = promise;
            request.entity = that;
            request.options = options;
            Appacitive.http.send(request);
        };

        var _upload = function(url, file, type, onSuccess, promise) {
            var request = new Appacitive.HttpRequest();
            request.url = url;
            request.method = 'PUT';
            request.log = false;
            request.description = 'Upload file';
            request.data = file;
            request.headers.push({
                key: 'Content-Type',
                value: type
            });
            request.send().then(onSuccess, function(d) {
                promise.reject(d, that);
            });
        };

        this.save = function(expiry, options) {
            if (typeof expiry !== 'number') {
                options = expiry;
                expiry = -1;
            }

            if (this.fileId && _type.isString(this.fileId) && this.fileId.length > 0)
                return _update(expiry, options);
            else
                return _create(expiry, options);
        };

        var _create = function(expiry, options) {
            if (!that.fileData) throw new Error('Please specify filedata');
            if (!that.contentType) {
                try {
                    that.contentType = that.fileData.type;
                } catch (e) {}
            }
            if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';

            var promise = Appacitive.Promise.buildPromise(options);

            var url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.file.getUploadUrl(that.contentType, that.fileId ? that.fileId : '');

            _getUrls(url, function(response) {
                _upload(response.url, that.fileData, that.contentType, function() {
                    that.fileId = response.id;

                    that.getDownloadUrl(expiry, options).then(function(res) {
                        return promise.fulfill(res, that);
                    }, function(e) {
                        return promise.reject(e);
                    });

                }, promise);
            }, promise, ' Get upload url for file ', options);

            return promise;
        };

        var _update = function(expiry, options) {
            if (!that.fileData) throw new Error('Please specify filedata');
            if (!that.contentType) {
                try {
                    that.contentType = that.fileData.type;
                } catch (e) {}
            }
            if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';

            var promise = Appacitive.Promise.buildPromise(options);

            var url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.file.getUpdateUrl(that.fileId, that.contentType);

            _getUrls(url, function(response) {
                _upload(response.url, that.fileData, that.contentType, function() {

                    that.getDownloadUrl(expiry, options).then(function(res) {
                        promise.fulfill(res, that);
                    }, function(e) {
                        promise.reject(e);
                    });

                }, promise);
            }, promise, ' Get update url for file ' + that.fileId, options);

            return promise;
        };

        this.destroy = function(options) {
            if (!this.fileId) throw new Error('Please specify fileId to delete');

            var promise = Appacitive.Promise.buildPromise(options);

            var request = new Appacitive.HttpRequest();
            request.url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.file.getDeleteUrl(this.fileId);
            request.method = 'DELETE';
            request.description = 'Delete file with id ' + this.fileId;
            request.onSuccess = function(response) {
                promise.fulfill();
            };
            request.promise = promise;
            request.entity = that;
            request.options = options;
            return Appacitive.http.send(request);
        };

        this.getDownloadUrl = function(expiry, options) {
            if (!this.fileId) throw new Error('Please specify fileId to download');

            if (typeof expiry !== 'number') {
                options = expiry;
                expiry = -1;
            }

            var promise = Appacitive.Promise.buildPromise(options);

            var url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.file.getDownloadUrl(this.fileId, expiry);

            _getUrls(url, function(response) {
                that.url = response.uri;
                promise.fulfill(response.uri);
            }, promise, ' Get download url for file ' + this.fileId, options);

            return promise;
        };

        this.getUploadUrl = function(options) {
            if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';

            var promise = Appacitive.Promise.buildPromise(options);

            var url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.file.getUploadUrl(this.contentType, this.fileId ? this.fileId : '');

            _getUrls(url, function(response) {
                that.url = response.url;
                promise.fulfill(response.url, that);
            }, promise, ' Get upload url for file ' + this.fileId, options);

            return promise;
        };
    };

    Appacitive.File = _file;

}(global));
