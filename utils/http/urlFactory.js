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
        
        this.session = {

            sessionServiceUrl: baseUrl + '/sessionservice',

            getCreateSessionUrl: function (deploymentName) {
                return String.format("{0}/create?deploymentName={1}", this.sessionServiceUrl, deploymentName);
            },
            getPingSessionUrl: function () {
                return String.format("{0}/ping", this.sessionServiceUrl);
            },
            getValidateTokenUrl: function (token) {
                return String.format("{0}/validatetoken?token={1}", this.sessionServiceUrl, token);
            },
            getDeleteSessionUrl: function (deploymentName) {
                return String.format("{0}/delete?deploymentName={1}", this.sessionServiceUrl, deploymentName);
            }
        };
        
        this.email = {
            emailServiceUrl: 'email',
            
            getSendEmailUrl: function() {
                return String.format("{0}/send", this.emailServiceUrl)
            }
        };

        this.identity = {

            identityServiceUrl: baseUrl + '/accountservice',
            getUpdateUserUrl: function () {
                return String.format("{0}/updateuser", this.identityServiceUrl);
            },
            getUserUrl: function (userId) {
                return String.format("{0}/user/{1}", this.identityServiceUrl, userId);
            },
            getChangePasswordUrl: function () {
                return String.format("{0}/changepwd", this.identityServiceUrl);
            },
            getUploadUrl: function (accountId) {
                return String.format("{0}/file/{1}", this.identityServiceUrl, accountId);
            }
        };
        this.user = {

            userServiceUrl: baseUrl + '/user',
            getCreateUserUrl: function () {
                return String.format("{0}/create", this.userServiceUrl);
            },
            getAuthenticateUserUrl: function () {
                return String.format("{0}/authenticate", this.userServiceUrl);
            },
            getUpdateUserUrl: function (userId, deploymentId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getUserUrl: function (userId, deploymentId) {
                return String.format("{0}/{1}", this.userServiceUrl, userId);
            },
            getUserDeleteUrl: function (userId) {
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
        this.application = {

            applicationServiceUrl: baseUrl + '/applicationservice',

            getSearchAllUrl: function (queryParams) {
                var url = String.format('{0}/find/{1}/all', this.applicationServiceUrl, global.Appacitive.bag.accountName);

                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        if (queryParams[i].trim().length > 0) {
                            url = url + "&" + queryParams[i];
                        }
                    }
                }

                return url;
            },

            getCreateUrl: function () {
                return String.format('{0}/create', this.applicationServiceUrl);
            },
            getCreateSessionUrl: function (appName) {
                return String.format('{0}/session?appName={1}', this.applicationServiceUrl, appName);
            },
            getDeleteUrl: function (applicationId) {
                return String.format('{0}/{1}', this.applicationServiceUrl, applicationId);
            },
            getCheckNameUrl: function (name) {
                return String.format('{0}/doesNameExist/{1}/{2}', this.applicationServiceUrl, global.Appacitive.bag.accountName, name);
            },
            getHasAppUrl: function () {
                return String.format('{0}/hasApp', this.applicationServiceUrl);
            },
            getGetPublishStatusUrl: function (refId) {
                return String.format('{0}/status/{1}', this.applicationServiceUrl, refId);
            },
            getGetUrl: function (name) {
                return String.format('{0}/{1}', this.applicationServiceUrl, name);
            },
            getGenerateKeyUrl: function (name) {
                return String.format('{0}/generatekey/{1}', this.applicationServiceUrl, name);
            },
            getUpdateKeyStatusUrl: function (name) {
                return String.format('{0}/updatekey/{1}', this.applicationServiceUrl, name);
            },
            getUpdateApplicationUrl: function (applicationId) {
                return String.format('{0}/{1}', this.applicationServiceUrl, applicationId);
            },
            getDeleteApiKey: function (applicationId) {
                return String.format('{0}/deletekey/{1}', this.applicationServiceUrl, applicationId);
            },
            getUploadUrl: function () {
                return String.format("{0}/file/", this.applicationServiceUrl);
            }
        };
        this.article = {
            articleServiceUrl: baseUrl + 'article',

            getExportUrl: function (id, type) {
                return 'Articles.exp?ctype=Article&blueprintid=' + id + '&type=' + type;
            },

            getEntityId: function () {
                return global.Appacitive.bag.selectedCatalog.id;
            },
            getGetUrl: function (schemaId, articleId) {
                return String.format('{0}/{1}/{2}', this.articleServiceUrl, schemaId, articleId);
            },
            getMultiGetUrl: function (deploymentId, schemaId, articleIds) {
                return String.format('{0}/multiGet/{1}/{2}', this.articleServiceUrl, schemaId, articleIds);
            },
            getMultiDeleteUrl: function (deploymentId, schemaId) {
                return String.format('{0}/multidelete/{1}', this.articleServiceUrl, schemaId);
            },
            getBlobUploadUrl: function () {
                return String.format('{0}/blob/upload', this.articleServiceUrl);
            },
            getBlobUpdateUrl: function (articledId) {
                return String.format('{0}/blob/update?&articleid={1}', this.articleServiceUrl, articledId);
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
            },
            getDownloadUrl: function (url) {
                return String.format('article.file?fileurl=' + escape(url));
            }
        };
        
        this.catalog = {

            catalogServiceUrl: baseUrl + '/blueprintservice',

            getSearchAllUrl: function (queryParams) {
                var url = String.format('{0}/find/all?', this.catalogServiceUrl);
                url = url + '?psize=1000';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        if (queryParams[i].trim().length == 0) continue;
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },
            getPropertiesSearchUrl: function (deploymentId, schemaName, query) {
                var url = String.format('{0}/search/{1}/{2}/all', this.articleServiceUrl, deploymentId, schemaName);
                url += '?properties=' + query;

                return url;
            },
            getDeleteUrl: function (deploymentId, articleId, schemaName) {
                return String.format('{0}/delete/{1}/{2}/{3}', this.articleServiceUrl, deploymentId, articleId, schemaName);
            },
            getCreateUrl: function (deploymentId) {
                return String.format('{0}/create/{1}', this.articleServiceUrl, deploymentId);
            },
            getUpdateUrl: function (deploymentId, articleId) {
                return String.format('{0}/update/{1}/{2}', this.articleServiceUrl, deploymentId, articleId);
            }
        };
        this.connection = {
            connectionServiceUrl: baseUrl + 'connection',

            getEntityId: function () {
                return global.Appacitive.bag.selectedCatalog.id;
            },
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
        this.schema = {

            schemaServiceUrl: baseUrl + '/schemaservice',

            //Return  blueprint Id or deployments blueprint Id
            getEntityId: function () {
                if (global.Appacitive.bag.selectedType == 'deployment') {
                    return global.Appacitive.bag.selectedCatalog.blueprintid;
                }
                return global.Appacitive.bag.selectedCatalog.id;
            },

            getExportUrl: function (id) {
                return 'Schemas.exp?ctype=Schema&blueprintid=' + id;
            },



            getSearchAllUrl: function (catalogName, queryParams) {
                var url = '';
                if (catalogName) {
                    url = String.format('{0}/find/all/{1}', this.schemaServiceUrl, catalogName);
                }
                url = url + '?psize=200';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },

            getGetPropertiesUrl: function (schemaId) {
                return String.format('{0}/get/{1}/{2}/true', this.schemaServiceUrl, this.getEntityId(), schemaId);
            },

            getCreateUrl: function () {
                return String.format('{0}/create/{1}', this.schemaServiceUrl, this.getEntityId());
            },

            getDeleteUrl: function (schemaId) {
                return String.format('{0}/delete/{1}/{2}', this.schemaServiceUrl, this.getEntityId(), schemaId);
            },

            getUpdateUrl: function (schemaId) {
                return String.format('{0}/update/{1}/{2}', this.schemaServiceUrl, this.getEntityId(), schemaId);
            },

            getUpdateAttributesUrl: function (schemaId) {
                return String.format('{0}/updateAttributes/{1}/{2}', this.schemaServiceUrl, this.getEntityId(), schemaId);
            },

            getAddPropertyUrl: function (schemaId) {
                return String.format('{0}/addProperty/{1}/{2}', this.schemaServiceUrl, this.getEntityId(), schemaId);
            },

            getDeletePropertyUrl: function (schemaId, propertyId) {
                return String.format('{0}/deleteProperty/{1}/{2}/{3}', this.schemaServiceUrl, this.getEntityId(), schemaId, propertyId);
            },

            getUpdatePropertyUrl: function (schemaId) {
                return String.format('{0}/updateProperty/{1}/{2}', this.schemaServiceUrl, this.getEntityId(), schemaId);
            },

            getGetUrl: function (schemaId) {
                var eId = global.Appacitive.bag.selectedType == 'blueprint' ? global.Appacitive.bag.selectedCatalog.Id : global.Appacitive.bag.selectedCatalog.BlueprintId;
                return String.format('{0}/get/{1}/{2}', this.schemaServiceUrl, eId, schemaId);
            }
        };
        this.relation = {

            relationServiceUrl: baseUrl + '/relationservice',

            //Return  blueprint Id or deployments blueprint Id
            getEntityId: function () {
                if (global.Appacitive.bag.selectedType == 'deployment') {
                    return global.Appacitive.bag.selectedCatalog.blueprintid;
                }
                return global.Appacitive.bag.selectedCatalog.id;
            },

            getExportUrl: function (id) {
                return 'Relations.exp?ctype=Relation&blueprintid=' + id;
            },

            getSearchBySchemaUrl: function (blueprintName, schemaName, queryParams) {
                var url = '';
                url = String.format('{0}/{1}/find/{2}', this.relationServiceUrl, blueprintName, schemaName);
                url = url + '?psize=200';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },

            getSearchAllUrl: function (catalogName, queryParams) {
                var url = '';
                if (catalogName) {
                    url = String.format('{0}/find/all/{1}', this.relationServiceUrl, catalogName);
                }
                url = url + '?psize=200';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },

            getGetPropertiesUrl: function (relationId) {
                return String.format('{0}/get/{1}/{2}/true', this.relationServiceUrl, this.getEntityId(), relationId);
            },

            getCreateUrl: function () {
                return String.format('{0}/create/{1}', this.relationServiceUrl, this.getEntityId());
            },

            getDeleteUrl: function (relationId) {
                return String.format('{0}/delete/{1}/{2}', this.relationServiceUrl, this.getEntityId(), relationId);
            },

            getUpdateUrl: function (relationId) {
                return String.format('{0}/update/{1}/{2}', this.relationServiceUrl, this.getEntityId(), relationId);
            },

            getUpdateAttributesUrl: function (relationId) {
                return String.format('{0}/updateAttributes/{1}/{2}', this.relationServiceUrl, this.getEntityId(), relationId);
            },

            getAddPropertyUrl: function (relationId) {
                return String.format('{0}/addProperty/{1}/{2}', this.relationServiceUrl, this.getEntityId(), relationId);
            },

            getDeletePropertyUrl: function (relationId, propertyId) {
                return String.format('{0}/deleteProperty/{1}/{2}/{3}', this.relationServiceUrl, this.getEntityId(), relationId, propertyId);
            },

            getUpdatePropertyUrl: function (relationId) {
                return String.format('{0}/updateProperty/{1}/{2}', this.relationServiceUrl, this.getEntityId(), relationId);
            },

            getUpdateEndPointUrl: function (relationId, type) {
                return String.format('{0}/updateEndpoint/{1}/{2}/{3}', this.relationServiceUrl, this.getEntityId(), relationId, type);
            },

            getGetUrl: function (relationId) {
                var eId = global.Appacitive.bag.selectedType == 'blueprint' ? global.Appacitive.bag.selectedCatalog.Id : global.Appacitive.bag.selectedCatalog.BlueprintId;
                return String.format('{0}/get/{1}/{2}', this.relationServiceUrl, eId, relationId);
            }
        };
        this.cannedList = {

            cannedListServiceUrl: baseUrl + '/listservice',

            //Return  blueprint Id or deployments blueprint Id
            getEntityId: function () {
                if (global.Appacitive.bag.selectedType == 'deployment') {
                    return global.Appacitive.bag.selectedCatalog.blueprintid;
                }
                return global.Appacitive.bag.selectedCatalog.id;
            },

            getExportUrl: function (id) {
                return 'CannedLists.exp?ctype=List&blueprintid=' + id;
            },

            getListItemExportUrl: function (id, cannedListId) {
                return 'CannedLists.exp?ctype=ListItems&blueprintid=' + id + '&type=' + cannedListId;
            },

            getSearchAllUrl: function (catalogName, queryParams) {
                var url = '';
                if (catalogName) {
                    url = String.format('{0}/find/all/{1}', this.cannedListServiceUrl, catalogName);
                }
                url = url + '?psize=200';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            },

            getGetItemsUrl: function (cannedListId) {
                return String.format('{0}/get/{1}/{2}', this.cannedListServiceUrl, this.getEntityId(), cannedListId);
            },

            getCreateUrl: function () {
                return String.format('{0}/create/{1}', this.cannedListServiceUrl, this.getEntityId());
            },

            getDeleteUrl: function (cannedListId) {
                return String.format('{0}/delete/{1}/{2}', this.cannedListServiceUrl, this.getEntityId(), cannedListId);
            },

            getSearchListItemsUrl: function (cannedListId, queryParams) {
                var url = String.format('{0}/searchListItems/{1}/{2}', this.cannedListServiceUrl, this.getEntityId(), cannedListId);
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    url = url + '?';
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + queryParams[i] + "&";
                    }
                    url = url.substring(0, url.length - 1);
                }
                return url;
            },

            getUpdateListItemPositionUrl: function (cannedListId, currentPosition, newPosition) {
                return String.format('{0}/updateListItemPosition/{1}/{2}/{3}/{4}', this.cannedListServiceUrl, this.getEntityId(), cannedListId, currentPosition, newPosition);
            },

            getDeleteListItemUrl: function (cannedListId, listItemName) {
                return String.format('{0}/removeListItem/{1}/{2}/{3}', this.cannedListServiceUrl, this.getEntityId(), cannedListId, listItemName);
            },

            getAddListItemsUrl: function (cannedListId) {
                return String.format('{0}/addListItems/{1}/{2}', this.cannedListServiceUrl, this.getEntityId(), cannedListId);
            },

            getUpdateListItemUrl: function (cannedListId, oldName) {
                return String.format('{0}/updateListItem/{1}/{2}/{3}', this.cannedListServiceUrl, this.getEntityId(), cannedListId, oldName);
            },

            getUpdateUrl: function (listId) {
                return String.format('{0}/update/{1}/{2}', this.cannedListServiceUrl, this.getEntityId(), listId);
            },

            getGetUrl: function (relationId) {
                var eId = global.Appacitive.bag.selectedType == 'blueprint' ? global.Appacitive.bag.selectedCatalog.Id : global.Appacitive.bag.selectedCatalog.BlueprintId;
                return String.format('{0}/get/{1}/{2}', this.cannedListServiceUrl, eId, relationId);
            }

        };
        this.catalog = {

            catalogServiceUrl: baseUrl + '/blueprintservice',

            getSearchAllUrl: function (queryParams) {
                var url = String.format('{0}/find/all?', this.catalogServiceUrl);
                url = url + '?psize=1000';
                if (typeof (queryParams) !== 'undefined' && queryParams.length > 0) {
                    for (var i = 0; i < queryParams.length; i = i + 1) {
                        url = url + "&" + queryParams[i];
                    }
                }
                return url;
            }
        };
        this.blueprint = {

            blueprintServiceUrl: baseUrl + '/blueprintservice',

            getGetUrl: function (id) {
                return String.format('{0}/get/{1}', this.blueprintServiceUrl, id);
            },

            getDeleteUrl: function (id) {
                return String.format('{0}/delete/{1}', this.blueprintServiceUrl, id);
            },

            getCreateUrl: function () {
                return String.format('{0}/create', this.blueprintServiceUrl);
            },

            getSchemasUrl: function (bId) {
                var url = String.format('{0}/getSchemas/{1}?', this.blueprintServiceUrl, bId);
                url = url + '?psize=1000';
                return url
            },

            getRelationsUrl: function (bId) {
                var url = String.format('{0}/{1}/contents/relations?', this.blueprintServiceUrl, bId);
                url = url + '?psize=1000';
                return url;
            },

            getCannedListsUrl: function (bId) {
                var url = String.format('{0}/{1}/contents/lists?', this.blueprintServiceUrl, bId);
                url = url + '?psize=1000';
                return url;
            }
        };
        this.deployment = {

            deploymentServiceUrl: baseUrl + '/deploymentservice',

            getGetUrl: function (id) {
                return String.format('{0}/get/{1}', this.deploymentServiceUrl, id);
            },

            getGetPublishStatusUrl: function (refId, onSuccess, onError) {
                return String.format('{0}/status/{1}', this.deploymentServiceUrl, refId);
            },

            getCreateUrl: function () {
                return String.format('{0}/create', this.deploymentServiceUrl);
            },

            getFetchAllDeploymentsUrl: function () {
                var url = String.format('{0}/fetchAll', this.deploymentServiceUrl);
                return url;
            },

            getSearchAllSchemaUrl: function (dId) {
                var url = String.format('{0}/getSchemas/{1}', this.deploymentServiceUrl, dId);
                url = url + '?psize=1000';
                return url;
            },

            getSearchAllRelationsUrl: function (dId) {
                var url = String.format('{0}/getRelations/{1}', this.deploymentServiceUrl, dId);
                url = url + '?psize=1000';
                return url;
            },

            getSearchAllListsUrl: function (dId) {
                var url = String.format('{0}/getLists/{1}', this.deploymentServiceUrl, dId);
                url = url + '?psize=1000';
                return url;
            },

            getExportUrl: function (dId, bName) {
                var url = String.format('{0}/{1}/{2}', this.deploymentServiceUrl, dId, bName);
                return url;
            },

            getMergeUrl: function (dId, bName) {
                var url = String.format('{0}/{1}/{2}', this.deploymentServiceUrl, dId, bName);
                return url;
            },

            getUpdateDeployemntUrl: function (deploymentId) {
                return String.format('{0}/{1}', this.deploymentServiceUrl, deploymentId);
            },

            getProfilerUrl: function (referenceId) {
                return String.format('{0}/profile/{1}?deploymentid={2}', this.deploymentServiceUrl, referenceId, global.Appacitive.bag.selectedCatalog.id);
            },

            getLiveToStageUrl: function () {
                var liveId = global.Appacitive.models.deploymentCollection.deployments.filter(function (d) {
                    return d.name.toLowerCase() == global.Appacitive.bag.apps.selected.name.toLowerCase();
                })[0].id;
                var sandboxName = '__Sandbox_' + global.Appacitive.bag.apps.selected.name;
                var url = '{0}/Execute/{1}/mergelivetosandbox?livedeploymentid={2}';
                url = String.format(url, this.deploymentServiceUrl, sandboxName , liveId);
                return url;
            }
        };
        this.tag = {

            tagServiceUrl: baseUrl + '/tagsservice',

            //Return  blueprint Id or deployments blueprint Id
            getEntityId: function () {
                if (global.Appacitive.selectedType == 'deployment') {
                    return global.Appacitive.bag.selectedCatalog.blueprintid;
                }
                return global.Appacitive.bag.selectedCatalog.id;
            },

            getAddTagUrl: function (type, entityId, parentEntityId, tagValue) {
                return String.format("{0}/addTag/{1}/{2}/{3}/{4}?tag={5}", this.tagServiceUrl, this.getEntityId(), type, entityId, parentEntityId, tagValue);
            },

            getRemoveTagUrl: function (type, entityId, parentEntityId, tagValue) {
                return String.format("{0}/removeTag/{1}/{2}/{3}/{4}?tag={5}", this.tagServiceUrl, this.getEntityId(), type, entityId, parentEntityId, tagValue);
            }
        };
        this.invoice = {
            invoiceServiceUrl: baseUrl + '/invoiceservice',

            getUsageStatsUrl: function () {
                //
                return this.invoiceServiceUrl + '/usage/' + global.Appacitive.bag.accountName;
            }
        };
        this.account = {
            accountServiceUrl: baseUrl + '/accountservice',

            getCreateNewAccountUrl: function (queryParam) {
                return String.format("{0}/createaccount?skipValid={1}", this.accountServiceUrl, queryParam);
            },

            getAccountIdUrl: function (accName) {
                return this.accountServiceUrl + '/accountId/' + accName;
            },
            checkAccountNameUrl: function (accName) {
                return this.accountServiceUrl + '/exists/' + accName;
            },
            createInvite: function (token) {
                return String.format("{0}/createInvite?args={1}", this.accountServiceUrl, token);
            },
            requestInvite: function () {
                return this.accountServiceUrl + '/createtoken';
            },
            checkToken: function (token, queryParam) {
                return String.format("{0}/searchToken/{1}?skipValid={2}", this.accountServiceUrl, token, queryParam);
            },
            isHuman: function (challenge, userResponse) {
                return this.accountServiceUrl + '/captcha/' + challenge + '/' + userResponse;
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
        this.announcement = {
            announcementServiceUrl: baseUrl + "/announcementservice",
            getSummaryUrl: function () {
                return this.announcementServiceUrl + "/summary";
            }
        };
        this.graphite = {
            graphiteBaseUrl: baseUrl + '/sessionservice/getGraph',

            getBaseUrl: function () {
                return this.graphiteBaseUrl;
            }
        };
        this.emailtemplate = {
            emailTemplateServiceUrl: baseUrl + "/emailservice",
            getCreateUrl: function () {
                return this.emailTemplateServiceUrl + "/create";
            },
            getUpdateUrl: function (id) {
                return this.emailTemplateServiceUrl + "/" + id;
            },
            getAllNames: function () {
                return this.emailTemplateServiceUrl + "/find/all";
            },
            getSearchByNameUrl: function (id) {
                return this.emailTemplateServiceUrl + "/" + id;
            },
            getDeleteUrl: function (name) {
                return this.emailTemplateServiceUrl + "/" + name;
            }
        };
    }

    global.Appacitive.storage = global.Appacitive.storage || {};
    global.Appacitive.storage.urlFactory = new UrlFactory();

})(global);