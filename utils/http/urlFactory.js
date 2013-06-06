(function (global) {
    /**
     * @param {...string} var_args
     */
    String.format = function (text, var_args) {
        if (arguments.length <= 1) {
            return text;
        }
        var tokenCount = arguments.length - 2;
        for (var token = 0; token <= tokenCount; token++) {
            //iterate through the tokens and replace their placeholders from the original text in order
            text = text.replace(new RegExp("\\{" + token + "\\}", "gi"),
                                                arguments[token + 1]);
        }
        return text;
    };
    String.prototype.toPascalCase = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    String.prototype.trimChar = function (char1) {
        var pattern = new RegExp("^" + char1);
        var returnStr = this;
        if (pattern.test(returnStr)) returnStr = returnStr.slice(1, returnStr.length);
        pattern = new RegExp(char1 + "$");
        if (pattern.test(returnStr)) returnStr = returnStr.slice(0, -1);
        return returnStr;
    };
    String.toSearchString = function (text) {
        if (typeof (text) == 'undefined')
            text = '';

        var result = '';
        for (var x = 0; x < text.length; x = x + 1) {
            if (' .,;#'.indexOf(text[x]) == -1)
                result += text[x];
        }

        result = result.toLowerCase();

        return result;
    };

    String.contains = function (s1, s2) {
        return (s1.indexOf(s2) != -1);
    }

    String.startsWith = function (s1, s2) {
        return (s1.indexOf(s2) == 0);
    };

    Array.distinct = function(orgArr) {
        var newArr = [],
            origLen = orgArr.length,
            found,
            x, y;
            
        for ( x = 0; x < origLen; x++ ) {
            found = undefined;
            for ( y = 0; y < newArr.length; y++ ) {
                if ( orgArr[x].toLowerCase() === newArr[y].toLowerCase() ) { 
                  found = true;
                  break;
                }
            }
            if (!found) newArr.push(orgArr[x]);    
        }
       return newArr;
    };

    global.dateFromWcf = function (input, throwOnInvalidInput) {
        var pattern = /Date\(([^)]+)\)/;
        var results = pattern.exec(input);
        if (results.length != 2) {
            if (!throwOnInvalidInput) {
                return s;
            }
            throw new Error(s + " is not .net json date.");
        }
        return new Date(parseFloat(results[1]));
    };

    /**
     * @constructor
     */
    var UrlFactory = function () {

        global.Appacitive.bag = global.Appacitive.bag || {};
        
        var baseUrl = (global.Appacitive.config || { apiBaseUrl: '' }).apiBaseUrl;
        
        var _getFields = function(fields) {
            if (typeof fields == 'object' && fields.length > 0 && (typeof fields[0] == 'string' || typeof fields[0] == 'number')) fields = fields.join(',');
            if (!fields) fields = '';
            return fields;
        };

        this.email = {
            emailServiceUrl: 'email',
            
            getSendEmailUrl: function() {
                return String.format("{0}/send", this.emailServiceUrl)
            }
        };
        this.user = {

            userServiceUrl:  'user',

            getCreateUrl: function (fields) {
                return String.format("{0}/create?fields={1}", this.userServiceUrl, _getFields(fields));
            },
            getAuthenticateUserUrl: function () {
                return String.format("{0}/authenticate", this.userServiceUrl);
            },
            getGetUrl: function (userId, fields) {
                return String.format("{0}/{1}?fields={2}", this.userServiceUrl, userId, _getFields(fields));
            },
            getUpdateUrl: function (userId, fields) {
                return String.format("{0}/{1}?fields={2}", this.userServiceUrl, userId, _getFields(fields));
            },
            getDeleteUrl: function (userId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getGetAllLinkedAccountsUrl: function(userId) {
                var url = String.format("{0}/{1}/linkedaccounts", this.userServiceUrl, userId);
                return url;
            },
            getValidateTokenUrl: function(token) {
                return String.format("{0}/validate?userToken={1}", this.userServiceUrl, token);
            },
            getInvalidateTokenUrl: function(token) {
                return String.format("{0}/invalidate?userToken={1}", this.userServiceUrl, token);
            },
            getSendResetPasswordEmailUrl: function() {
                return String.format("{0}/sendresetpasswordemail", this.userServiceUrl);
            },
            getUpdatePasswordUrl: function(userId) {
                return String.format("{0}/{1}/changepassword", this.userServiceUrl, userId);
            },
            getLinkAccountUrl: function(userId) {
                return String.format("{0}/{1}/link", this.userServiceUrl, userId);
            },
            getDelinkAccountUrl: function(userId, type){
                return String.format("{0}/{1}/{2}/delink", this.userServiceUrl, userId, type);
            }
        };
        this.device = {
            deviceServiceUrl: 'device',

            getCreateUrl: function (fields) {
                return String.format("{0}/register?fields={1}", this.deviceServiceUrl, _getFields(fields));
            },
            getGetUrl: function (deviceId, fields) {
                return String.format("{0}/{1}?fields={2}", this.deviceServiceUrl, deviceId, _getFields(fields));
            },
            getUpdateUrl: function (deviceId, fields) {
                return String.format("{0}/{1}?fields={2}", this.deviceServiceUrl, deviceId, _getFields(fields));
            },
            getDeleteUrl: function (deviceId) {
                return String.format("{0}/{1}", this.deviceServiceUrl, deviceId);
            }
        };
        this.article = {
            articleServiceUrl: 'article',

            getSearchAllUrl: function (schemaName, queryParams, pageSize) {
                var url = '';

                url = String.format('{0}/search/{1}/all', this.articleServiceUrl, schemaName);

                if (pageSize)
                    url = url + '?psize=' + pageSize;
                else
                    url = url + '?psize=10';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        if (queryParams[i].trim().length == 0) continue;
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getProjectionQueryUrl: function() {
                return String.format('{0}/search/project', this.articleServiceUrl);
            },
            getPropertiesSearchUrl: function (schemaName, query) {
                return String.format('{0}/search/{1}/all?properties={2}', this.articleServiceUrl, schemaName, query);
            },
            getMultiGetUrl: function (schemaName, articleIds, fields) {
                return String.format('{0}/{1}/multiGet/{2}?fields={3}', this.articleServiceUrl, schemaName, articleIds, _getFields(fields));
            },
            getCreateUrl: function (schemaName, fields) {
                return String.format('{0}/{1}?fields={2}', this.articleServiceUrl, schemaName, _getFields(fields));
            },
            getGetUrl: function (schemaName, articleId, fields) {
                return String.format('{0}/{1}/{2}?fields={3}', this.articleServiceUrl, schemaName, articleId, _getFields(fields));
            },
            getUpdateUrl: function (schemaName, articleId, fields) {
                return String.format('{0}/{1}/{2}?fields={3}', this.articleServiceUrl, schemaName, articleId, _getFields(fields));
            },
            getDeleteUrl: function (schemaName, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaName, articleId);
            },
            getMultiDeleteUrl: function (schemaName) {
                return String.format('{0}/{1}/bulkdelete', this.articleServiceUrl, schemaName);
            }
        };
        this.connection = {

            connectionServiceUrl: 'connection',

            getGetUrl: function (relationName, connectionId, fields) {
                return String.format('{0}/{1}/{2}?fields={3}', this.connectionServiceUrl, relationName, connectionId, _getFields(fields));
            },
            getMultiGetUrl: function (relationName, connectionIds, fields) {
                return String.format('{0}/{1}/multiGet/{2}?fields={3}', this.connectionServiceUrl, relationName, connectionIds, _getFields(fields));
            },
            getCreateUrl: function (relationName, fields) {
                return String.format('{0}/{1}?fields={2}', this.connectionServiceUrl, relationName, _getFields(fields));
            },
            getUpdateUrl: function (relationName, connectionId, fields) {
                return String.format('{0}/{1}/{2}?fields={3}', this.connectionServiceUrl, relationName, connectionId, _getFields(fields));
            },
            getDeleteUrl: function (relationName, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationName, connectionId);
            },
            getMultiDeleteUrl: function (relationName) {
                return String.format('{0}/{1}/bulkdelete', this.connectionServiceUrl, relationName);
            },
            getSearchByArticleUrl: function (relationName, articleId, label, queryParams) {
                var url = '';

                url = String.format('{0}/{1}/find/all?label={2}&articleid={3}', this.connectionServiceUrl, relationName, label, articleId);
                // url = url + '?psize=1000';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getConnectedArticles: function (relationName, articleId, queryParams) {
                var url = '';
                url = String.format('{0}/{1}/{2}/find', this.connectionServiceUrl, relationName, articleId);
                if (queryParams && queryParams.length && queryParams.length > 0) {
                    for (var x = 0; x < queryParams.length; x += 1) {
                        if (x == 0) {
                            url += '?' + queryParams[x];
                        } else {
                            url += '&' + queryParams[x];
                        }
                    }
                }
                return url;
            },
            getInterconnectsUrl: function () {
                return String.format('{0}/interconnects', this.connectionServiceUrl);
            },
            getPropertiesSearchUrl: function (relationName, query) {
                return String.format('{0}/{1}/find/all?properties=', this.connectionServiceUrl, relationName, query);
            }
        };
        this.cannedList = {

            cannedListServiceUrl: 'list',

            getGetListItemsUrl: function (cannedListId) {
                return String.format('{0}/list/{1}/contents', this.cannedListServiceUrl, cannedListId);
            }
        };
        this.push = {
            
            pushServiceUrl: 'push',

            getPushUrl: function () {
                return String.format('{0}/', this.pushServiceUrl);
            },

            getGetNotificationUrl: function (notificationId) {
                return String.format('{0}/notification/{1}', this.pushServiceUrl, notificationId);
            },

            getGetAllNotificationsUrl: function (pagingInfo) {
                return String.format('{0}/getAll?psize={1}&pnum={2}', this.pushServiceUrl, pagingInfo.psize, pagingInfo.pnum);
            }
        };
        this.file = {

            fileServiceUrl: 'file',

            getUploadUrl: function (contentType) {
                return String.format('{0}/uploadurl?contenttype={1}&expires=20', this.fileServiceUrl, escape(contentType));
            },

            getUpdateUrl: function (fileId, contentType) {
                return String.format('{0}/updateurl/{1}?contenttype={2}&expires=20', this.fileServiceUrl, fileId, escape(contentType));
            },

            getDownloadUrl: function (fileId, expiryTime) {
                return String.format('{0}/download/{1}?expires={2}', this.fileServiceUrl, fileId, expiryTime);
            },

            getDeleteUrl: function (fileId) {
                return String.format('{0}/delete/{1}', this.fileServiceUrl, fileId);
            }
        };
        this.query = {
            params: function (key) {
                var match = [];
                if (location.search == "" || location.search.indexOf("?") == -1) return match;
                if (!key) return location.search.split("?")[1].split("=");
                else {
                    key = key.toLowerCase();
                    var splitQuery = location.search.split("?")[1].split("&");
                    splitQuery.forEach(function (i, k) {
                        var splitKey = k.split("=");
                        var value = splitKey[1];
                        if (splitKey.length > 2) {
                            splitKey.forEach(function (ii, kk) {
                                if (ii == 0 || ii == 1) return;
                                value = value + "=" + splitKey[ii];
                            });
                        }
                        if (splitKey[0].toLowerCase() == key) match = [splitKey[0], value];
                    });
                    return match;
                }
            }
        };

    }

    global.Appacitive.storage = global.Appacitive.storage || {};
    global.Appacitive.storage.urlFactory = new UrlFactory();

})(global);