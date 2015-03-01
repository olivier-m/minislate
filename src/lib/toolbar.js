/* jshint newcap:false */
/* global require, exports */
var _util = require('./util'),
    _controls = require('./controls'),

    ControlsMixin = _controls.ControlsMixin,
    extend = _util.extend,
    Class = _util.Class;


var Toolbar = Class(Object, {
    defaults: {
        classPrefix: '',
        fontAwesomeEnabled: false
    },
    init: function(editor, options) {
        ControlsMixin.prototype.init.call(this);

        this.editor = editor;
        this.options = extend({}, this.defaults, options || {});
        this.element = document.createElement('div');
        this.container = document.createElement('ul');
        this.dialog = document.createElement('div');

        this.container.classList.add(this._getClassName('controls'));
        if (this.editor.isRtl) this.container.classList.add('rtl');
        this.element.classList.add(this._getClassName('toolbar'));
        document.body.appendChild(this.element);

        this.dialog.classList.add(this._getClassName('dialog'));
        this.dialog.style.display = 'none';

        this.element.appendChild(this.container);
        this.element.appendChild(this.dialog);
        this.element.style.visibility = 'hidden';

        this._showEvt = document.createEvent('Event');
        this._showEvt.initEvent('toolbar.show', false, true);
        this._hideEvt = document.createEvent('Event');
        this._hideEvt.initEvent('toolbar.hide', false, true);

        this._dirty = false;
    },

    _getClassName: function(name) {
        return this.options.classPrefix + name;
    },

    click: function(fn) {
        this.element.addEventListener('click', fn);
    },
    focus: function(fn) {
        this.element.addEventListener('focus', fn);
    },

    hide: function() {
        this.element.style.visibility = 'hidden';
        this.element.dispatchEvent(this._hideEvt);
    },
    show: function() {
        if (this._dirty) {
            this.drawControls();
        }
        this.element.style.visibility = 'visible';
        this.element.dispatchEvent(this._showEvt);
    },

    showDialog: function() {
        this.emptyDialog();
        this.dialog.style.display = 'block';
        this.container.style.display = 'none';
    },
    hideDialog: function() {
        this.dialog.style.display = 'none';
        this.container.style.display = 'block';
    },
    emptyDialog: function() {
        while (this.dialog.firstChild) {
            this.dialog.removeChild(this.dialog.firstChild);
        }
    },

    move: function(top, left) {
        this.element.style.top = top + 'px';
        this.element.style.left = left + 'px';
    },

    addControl: function(Klass, id, options) {
        this.controls[id] = new Klass(this, id, options);
        this._dirty = true;
    },

    removeControl: function(id) {
        if (!this.controls[id]) {
            return;
        }

        ControlsMixin.prototype.removeControl.call(this, id);
        this._dirty = true;
    },

    drawControls: function() {
        var control;

        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        for (var id in this.controls) {
            control = this.controls[id];
            this.container.appendChild(control.drawElement());
        }
        this._dirty = false;
    }
});

exports.Toolbar = Toolbar;
