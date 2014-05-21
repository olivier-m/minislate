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


exports.extend = extend;
exports.Class = Class;
