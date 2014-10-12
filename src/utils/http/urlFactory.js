(function (global) {

    "use strict";

    var Appacitive = global.Appacitive;

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
        if (typeof (text) === 'undefined')
            text = '';

        var result = '';
        for (var x = 0; x < text.length; x = x + 1) {
            if (' .,;#'.indexOf(text[x]) === -1)
                result += text[x];
        }

        result = result.toLowerCase();

        return result;
    };

    String.contains = function (s1, s2) {
        return (s1.indexOf(s2) !== -1);
    };

    String.startsWith = function (s1, s2) {
        return (s1.indexOf(s2) === 0);
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

    Object.isEmpty = function (object) {
        if(!object) return true;
        var isEmpty = true;
        for (var keys in object) {
            isEmpty = false; 
            break; // exiting since we found that the object is not empty
        }
        return isEmpty;
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

        Appacitive.bag = Appacitive.bag || {};
        
        var baseUrl = (Appacitive.config || { apiBaseUrl: '' }).apiBaseUrl;
        
        var _getFields = function(fields) {
            if (typeof fields === 'object' && fields.length > 0 && (typeof fields[0] === 'string' || typeof fields[0] === 'number')) fields = fields.join(',');
            if (!fields) fields = '';
            return fields;
        };

        this.application = {
            applicationServiceUrl : 'application',

            getSessionCreateUrl: function() {
                return String.format("{0}/session", this.applicationServiceUrl);
            }
        };

        this.email = {
            emailServiceUrl: 'email',
            
            getSendEmailUrl: function() {
                return String.format("{0}/send", this.emailServiceUrl);
            }
        };
        this.user = {

            userServiceUrl:  'user',

            getCreateUrl: function (type, fields) {
                return String.format("{0}/create?fields={1}", this.userServiceUrl, _getFields(fields));
            },
            getAuthenticateUserUrl: function () {
                return String.format("{0}/authenticate", this.userServiceUrl);
            },
            getGetUrl: function (type, userId, fields) {
                return String.format("{0}/{1}?fields={2}", type, userId, _getFields(fields));
            },
            getUserByTokenUrl: function(userToken) {
                return String.format("{0}/me?useridtype=token&token={1}", this.userServiceUrl, userToken);
            },
            getUserByUsernameUrl: function(username) {
                return String.format("{0}/{1}?useridtype=username", this.userServiceUrl, username);
            },
            getUpdateUrl: function (userId, fields, revision) {
                if (!revision) {
                    return String.format("{0}/{1}?fields={2}", this.userServiceUrl, userId, _getFields(fields));
                } else {
                    return String.format("{0}/{1}?fields={2}&revision={3}", this.userServiceUrl, userId, _getFields(fields), revision);
                }
            },
            getDeleteUrl: function (type, userId, deleteConnections) {
                if (deleteConnections === true ) {
                    return String.format("{0}/{1}?deleteconnections=true", this.userServiceUrl, userId);
                } else {
                    return String.format("{0}/{1}", this.userServiceUrl, userId);
                }

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
            },
            getCheckinUrl: function(userId, lat, lng) {
                return String.format("{0}/{1}/chekin?lat={2}&lng={3}", this.userServiceUrl, userId, lat, lng);
            },
            getResetPasswordUrl: function(token) {
                return String.format("{0}/resetpassword?token={1}", this.userServiceUrl, token);
            },
            getValidateResetPasswordUrl: function(token) {
                return String.format("{0}/validateresetpasswordtoken?token={1}", this.userServiceUrl, token);
            }
        };
        this.device = {
            deviceServiceUrl: 'device',

            getCreateUrl: function (type, fields) {
                return String.format("{0}/register?fields={1}", this.deviceServiceUrl, _getFields(fields));
            },
            getGetUrl: function (type, deviceId, fields) {
                return String.format("{0}/{1}?fields={2}", this.deviceServiceUrl, deviceId, _getFields(fields));
            },
            getUpdateUrl: function (deviceId, fields, revision) {
                if (!revision) {
                    return String.format("{0}/{1}?fields={2}", this.deviceServiceUrl, deviceId, _getFields(fields));
                } else {
                    return String.format("{0}/{1}?fields={2}&revision={3}", this.deviceServiceUrl, deviceId, _getFields(fields), revision);
                }
            },
            getDeleteUrl: function (type, deviceId, deleteConnections) {
                if (deleteConnections === true ) {
                    return String.format('{0}/{1}?deleteconnections=true', this.deviceServiceUrl, deviceId);
                } else {
                    return String.format('{0}/{1}', this.deviceServiceUrl, deviceId);
                }
            }
        };
        this.object = {
            objectServiceUrl: 'object',

            getSearchAllUrl: function (typeName, queryParams, pageSize) {
                var url = '';

                url = String.format('{0}/search/{1}/all', this.objectServiceUrl, typeName);

                if (pageSize)
                    url = url + '?psize=' + pageSize;
                else
                    url = url + '?psize=10';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        if (queryParams[i].trim().length === 0) continue;
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getProjectionQueryUrl: function() {
                return String.format('{0}/search/project', this.objectServiceUrl);
            },
            getPropertiesSearchUrl: function (typeName, query) {
                return String.format('{0}/search/{1}/all?properties={2}', this.objectServiceUrl, typeName, query);
            },
            getMultiGetUrl: function (typeName, objectIds, fields) {
                return String.format('{0}/{1}/multiGet/{2}?fields={3}', this.objectServiceUrl, typeName, objectIds, _getFields(fields));
            },
            getCreateUrl: function (typeName, fields) {
                return String.format('{0}/{1}?fields={2}', this.objectServiceUrl, typeName, _getFields(fields));
            },
            getGetUrl: function (typeName, objectId, fields) {
                return String.format('{0}/{1}/{2}?fields={3}', this.objectServiceUrl, typeName, objectId, _getFields(fields));
            },
            getUpdateUrl: function (typeName, objectId, fields, revision) {
                if (!revision) {
                    return String.format('{0}/{1}/{2}?fields={3}', this.objectServiceUrl, typeName, objectId, _getFields(fields));
                } else {
                    return String.format('{0}/{1}/{2}?fields={3}&revision={4}', this.objectServiceUrl, typeName, objectId, _getFields(fields), revision);
                }
            },
            getDeleteUrl: function (typeName, objectId, deleteConnections) {
                if (deleteConnections === true ) {
                    return String.format('{0}/{1}/{2}?deleteconnections=true', this.objectServiceUrl, typeName, objectId);
                } else {
                    return String.format('{0}/{1}/{2}', this.objectServiceUrl, typeName, objectId);
                }
            },
            getMultiDeleteUrl: function (typeName) {
                return String.format('{0}/{1}/bulkdelete', this.objectServiceUrl, typeName);
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
            getUpdateUrl: function (relationName, connectionId, fields, revision) {
                if (!revision) {
                    return String.format('{0}/{1}/{2}?fields={3}', this.connectionServiceUrl, relationName, connectionId, _getFields(fields));
                } else {
                    return String.format('{0}/{1}/{2}?fields={3}&revision={4}', this.connectionServiceUrl, relationName, connectionId, _getFields(fields), revision);
                }
            },
            getDeleteUrl: function (relationName, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationName, connectionId);
            },
            getMultiDeleteUrl: function (relationName) {
                return String.format('{0}/{1}/bulkdelete', this.connectionServiceUrl, relationName);
            },
            getSearchByArticleUrl: function (relationName, objectId, label, queryParams) {
                var url = '';

                url = String.format('{0}/{1}/find/all?label={2}&objectid={3}', this.connectionServiceUrl, relationName, label, objectId);
                // url = url + '?psize=1000';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getConnectedArticles: function (relationName, objectId, queryParams) {
                var url = '';
                url = String.format('{0}/{1}/{2}/find', this.connectionServiceUrl, relationName, objectId);
                if (queryParams && queryParams.length && queryParams.length > 0) {
                    for (var x = 0; x < queryParams.length; x += 1) {
                        if (x === 0) {
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

            getUploadUrl: function (contentType, fileName) {
                if (fileName && fileName.length > 0) {
                    return String.format('{0}/uploadurl?contenttype={1}&expires=20&filename={2}', this.fileServiceUrl, escape(contentType), escape(fileName));
                } else {
                    return String.format('{0}/uploadurl?contenttype={1}&expires=20', this.fileServiceUrl, escape(contentType));
                }
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
                if (location.search === "" || location.search.indexOf("?") === -1) return match;
                if (!key) return location.search.split("?")[1].split("=");
                else {
                    key = key.toLowerCase();
                    var splitQuery = location.search.split("?")[1].split("&");
                    splitQuery.forEach(function (i, k) {
                        var splitKey = k.split("=");
                        var value = splitKey[1];
                        if (splitKey.length > 2) {
                            splitKey.forEach(function (ii, kk) {
                                if (ii === 0 || ii === 1) return;
                                value = value + "=" + splitKey[ii];
                            });
                        }
                        if (splitKey[0].toLowerCase() === key) match = [splitKey[0], value];
                    });
                    return match;
                }
            }
        };
        this.usergroup = {
            usergroupServiceUrl: 'usergroup',

            getUpdateUrl: function(groupId) {
                return String.format('{0}/{1}/members', this.usergroupServiceUrl, groupId);
            }
        };
        this.ping = {
            pingServiceUrl: 'ping',

            getPingUrl: function() {
                return String.format('{0}/', this.pingServiceUrl);
            }
        };
        this.multi = {
            multiServiceUrl: 'multi',

            getBatchUrl: function() {
                return String.format('{0}/', this.multiServiceUrl);
            }
        }

    };

    Appacitive.storage = Appacitive.storage || {};
    Appacitive.storage.urlFactory = new UrlFactory();

})(global);
