  (function(global) {

  var Appacitive = global.Appacitive;

  Appacitive.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (!this.model) throw new Error("Please specify model for collection");
    if (options.comparator !== void 0) this.comparator = options.comparator;
    if (options.query) this.query(options.query);
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, { silent: true });
  };

  Appacitive.Events.mixin(Appacitive.Collection.prototype);

  // Define the Collection's inheritable methods.
  _extend(Appacitive.Collection.prototype, {
    
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
      return this.models.map(function(model) { return model.toJSON(options); });
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
        
        id = model.id;
        if (id && ((existing = ids[id]) || (existing = this._byId[id]))) {
          existing.copy(model.toJSON(), options.setSnapShot);
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

      return this;
    },

    remove: function(models, options) {
      var i, l, index, model;
      options = options || {};
      models = _type.isArray(models) ? models.slice() : [models];
      for (i = 0, l = models.length; i < l; i++) {
        model = this.getByCid(models[i]) || this.get(models[i]);
        if (!model) continue; 
        delete this._byId[model.id];
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
      return id && this._byId[(id instanceof Appacitive.BaseObject) ? id.id : id];
    },

    query: function(query) {
      if (query) {
        if ((query instanceof Appacitive.Query) || (query instanceof Appacitive.Queries.GraphAPI)) { 
          this._query = query;
          return this;
        } else {
          throw new Error("Cannot bind this query")
        }
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

    sort: function(options) {
      options = options || {};
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      //if (!_type.isFunction()) throw new Error('Comparator needs to be a function');
      
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
     * Returns the first model in this collection
     */
    first: function() {
      return (this.length > 0) ? this.models[0] : null;
    },

    /**
     * Returns the last model in this collection
     */
    last: function() {
      return (this.length > 0) ? this.models[this.length - 1] : null;
    },

    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, length = this.models.length; i < length; i++) {
        this._removeReference(this.models[i], options);
      }
      this._reset();
      this.add(models, _extend({ silent: true }, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    fetch: function(options) {
      options = _clone(options) || {};
      
      var collection = this;
      var query = this.query() || new Appacitive.Query(this.model);
      
      var promise = Appacitive.Promise.buildPromise(options);

      query.fetch(options).then(function(results) {
        if (options.add) collection.add(results, _extend({ setSnapShot: true }, options));
        else collection.reset(results, options);
        promise.fulfill(collection);
      }, function() {
        promise.reject.apply(promise, arguments);
      });

      return promise;
    },


    mutiGet: function(options) {
      options = _clone(options) || {};
      
      var collection = this;
      
      var promise = Appacitive.Promise.buildPromise(options);

      var ids = options.ids || [];

      if (ids.length == 0) return promise.fulfill(collection);

      var args = { ids: ids, fields : options.fields };

      args[this.model.type || this.model.relation] = this.model.className;

      Appacitive.Object.multiGet(args).then(function(results) {
        if (options.add) collection.add(results, options);
        else collection.reset(results, options);
        promise.fulfill(collection);
      }, function() {
        promise.reject.apply(promise, arguments);
      });

      return promise;
    },

    saveAll: function(options) {
      return this.model.saveAll(_extend(options));
    },

    create: function(model, options) {
      var collection = this;
      options = options ? _clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var success = options.success;
      options.success = function() {
        if (options.wait) collection.add(model, _extend({ setSnapShot: true }, options));
        if (success) success(model, collection);
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
      if (!(model instanceof Appacitive.BaseObject)) {
        model = new this.model(model);
      }

      if (!model.collection) model.collection = this;

      return model;
    },


    // Internal method to create a model's ties to a collection.
    _addReference: function(model) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
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
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }
  });

  Appacitive.Collection.extend = function(protoProps, classProps) {
    if (protoProps && protoProps.query) {
      protoProps._query = protoProps.query;
      delete protoProps.query;
    }
    var child = Appacitive._extend(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  var methods = ['forEach', 'each', 'map' ,'find', 'filter', 'every', 'some', 'indexOf', 'lastIndexOf', 'isEmpty', 'difference', 'without', 'reduce'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  methods.each(function(method) {
    Appacitive.Collection.prototype[method] = function() {
      var args = Array.prototype.slice.call(arguments);
      return Array.prototype[method].apply(this.models, args);
    };
  });

})(global);

