(function(global) {

  "use strict";

  var b64Digit = function(number) {
    if (number < 26) {
      return String.fromCharCode(65 + number);
    }
    if (number < 52) {
      return String.fromCharCode(97 + (number - 26));
    }
    if (number < 62) {
      return String.fromCharCode(48 + (number - 52));
    }
    if (number === 62) {
      return "+";
    }
    if (number === 63) {
      return "/";
    }
    throw "Tried to encode large digit " + number + " in base64.";
  };

  var encodeBase64 = function(array) {
    var chunks = [];
    chunks.length = Math.ceil(array.length / 3);
    _.times(chunks.length, function(i) {
      var b1 = array[i * 3];
      var b2 = array[i * 3 + 1] || 0;
      var b3 = array[i * 3 + 2] || 0;

      var has2 = (i * 3 + 1) < array.length;
      var has3 = (i * 3 + 2) < array.length;

      chunks[i] = [
        b64Digit((b1 >> 2) & 0x3F),
        b64Digit(((b1 << 4) & 0x30) | ((b2 >> 4) & 0x0F)),
        has2 ? b64Digit(((b2 << 2) & 0x3C) | ((b3 >> 6) & 0x03)) : "=",
        has3 ? b64Digit(b3 & 0x3F) : "="
      ].join("");
    });
    return chunks.join("");
  };

  
  // A list of file extensions to mime types as found here:
  // http://stackoverflow.com/questions/58510/using-net-how-can-you-find-the-
  //     mime-type-of-a-file-based-on-the-file-signature
  var notAllowedFileTypes = 'application/x-msdownload|application/exe|application/x-exe|application/dos-exe|vms/exe|application/x-winexe|application/msdos-windows|application/x-msdos-program|application/octet-stream';


  var checkFileType = function(type) {
    var notAllowedFileTypes = settings.notAllowedFileTypes.replace(/,/g, "|");
    if (notAllowedFileTypes.indexOf(type) != -1) {
        return false;
    }
    return true;
  }
  /**
   * Reads a File using a FileReader.
   * @param file {File} the File to read.
   * @param type {String} (optional) the mimetype to override with.
   * @return {Parse.Promise} A Promise that will be fulfilled with a
   *     base64-encoded string of the data and its mime type.
   */
  var readAsync = function(file, type) {
    var promise = new Parse.Promise();

    if (typeof(FileReader) === "undefined") {
      return Parse.Promise.error(new Parse.Error(
          -1, "Attempted to use a FileReader on an unsupported browser."));
    }

    var reader = new FileReader();
    reader.onloadend = function() {
      if (reader.readyState !== 2) {
        promise.reject(new Parse.Error(-1, "Error reading file."));
        return;
      }

      var dataURL = reader.result;
      var matches = /^data:([^;]*);base64,(.*)$/.exec(dataURL);
      if (!matches) {
        promise.reject(
            new Parse.Error(-1, "Unable to interpret data URL: " + dataURL));
        return;
      }

      promise.resolve(matches[2], type || matches[1]);
    };
    reader.readAsDataURL(file);
    return promise;
  };

  /**
   * A Parse.File is a local representation of a file that is saved to the Parse
   * cloud.
   * @param name {String} The file's name. This will change to a unique value
   *     once the file has finished saving.
   * @param data {Array} The data for the file, as either:
   *     1. an Array of byte value Numbers, or
   *     2. an Object like { base64: "..." } with a base64-encoded String.
   *     3. a File object selected with a file upload control. (3) only works
   *        in Firefox 3.6+, Safari 6.0.2+, Chrome 7+, and IE 10+.
   *        For example:<pre>
   * var fileUploadControl = $("#profilePhotoFileUpload")[0];
   * if (fileUploadControl.files.length > 0) {
   *   var file = fileUploadControl.files[0];
   *   var name = "photo.jpg";
   *   var parseFile = new Parse.File(name, file);
   *   parseFile.save().then(function() {
   *     // The file has been saved to Parse.
   *   }, function(error) {
   *     // The file either could not be read, or could not be saved to Parse.
   *   });
   * }</pre>
   * @param type {String} Optional Content-Type header to use for the file. If
   *     this is omitted, the content type will be inferred from the name's
   *     extension.
   */
  Parse.File = function(name, data, type) {
    this._name = name;

    // Guess the content type from the extension if we need to.
    var extension = /\.([^.]*)$/.exec(name);
    if (extension) {
      extension = extension[1].toLowerCase();
    }
    var guessedType = type || mimeTypes[extension] || "text/plain";

    if (_.isArray(data)) {
      this._source = Parse.Promise.as(encodeBase64(data), guessedType);
    } else if (data && data.base64) {
      this._source = Parse.Promise.as(data.base64, guessedType);
    } else if (typeof(File) !== "undefined" && data instanceof File) {
      this._source = readAsync(data, type);
    } else if (_.isString(data)) {
      throw "Creating a Parse.File from a String is not yet supported.";
    }
  };

  Parse.File.prototype = {

    /**
     * Gets the name of the file. Before save is called, this is the filename
     * given by the user. After save is called, that name gets prefixed with a
     * unique identifier.
     */
    name: function() {
      return this._name;
    },

    /**
     * Gets the url of the file. It is only available after you save the file or
     * after you get the file from a Parse.Object.
     * @return {String}
     */
    url: function() {
      return this._url;
    },

    /**
     * Saves the file to the Parse cloud.
     * @param {Object} options A Backbone-style options object.
     * @return {Parse.Promise} Promise that is resolved when the save finishes.
     */
    save: function(options) {
      var self = this;
      if (!self._previousSave) {
        self._previousSave = self._source.then(function(base64, type) {
          var data = {
            base64: base64,
            _ContentType: type
          };
          return Parse._request("files", self._name, null, 'POST', data);

        }).then(function(response) {
          self._name = response.name;
          self._url = response.url;
          return self;
        });
      }
      return self._previousSave._thenRunCallbacks(options);
    }
  };

}(global));