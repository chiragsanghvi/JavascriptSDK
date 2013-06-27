(function (global) {

    var Appacitive = global.Appacitive;

    Appacitive.GeoCoord = function(lat, lng) {
        
        _validateGeoCoord = function(lat, lng) {
          if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid Latitiude or longitiude provided");
          if (lat < -90.0 || lat > 90.0) throw new Error("Latitude " + lat + " should be in range of  -90.0 to 90.");
          if (lng < -180.0 || lng > 180.0) throw new Error("Latitude " + lng + " should be in range of  -180.0 to 180.");
        };

        if (!lat || !lng) {
          this.lat = 0, this.lng = 0;
        } else {
          _validateGeoCoord(lat, lng);
          this.lat = lat, this.lng = lng;
        }

        this.toJSON = function() {
            return {
                latitude : this.lat,
                longitude: this.lng
            };
        };

        this.getValue = function() {
            return String.format("{0},{1}", lat, lng);
        };

        this.toString = function() { return this.getValue(); };
    };

    var _filter = function() { this.toString = function() { }; };

    var _fieldFilter = function(options) {

        _filter.call(this);

        options = options || {};
        this.fieldType = options.fieldType;
        this.field = options.field || '';
        this.value = options.value;
        this.operator = options.operator;

        this.getFieldType = function() {
            switch (this.fieldType) {
                case 'property' : return '*';
                case 'attribute' : return '@';
                case 'aggregate' : return '$';
                default : return '*';
            };
        };

        this.toString = function() {
             return String.format("{0}{1} {2} {3}",
                    this.getFieldType(),
                    this.field.toLowerCase(),
                    this.operator,
                    this.value.getValue());
        };

    };

    _fieldFilter.prototype = new _filter();
    _fieldFilter.prototype.constructor = _fieldFilter;


    var _containsFilter = function(options) {
        
        options = options || '';

        if (!(typeof options.value == 'object') || !options.value.length) throw new Error("Specify field value as array");
        
        _fieldFilter.call(this, options);

        var _getValue = function(value) {
            if (typeof value == 'string') return "'" + value + "'";
            else if (typeof value == 'number') return value;  
            else return value.toString();
        };

        this.toString = function() {
            var values = [];
            for (var i = 0; i < this.value.length; i = i + 1) {
                values.push(String.format("{0}{1} {2} {3}",
                            this.getFieldType(),
                            this.field.toLowerCase(),
                            this.operator,
                            _getValue(this.value[i])));
            };
            return "("  + values.join(' or ') + ")"; 
        }

    };

    _containsFilter.prototype = new _fieldFilter();
    _containsFilter.prototype.constructor = _containsFilter;

    var _betweenFilter = function(options) {
        options = options || '';

        if (!options.val1) throw new Error("Specify field value1 ");
        if (!options.val2) throw new Error("Specify field value2 ");

        this.val1 = options.val1;
        this.val2 = options.val2;

        _fieldFilter.call(this, options);

        delete this.value;

        this.toString = function() {
             return String.format("{0}{1} {2} ({3},{4})",
                    this.getFieldType(),
                    this.field.toLowerCase(),
                    this.operator,
                    this.val1.getValue(),
                    this.val2.getValue());
        };

    };

    _betweenFilter.prototype = new _fieldFilter();
    _betweenFilter.prototype.constructor = _betweenFilter;


    var _radialFilter = function(options) {

        options = options || '';

        if (!options.geoCoord || !(options.geoCoord instanceof Appacitive.GeoCoord)) throw new Error("withinCircle filter needs Appacitive.GeoCoord object as argument");

        _fieldFilter.call(this, options);

        this.value = options.geoCoord;

        this.unit = options.unit || 'mi';

        this.distance = options.distance || 5;

        this.toString = function() {
             return String.format("{0}{1} {2} {3},{4} {5}",
                    this.getFieldType(),
                    this.field.toLowerCase(),
                    this.operator,
                    this.value.getValue(),
                    this.distance,
                    this.unit);
        };
    };

    _radialFilter.prototype = new _fieldFilter();
    _radialFilter.prototype.constructor = _betweenFilter;


    var _polygonFilter = function(options) {

        options = options || '';

        if (!options.geoCoords || options.geoCoords.length == 0) throw new Error("polygon filter needs array of Appacitive.GeoCoord objects as argument");

        if (options.geoCoords.length < 3) throw new Error("polygon filter needs atleast 3 Appacitive.GeoCoord objects as arguments");

        _fieldFilter.call(this, options);

        this.value = options.geoCoords;

        var _getPipeSeparatedList = function(coords) {
            var value = '';
            coords.forEach(function(c) {
                if (value.length == 0) value = c.toString();
                else value += " | " + c.toString();
            });
            return value;
        }

        this.toString = function() {
             return String.format("{0}{1} {2} {3}",
                    this.getFieldType(),
                    this.field.toLowerCase(),
                    this.operator,
                    _getPipeSeparatedList(this.value));
        };
    };

    _polygonFilter.prototype = new _fieldFilter();
    _polygonFilter.prototype.constructor = _betweenFilter;

    _compundFilter = function(operator, filters) {
        
        if (!filters || !filters.length || filters.length < 2) throw new Error("Provide valid or atleast 2 filters");

        this.operator = operator;

        this.innerFilters = [];

        for (var i = 0; i < filters.length ; i = i + 1) {
            if (!(filters[i] instanceof _filter)) throw new Error("Invalid filter provided");
            this.innerFilters.push(filters[i]);
        };

        this.toString = function() {
            var op = this.operator;
            var value = "(";
            this.innerFilters.forEach(function(f) {
                if (value.length == 1) value += ' ' + f.toString();
                else value += String.format('{0} {1}', op, f.toString());
            });
            value += ")";
            return value;
        };
    };

    _compundFilter.prototype = new _filter();
    _compundFilter.prototype.constructor = _compundFilter;


    var _operators = {
        isEqualTo: "==",
        isGreaterThan: ">",
        isGreaterThanEqualTo: ">=",
        isLessThan: "<",
        isLessThanEqualTo: "<=",
        like: "like",
        between: "between",
        withinCircle: "within_circle",
        withinPolygon: "within_polygon",
        or: "or",
        and: "and"
    };

    var _primitiveFieldValue = function(value) {

        if (!value || value.length == 0) throw new Error("Specify value");

        this.value = value;

        this.getValue = function() {
            if (typeof this.value == 'string') return "'" + this.value + "'";
            else if (typeof this.value == 'number') return this.value;  
            else if (typeof this.value == 'object' && this.value instanceof date) return "datetime('" + Appacitive.Date.toISOString(this.value) + "')";
            else return this.value.toString();
        };
    };

    var _dateFieldValue = function(value) {
        this.value = value;
        
        this.getValue = function() {
            if (typeof this.value == 'object' && this.value instanceof Date) return "date('" + Appacitive.Date.toISODate(this.value) + "')";
            else return "date('" + this.value + "'')";
        };
    };

    var _timeFieldValue = function(value) {
        this.value = value;
        
        this.getValue = function() {
            if (typeof this.value == 'object' && this.value instanceof Date) return "time('" + Appacitive.Date.toISOTime(this.value) + "')";
            else return "time('" + this.value + "'')";
        };
    };

    var _dateTimeFieldValue = function(value) {
        this.value = value;
        
        this.getValue = function() {
            if (typeof this.value == 'object' && this.value instanceof Date) return "datetime('" + Appacitive.Date.toISOString(this.value) + "')";
            else return "datetime('" + this.value + "'')";
        };
    };

    var _fieldFilterUtils = function(type, name, context) { 

        if (!context) context = this;

        context.type = type;

        context.name = name;

        /* Helper functions for EqualTo */
        context.equalTo = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue(value), operator: _operators.isEqualTo });
        };

        context.equalToDate = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateFieldValue(value), operator: _operators.isEqualTo });
        };

        context.equalToTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _timeFieldValue(value), operator: _operators.isEqualTo });
        };

        context.equalToDateTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateTimeFieldValue(value), operator: _operators.isEqualTo });
        };


        /* Helper functions for GreaterThan */
        context.greaterThan = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue(value), operator: _operators.isGreaterThan });
        };

        context.greaterThanDate = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateFieldValue(value), operator: _operators.isGreaterThan });
        };

        context.greaterThanTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _timeFieldValue(value), operator: _operators.isGreaterThan });
        };

        context.greaterThanDateTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateTimeFieldValue(value), operator: _operators.isGreaterThan });
        };


        /* Helper functions for GreaterThanEqualTo */
        context.greaterThanEqualTo = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue(value), operator: _operators.isGreaterThanEqualTo });
        };

        context.greaterThanEqualToDate = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateFieldValue(value), operator: _operators.isGreaterThanEqualTo });
        };

        context.greaterThanEqualToTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _timeFieldValue(value), operator: _operators.isGreaterThanEqualTo });
        };

        context.greaterThanEqualToDateTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateTimeFieldValue(value), operator: _operators.isGreaterThanEqualTo });
        };

        /* Helper functions for LessThan */
        context.lessThan = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue(value), operator: _operators.isLessThan });
        };

        context.lessThanDate = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateFieldValue(value), operator: _operators.isLessThan });
        };

        context.lessThanTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _timeFieldValue(value), operator: _operators.isLessThan });
        };

        context.lessThanDateTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateTimeFieldValue(value), operator: _operators.isLessThan });
        };


        /* Helper functions for LessThanEqualTo */
        context.lessThanEqualTo = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue(value), operator: _operators.isLessThanEqualTo });
        };

        context.lessThanEqualToDate = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateFieldValue(value), operator: _operators.isLessThanEqualTo });
        };

        context.lessThanEqualToTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _timeFieldValue(value), operator: _operators.isLessThanEqualTo });
        };

        context.lessThanEqualToDateTime = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _dateTimeFieldValue(value), operator: _operators.isLessThanEqualTo });
        };

        /* Helper functions for string operations */
        context.like = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue("*" + value + "*"), operator: _operators.like });
        };

        context.startsWith = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue("*" + value + "*"), operator: _operators.like });
        };

        context.endsWith = function(value) {
            return new _fieldFilter({ field: this.name, fieldType: this.type, value: new _primitiveFieldValue("*" + value + "*"), operator: _operators.like });
        };

        context.contains = function(values) {
            return new _containsFilter({ field: this.name, fieldType: this.type, value: values, operator: _operators.isEqualTo });
        };

        /* Helper functions for between */
        context.between = function(val1, val2) {
            return new _betweenFilter({ field: this.name, fieldType: this.type, val1: new _primitiveFieldValue(val1), val2: new _primitiveFieldValue(val2), operator: _operators.between });
        };

        context.betweenDate = function(val1, val2) {
            return new _betweenFilter({ field: this.name, fieldType: this.type, val1: new _dateFieldValue(val1), val2: new _dateFieldValue(val2), operator: _operators.between });
        };

        context.betweenTime = function(val1, val2) {
            return new _betweenFilter({ field: this.name, fieldType: this.type, val1: new _timeFieldValue(val1), val2: new _timeFieldValue(val2), operator: _operators.between });
        };

        context.betweenDateTime = function(val1, val2) {
            return new _betweenFilter({ field: this.name, fieldType: this.type, val1: new _dateTimeFieldValue(val1), val2: new _dateTimeFieldValue(val2), operator: _operators.between });
        };

        /*Helper functionf for geolocation search */
        context.withinCircle = function(geoCoord, distance, unit) {
            return new _radialFilter({ field: this.name, fieldType: this.type, geoCoord: geoCoord, distance: distance, unit: unit, operator: _operators.withinCircle });
        };

        context.withinPolygon = function(geoCoords) {
            return new _polygonFilter({ field: this.name, fieldType: this.type, geoCoords: geoCoords, operator: _operators.withinPolygon });
        };
    };

    _propertyExpression = function(name) {
        
        if (!name || name.length == 0) throw new Error("Specify field name");
        
        this.field = name;

        _fieldFilterUtils("property", name, this);

        return this;
    };

    _aggregateExpression = function(name) {
        
        if (!name || name.length == 0) throw new Error("Specify field name");
        
        this.field = name;

        var _fieldFilters = new _fieldFilterUtils("aggregate", name);

        this.equalTo = function(value) {
            return _fieldFilters.equalTo(value);
        };

        this.greaterThan = function(value) {
            return _fieldFilters.greaterThan(value);
        };

        this.greaterThanEqualTo = function(value) {
            return _fieldFilters.greaterThanEqualTo(value);
        };

        this.lessThan = function(value) {
            return _fieldFilters.lessThan(value);
        };

        this.lessThanEqualTo = function(value) {
            return _fieldFilters.lessThanEqualTo(value);
        };

        this.between = function(val1, val2) {
            return _fieldFilters.between(val1, val2);
        };

        return this;
    };

    _attributeExpression = function(name) {
        if (!name || name.length == 0) throw new Error("Specify field name");
        
        this.field = name;

        var _fieldFilters = new _fieldFilterUtils("attribute", name);

        /* Helper functions for string operations */
        this.like = function(value) {
            return _fieldFilters.like(value);
        };

        this.startWith = function(value) {
            return _fieldFilters.startsWith(value);
        };

        this.endsWith = function(value) {
            return _fieldFilters.endsWith(value);
        };

        this.equalTo = function(value) {
            return _fieldFilters.equalTo(value);
        };        

        this.contains = function(values) {
            return _fieldFilters.contains(values);
        };

        return this;
    };

    Appacitive.Filter = {
        Property: function(name) {
            return new _propertyExpression(name)
        },
        Aggregate: function(name) {
            return new _aggregateExpression(name)
        },
        Attribute: function(name) {
            return new _attributeExpression(name)
        },
        Or: function() {
            return new _compundFilter(_operators.or, arguments); 
        },
        And: function() {
            return new _compundFilter(_operators.and, arguments); 
        }
    };

})(global);