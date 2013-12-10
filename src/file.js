(function (global) {

  "use strict";

  var _file = function(options) {
      
      options = options || {}; 
      this.fileId = options.fileId;
      this.contentType = options.contentType;
      this.fileData = options.fileData;
      var that = this;

      var _getUrls = function(url, onSuccess, promise) {
          var request = new global.Appacitive.HttpRequest();
          request.url = url;
          request.method = 'GET';
          request.onSuccess = onSuccess;
          request.promise = promise;
          request.entity = that;
          global.Appacitive.http.send(request); 
      };

      var _upload = function(url, file, type, onSuccess, promise) {
          var fd = new FormData();
          fd.append("fileToUpload", file);
          var request = new global.Appacitive.HttpRequest();
          request.url = url;
          request.method = 'PUT';
          request.data = file;
          request.headers.push({ key:'content-type', value: type });
          request.onSuccess = onSuccess;
          request.send().then(onSuccess, function() {
            promise.reject(d, that);
          });
      };

      this.save = function(callbacks) {
        if (this.fileId && _type.isString(this.fileId) && this.fileId.length > 0)
          return _update(callbacks);
        else
          return _create(callbacks);
      };

      var _create = function(callbacks) {
          if (!that.fileData) throw new Error('Please specify filedata');
          if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';
          try { that.contentType = file.type; } catch(e) {}

          var promise = global.Appacitive.Promise.buildPromise(callbacks);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUploadUrl(that.contentType, that.fileId ? that.fileId : '');
         
          _getUrls(url, function(response) {
                _upload(response.url, that.fileData, that.contentType, function() {
                    that.fileId = response.id;
                    
                    that.getDownloadUrl(function(res) {
                      return promise.fulfill(res, that);
                    }, function(e) {
                      return promise.reject(e);
                    });

                }, promise);
          }, promise);

          return promise;
      };

      var _update = function(callbacks) {
          if (!that.fileData) throw new Error('Please specify filedata');
          if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';
          try { that.contentType = file.type; } catch(e) {}
          
          var promise = global.Appacitive.Promise.buildPromise(callbacks);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUpdateUrl(that.fileId, that.contentType);
          
          _getUrls(url, function(response) {
              _upload(response.url, that.fileData, that.contentType, function() {
                  
                  that.getDownloadUrl().then(function(res) {
                    promise.fulfill(res, that);
                  }, function(e) {
                    promise.reject(e);
                  });

              }, promise);
          }, promise);

          return promise;
      };

      this.deleteFile = function(callbacks) {
          if (!this.fileId) throw new Error('Please specify fileId to delete');

          var promise = global.Appacitive.Promise.buildPromise(callbacks);

          var request = new global.Appacitive.HttpRequest();
          request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getDeleteUrl(this.fileId);
          request.method = 'DELETE';

          request.onSuccess = function(response) {
              promise.fulfill();
          };
          request.promise = promise;
          request.entity = that;
          return global.Appacitive.http.send(request); 
      };

      this.getDownloadUrl = function(callbacks) {
          if (!this.fileId) throw new Error('Please specify fileId to download');
          var expiry = 5560000;
          
          var promise = global.Appacitive.Promise.buildPromise(callbacks);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getDownloadUrl(this.fileId, expiry);
 
          _getUrls(url, function(response) {
              that.url = response.uri;
              promise.fulfill(response.uri);
          }, promise);

          return promise;
      };

      this.getUploadUrl = function(callbacks) {
          if (!that.contentType || !_type.isString(that.contentType) || that.contentType.length === 0) that.contentType = 'text/plain';

          var promise = global.Appacitive.Promise.buildPromise(callbacks);

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUploadUrl(this.contentType, this.fileId ? this.fileId : '');

          _getUrls(url, function(response) {
              that.url = response.url;
              promise.fulfill(response.url, that);
          }, promise);

          return promise;
      };
  };

  global.Appacitive.File = _file;

}(global));
