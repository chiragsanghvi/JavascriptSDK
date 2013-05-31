(function(global) {

  "use strict";

  var _file = function(options) {
      
      options = options || {}; 
      this.fileId = options.fileId;
      this.contentType = options.contentType;
      this.fileData = options.fileData;

      var _getUrls = function(url, onSuccess, onError) {
          var request = new global.Appacitive.HttpRequest();
          request.url = url;
          request.method = 'GET';
          request.onSuccess = onSuccess;
          request.onError = onError;
          global.Appacitive.http.send(request); 
      };

      var _upload = function(url, file, type, onSuccess, onError) {
          var fd = new FormData();
          fd.append("fileToUpload", file);
          var request = new global.Appacitive.HttpRequest();
          request.url = url;
          request.method = 'PUT';
          request.data = file;
          request.headers.push({ key:'content-type', value: type });
          request.onSuccess = onSuccess;
          request.onError = onError;
          request.send(true);
      };

      this.save = function(onSuccess, onError, contentType) {
        if (this.fileId && typeof this.fileId == 'string' && this.fileId.length > 0)
          _update(this, onSuccess, onError, contentType);
        else
          _create(this, onSuccess, onError, contentType);
      };

      var _create = function(that, onSuccess, onError, contentType) {
          if (!that.fileData) throw new Error('Please specify filedata');
          if (contentType || typeof contentType == 'string') that.contentType = contentType;
          else {
              if (!that.contentType || typeof contentType !== 'string' || that.contentType.length == 0) that.contentType = 'text/plain';
              try { that.contentType = file.type; } catch(e) {}
          }
          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUploadUrl(that.contentType);
          onSuccess = onSuccess || function(){};
          onError = onError || function(){};

          _getUrls(url, function(response) {
              if (response && response.status && response.status.code == '200') {
                _upload(response.url, that.fileData, that.contentType, function() {
                    that.fileId = response.id;
                    that.getDownloadUrl(function(res) {
                       onSuccess(res, that);
                    }, onError);
                }, onError);
              } else {
                if (typeof onError == 'function') onError(response.status, that);
              }
          }, onError);
      };

      var _update = function(that, onSuccess, onError, contentType) {
          if (!that.fileData) throw new Error('Please specify filedata');
          if (contentType || typeof contentType == 'string') that.contentType = contentType;
          else {
              if (!that.contentType || typeof contentType !== 'string' || that.contentType.length == 0) that.contentType = 'text/plain';
              try { that.contentType = file.type; } catch(e) {}
          }

          var url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getUpdateUrl(that.fileId, that.contentType);
          onSuccess = onSuccess || function() {};
          onError = onError || function() {};

          _getUrls(url, function(response) {
              if (response && response.status && response.status.code == '200') {
                _upload(response.url, that.fileData, that.contentType, function() {
                    that.getDownloadUrl(function(res) {
                       onSuccess(res, that);
                    }, onError);
                }, onError);
              } else {
                if (typeof onError == 'function') onError(response.status, that);
              }
          }, onError);
      };

      this.deleteFile = function(onSuccess, onError) {
          if (!this.fileId) throw new Error('Please specify fileId to delete');

          onSuccess = onSuccess || function() {};
          onError = onError || function() {};

          var request = new global.Appacitive.HttpRequest();
          request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getDeleteUrl(this.fileId);;
          request.method = 'DELETE';

          request.onSuccess = function(response) {
              if (response && response.code == '200') {
                  if (typeof onSuccess == 'function') onSuccess();
              } else if (typeof onError == 'function') {
                  if (typeof onError == 'function') onError(response, that);
              }
          };
          request.onError = onError;
          global.Appacitive.http.send(request);  
      };

      this.getDownloadUrl = function(onSuccess, onError) {
          if (!this.fileId) throw new Error('Please specify fileId to download');
          var expiry = 5560000;
          
          var that = this;
          onSuccess = onSuccess || function() {};
          onError = onError || function() {};

          var request = new global.Appacitive.HttpRequest();
          request.url = global.Appacitive.config.apiBaseUrl + global.Appacitive.storage.urlFactory.file.getDownloadUrl(this.fileId, expiry);
          request.method = 'GET';

          request.onSuccess = function(response) {
              if (response && response.status && response.status.code == '200') {
                  that.url = response.uri;
                  if (typeof onSuccess == 'function') onSuccess(response.uri);
              } else if (typeof onError == 'function') {
                  if (typeof onError == 'function') onError(response.status, that);
              }
          };
          request.onError = onError;
          global.Appacitive.http.send(request); 
      };

  };

  global.Appacitive.File = _file;

}(global));