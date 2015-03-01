/* global exports */

// Simple extend system
var extend = function() {
    var args = Array.prototype.slice.call(arguments);
    var base = args.shift();
    var type = '';
    if (typeof base === 'string' || typeof base === 'boolean') {
        type = (base === true)?'deep':base;
        base = args.shift();
        if (type === 'defaults') {
            base = extend({}, base); //clone defaults into new object
            type = 'strict';
        }
    }
    for (var i = 0, c = args.length; i < c; i++) {
        var prop = args[i];
        for (var name in prop) {
            if (type === 'deep' && typeof prop[name] === 'object' && typeof base[name] !== 'undefined') {
                extend(type, base[name], prop[name]);
            }
            else if (type !== 'strict' || (type === 'strict' && typeof base[name] !== 'undefined')) {
                base[name] = prop[name];
            }
        }
    }
    return base;
};


// A very simple class implementation
var Class = function(parent, proto) {
    var C = function() {
        if (typeof(this.init) !== 'undefined') {
            this.init.apply(this, arguments);
        }
    };
    var F = function() {};

    F.prototype = parent.prototype;
    C.prototype = new F();
    C.prototype.constructor = parent;
    extend(C.prototype, proto);

    return C;
};


/* *********************** I18N  **************************/
// Very simple translation management system.
// Use tr('yourstring') when you deal with a string that needs to be
// translatable.
// If you have dynamic variables, you can use tr('Title level {level}', {level: 1})
// Use tr.register({string: translation}) to populate the locale.
var I18n = function (s, data) {
    return new I18n.LazyString(s, data);
};
I18n.locale = {};
I18n.register = function (locale) {
    for (var k in locale) I18n.locale[k] = locale[k];
};
I18n.LazyString = function (s, data) {
    this.s = s;
    this.data = data || {};
};
I18n.LazyString.prototype.toString = function () {
    return I18n.template(I18n.locale[this.s] || this.s, this.data);
};
I18n.template = function (str, data) {
    return str.replace(/\{ *([\w_]+) *\}/g, function (s, k) {
        return data[k] || '';
    });
};



// Some array utilities from underscore.js
var _ = {};
/* jshint ignore:start */
var breaker = {};
var nativeForEach = Array.prototype.forEach,
    nativeMap = Array.prototype.map,
    nativeFilter = Array.prototype.filter;

_.each = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, length = obj.length; i < length; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
    } else {
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
        }
    }
    return obj;
};
_.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    _.each(obj, function(value, index, list) {
        results.push(iterator.call(context, value, index, list));
    });
    return results;
};
_.filter = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    _.each(obj, function(value, index, list) {
        if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
};
/* jshint ignore:end */

exports.extend = extend;
exports.Class = Class;
exports._ = _;
exports.tr = I18n;
