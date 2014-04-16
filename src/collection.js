  (function(global) {

  global.Appacitive.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (!this.model) throw new Error("Please specify model for collection");
    if (options.comparator !== void 0) this.comparator = options.comparator;
    if (options.query) this.query(options.query);
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, { silent: true });
  };

  global.Appacitive.Events.mixin(global.Appacitive.Collection.prototype);

  // Define the Collection's inheritable methods.
  _extend(global.Appacitive.Collection.prototype, {
    
    models: [],

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    _query: null,

    /**
     * The JSON representation of a Collection is an array of the
     * models' attributes.
     */
    toJSON: function(options) {
      return this.model.map(function(model) { return model.toJSON(options); });
    },

    add: function(models, options) {
      options = options || {};
      var i, index, length, model, cid, id, cids = {}, ids = {}, at = options.at, merge = options.merge, toAdd = [], sort = options.sort, existing;
      models = _type.isArray(models) ? models.slice() : [models];

      for (i = 0, length = models.length; i < length; i++) {
        models[i] = this._prepareModel(models[i]);
        model = models[i];
        if (!model) throw new Error("Can't add an invalid model to a collection");

        cid = model.cid;
        if (cids[cid] || this._byCid[cid])  throw new Error("Duplicate cid: can't add the same model to a collection twice");
        
        id = model.id();
        if (id && ((existing = ids[id]) || (existing = this._byId[id]))) {
          existing.copy(model.toJSON(), true);
          existing.children = model.children;
        } else {
          ids[id] = model;
          cids[cid] = model;

          toAdd.push(model);
          
          this._addReference(model, options);
        }
      }

      // Insert models into the collection, re-sorting if needed, and triggering
      // `add` events unless silenced.
      
      index = (options.at != null) ? options.at : this.models.length;
      this.models.splice.apply(this.models, [index, 0].concat(toAdd));
      if (sort && this.comparator) this.sort({silent: true});
      this.length = this.models.length;

      if (options.silent) return this;
      
      for (i = 0, length = toAdd.length; i < length; i++) {
        model = toAdd[i];
        options.index = i;
        model.trigger('add', model, this, options);
      }

      for (var i = 0, length = toAdd.length; i < length; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
      }

      return this;
    },


    /**
     * Remove a model, or a list of models from the set. Pass silent to avoid
     * firing the <code>remove</code> event for every model removed.
     *
     * @param {Array} models The model or list of models to remove from the
     *   collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are: <ul>
     *   <li>silent: Set to true to avoid firing the `remove` event.
     * </ul>
     */
    remove: function(models, options) {
      var i, l, index, model;
      options = options || {};
      models = _type.isArray(models) ? models.slice() : [models];
      for (i = 0, l = models.length; i < l; i++) {
        model = this.getByCid(models[i]) || this.get(models[i]);
        if (!model) continue; 
        delete this._byId[model.id()];
        delete this._byCid[model.cid];
        index = this.models.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _extend({ at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _extend({ at: 0 }, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return Array.prototype.slice.apply(this.models, arguments);
    },

    /**
     * Gets a model from the set by id.
     * @param {String} id The Appacitive objectId identifying the Appacitive.Object to
     * fetch from this collection.
     */
    get: function(id) {
      return id && this._byId[(id instanceof global.Appacitive.BaseObject) ? id.id() : id];
    },

    query: function(query) {
      if ((query instanceof global.Appacitive.Query) 
        || (query instanceof global.Appacitive.Queries.GraphProjectQuery)) { 
        this._query = query;
        return this;
      }
      else return this._query;
    },

    /**
     * Gets a model from the set by client id.
     * @param {} cid The Backbone collection id identifying the Appacitive.Object to
     * fetch from this collection.
     */
    getByCid: function(cid) {
      return cid && this._byCid[cid.cid || cid];
    },

    /**
     * Gets the model at the given index.
     *
     * @param {Number} index The index of the model to return.
     */
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (Object.isEmpty(attrs)) return first ? void 0 : [];
      return this.models[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    /**
     * Forces the collection to re-sort itself. You don't need to call this
     * under normal circumstances, as the set will maintain sort order as each
     * item is added.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are: <ul>
     *   <li>silent: Set to true to avoid firing the `reset` event.
     * </ul>
     */
    sort: function(options) {
      options = options || {};
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      if (!_type.isFunction()) throw new Error('Comparator needs to be a function');
      if (this.comparator.length === 1) {
        this.models = this.models.sortBy(this.comparator);
      } else {
        this.models.sort(this.comparator.bind(this.models));
      }
      if (!options.silent) this.trigger('reset', this, options);
      
      return this;
    },

    /**
     * Plucks an attribute from each model in the collection.
     * @param {String} attr The attribute to return from each model in the
     * collection.
     */
    pluck: function(attr) {
      return this.models.map(function(model) { return model.get(attr); });
    },

    /**
     * When you have more items than you want to add or remove individually,
     * you can reset the entire set with a new list of models, without firing
     * any `add` or `remove` events. Fires `reset` when finished.
     *
     * @param {Array} models The model or list of models to remove from the
     *   collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are: <ul>
     *   <li>silent: Set to true to avoid firing the `reset` event.
     * </ul>
     */
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, length = this.models.length; i < length; i++) {
        this._removeReference(this.models[i], options);
      }
      this._reset();
      this.add(models, { silent: true });
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    /**
     * Fetches the default set of models for this collection, resetting the
     * collection when they arrive. If `add: true` is passed, appends the
     * models to the collection instead of resetting.
     *
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>silent: Set to true to avoid firing `add` or `reset` events for
     *   models fetched by this fetch.
     *   <li>success: A Backbone-style success callback.
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, uses the Master Key for
     *       this request.
     * </ul>
     */
    fetch: function(options) {
      options = _clone(options) || {};
      
      var collection = this;
      var query = this.query() || new global.Appacitive.Query(this.model);
      
      var promise = global.Appacitive.Promise.buildPromise(options);

      query.fetch(options).then(function(results) {
        if (options.add) collection.add(results, options);
        else collection.reset(results, options);
        promise.fulfill(collection);
      }, function() {
        promise.reject.apply(promise, arguments);
      });

      return promise;
    },

    /**
     * Creates a new instance of a model in this collection. Add the model to
     * the collection immediately, unless `wait: true` is passed, in which case
     * we wait for the server to agree.
     *
     * @param {Appacitive.Object} model The new model to create and add to the
     *   collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>wait: Set to true to wait for the server to confirm creation of the
     *       model before adding it to the collection.
     *   <li>silent: Set to true to avoid firing an `add` event.
     *   <li>success: A Backbone-style success callback.
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, uses the Master Key for
     *       this request.
     * </ul>
     */
    create: function(model, options) {
      var collection = this;
      options = options ? _clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var success = options.success;
      options.success = function() {
        if (options.wait) collection.add(nextModel, options);
        if (success) success(model);
      };
      model.save(options);
      return model;
    },

    /**
     * Reset all internal state. Called when the collection is reset.
     */
    _reset: function(options) {
      this.length = 0;
      this.models = [];
      this._byId  = {};
      this._byCid = {};
    },

    /**
     * Prepare a model or hash of attributes to be added to this collection.
     */
    _prepareModel: function(model) {
      if (!(model instanceof global.Appacitive.BaseObject)) {
        model = new this.model(model);
      }

      if (!model.collection) model.collection = this;

      return model;
    },


    // Internal method to create a model's ties to a collection.
    _addReference: function(model) {
      this._byId[model.cid] = model;
      if (model.id() != null) this._byId[model.id()] = model;
      this._byCid[model.cid] = model;
      model.on('all', this._onModelEvent, this);
    },

    /**
     * Internal method to remove a model's ties to a collection.
     */
    _removeReference: function(model) {
      if (this === model.collection) {
        delete model.collection;
      }
      model.off('all', this._onModelEvent, this);
    },

    /**
     * Internal method called every time a model in the set fires an event.
     * Sets need to update their indexes when models change ids. All other
     * events simply proxy through. "add" and "remove" events that originate
     * in other collections are ignored.
     */
    _onModelEvent: function(ev, model, collection, options) {
      if ((ev === 'add' || ev === 'remove') && collection !== this) return;
      if (ev === 'destroy') this.remove(model, options);
      if (model && ev === 'change:__id') {
        delete this._byId[model.previous("__id")];
        this._byId[model.id()] = model;
      }
      this.trigger.apply(this, arguments);
    }
  });

  /**
   * Creates a new subclass of <code>Appacitive.Collection</code>.  For example,<pre>
   *   var MyCollection = Appacitive.Collection.extend({
   *     // Instance properties
   *
   *     model: MyClass,
   *     query: MyQuery,
   *
   *     getFirst: function() {
   *       return this.at(0);
   *     }
   *   }, {
   *     // Class properties
   *
   *     makeOne: function() {
   *       return new MyCollection();
   *     }
   *   });
   *
   *   var collection = new MyCollection();
   * </pre>
   *
   * @function
   * @param {Object} instanceProps Instance properties for the collection.
   * @param {Object} classProps Class properies for the collection.
   * @return {Class} A new subclass of <code>Appacitive.Collection</code>.
   */
  global.Appacitive.Collection.extend = function(protoProps, classProps) {
    if (protoProps && protoProps.query) {
      protoProps._query = protoProps.query;
      delete protoProps.query;
    }
    var child = global.Appacitive._extend(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

})(global);

