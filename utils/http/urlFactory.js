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
    }

    String.contains = function (s1, s2) {
        return (s1.indexOf(s2) != -1);
    }

    String.startsWith = function (s1, s2) {
        return (s1.indexOf(s2) == 0);
    }

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
    }

    /**
     * @constructor
     */
    var UrlFactory = function () {
        global.Appacitive.bag = global.Appacitive.bag || {};
        global.Appacitive.bag.accountName = global.Appacitive.bag.accountName || {};
        global.Appacitive.bag.selectedType = global.Appacitive.bag.selectedType || {};

        global.Appacitive.bag.apps = global.Appacitive.bag.apps || {};
        global.Appacitive.bag.apps.selected = global.Appacitive.bag.apps.selected || {};
        global.Appacitive.bag.apps.selected.name = global.Appacitive.bag.apps.selected.name || {};

        global.Appacitive.bag.selectedCatalog = global.Appacitive.bag.selectedCatalog || {};
        global.Appacitive.bag.selectedCatalog.Id = global.Appacitive.bag.selectedCatalog.Id || 0;
        global.Appacitive.bag.selectedCatalog.blueprintid = global.Appacitive.bag.selectedCatalog.blueprintid || 0;
        global.Appacitive.bag.selectedCatalog.BlueprintId = global.Appacitive.bag.selectedCatalog.BlueprintId || 0;

        global.Appacitive.models = global.Appacitive.models || {};
        global.Appacitive.models.deploymentCollection = global.Appacitive.models.deploymentCollection || {};
        global.Appacitive.models.deploymentCollection.deployments = global.Appacitive.models.deploymentCollection.deployments || {};

        var baseUrl = (global.Appacitive.config||{apiBaseUrl:''}).apiBaseUrl;
        if (baseUrl.lastIndexOf("/") == baseUrl.length - 1)
            baseUrl = baseUrl.substring(0, baseUrl.length - 1);
        
        this.email = {
            emailServiceUrl: 'email',
            
            getSendEmailUrl: function() {
                return String.format("{0}/send", this.emailServiceUrl)
            }
        };
        this.user = {

            userServiceUrl: baseUrl + 'user',

            getCreateUrl: function () {
                return String.format("{0}/create", this.userServiceUrl);
            },
            getAuthenticateUserUrl: function () {
                return String.format("{0}/authenticate", this.userServiceUrl);
            },
            getUserUrl: function (userId, deploymentId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getUpdateUrl: function (userId, deploymentId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getDeleteUrl: function (userId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getSearchAllUrl: function (deploymentId, queryParams, pageSize) {
                var url = '';

                url = String.format('{0}/search/user/all', new UrlFactory().article.articleServiceUrl);

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
            getGetAllLinkedAccountsUrl: function(userId) {
                var url = String.format("{0}/{1}/linkedaccounts", this.userServiceUrl, userId);
                return url;
            }
        };
        this.device = {
            deviceServiceUrl: baseUrl + 'article',

            getCreateUrl: function () {
                return String.format("{0}/register", this.deviceServiceUrl);
            },
            getUpdateUrl: function (deviceId, deploymentId) {
                return String.format("{0}/{1}", this.deviceServiceUrl, deviceId);
            },
            getDeleteUrl: function (deviceId) {
                return String.format("{0}/{1}", this.deviceServiceUrl, deviceId);
            }
        };
        this.article = {
            articleServiceUrl: baseUrl + 'article',

            getGetUrl: function (schemaId, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaId, articleId);
            },
            getMultiGetUrl: function (deploymentId, schemaId, articleIds) {
                return String.format('{0}/multiGet/{1}/{2}', this.articleServiceUrl, schemaId, articleIds);
            },
            getMultiDeleteUrl: function (deploymentId, schemaId) {
                return String.format('{0}/multidelete/{1}', this.articleServiceUrl, schemaId);
            },
            getSearchAllUrl: function (deploymentId, schemaId, queryParams, pageSize) {
                var url = '';

                url = String.format('{0}/search/{1}/all', this.articleServiceUrl, schemaId);

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
            getPropertiesSearchUrl: function (deploymentId, schemaName, query) {
                var url = String.format('{0}/search/{1}/all', this.articleServiceUrl, schemaName);
                url += '?properties=' + query;

                return url;
            },
            getDeleteUrl: function (schemaName, articleId) {
                return String.format('{0}/{1}/{2}?verbose=true&debug=true', this.articleServiceUrl, schemaName, articleId);
            },
            getCreateUrl: function (schemaName) {
                return String.format('{0}/{1}', this.articleServiceUrl, schemaName);
            },
            getUpdateUrl: function (schemaType, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaType, articleId);
            }
        };
        this.connection = {
            connectionServiceUrl: baseUrl + 'connection',

            getGetUrl: function (relationId, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationId, connectionId);
            },
            getCreateUrl: function (relationId) {
                return String.format('{0}/{1}', this.connectionServiceUrl, relationId);
            },
            getUpdateUrl: function (deploymentId, relationType, relationId) {
                return String.format('{0}/update/{1}/{2}', this.connectionServiceUrl, relationType, relationId);
            },
            getDeleteUrl: function (relationId, connectionId) {
                return String.format('{0}/{1}/{2}', this.connectionServiceUrl, relationId, connectionId);
            },
            getMultiDeleteUrl: function (deploymentId, relationId) {
                return String.format('{0}/multidelete/{1}', this.connectionServiceUrl, relationId);
            },
            getSearchByArticleUrl: function (deploymentId, relationId, articleId, label, queryParams) {
                var url = '';

                url = String.format('{0}/{1}/find/all?label={2}&articleid={3}', this.connectionServiceUrl, relationId, label, articleId);
                // url = url + '?psize=1000';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getConnectedArticles: function (deploymentId, relationId, articleId, queryParams) {
                var url = '';
                url = String.format('{0}/{1}/{2}/find', this.connectionServiceUrl, relationId, articleId);
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
            getInterconnectsUrl: function (deploymentId) {
                var url = '';
                url = String.format('{0}/connectedarticles', this.connectionServiceUrl);
                return url;
            },
            getPropertiesSearchUrl: function (deploymentId, relationName, query) {
                var url = String.format('{0}/{1}/find/all', this.connectionServiceUrl, relationName);
                url += '?properties=' + query;

                return url;
            }
        };
        this.cannedList = {

            cannedListServiceUrl: baseUrl + '/list',

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
        }
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