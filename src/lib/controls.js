/* jshint newcap:false, unused: vars */
/* globals exports, require */

var _util = require('./util'),

    Class = _util.Class,
    extend = _util.extend;


var ControlsMixin = Class(Object, {
    init: function() {
        this.controls = {};
    },
    addControl: function(klass, id, options) {
        throw new Error('Not implemented');
    },
    removeControl: function(id) {
        if (!this.controls[id]) {
            return;
        }
        delete(this.controls[id]);
    }
});


var BaseControl = Class(Object, {
    defaults: {
        label: null,
        title: '',
        classes: '',
        fontAwesomeID: null
    },
    classes: [],

    init: function(toolbar, id, options) {
        this.options = extend({}, this.defaults, options || {});
        this.toolbar = toolbar;
        this.id = id;
        this.label = this.options.label || this.id;

        this.element = this._initElement();
        this.setLabel();
        this.element.setAttribute('title', this.options.title);

        if (this.options.classes) {
            this.classes.push.apply(this.classes, this.options.classes.split(/\s+/));
        }

        for (var i=0; i<this.classes.length; i++) {
            this.element.classList.add(this.toolbar._getClassName(this.classes[i]));
        }

        var self = this;

        this.toolbar.element.addEventListener('toolbar.show', function() {
            self.setVisibility();
            self.setHighlight();
        });
    },

    _initElement: function() {
        throw new Error('_initElement not implemented');
    },

    drawElement: function(e) {
        e = e || document.createElement('li');
        e.appendChild(this.element);
        return e;
    },

    setLabel: function(label, fontAwesomeID) {
        label = label || this.label;
        fontAwesomeID = fontAwesomeID || this.options.fontAwesomeID;

        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        var text = document.createTextNode(label);
        var span = document.createElement('span');
        span.appendChild(text);
        if (this.toolbar.options.fontAwesomeEnabled && fontAwesomeID) {
            var fa = this.getFaElement(fontAwesomeID);
            fa.appendChild(span);
            this.element.appendChild(fa);
        } else {
            this.element.appendChild(span);
        }
    },

    isHighlighted: function() {
        return false;
    },
    isVisible: function() {
        return true;
    },

    setVisibility: function(state) {
        state = typeof(state) !== 'undefined' ? state : this.isVisible();
        if (state) {
            this.element.parentNode.style.display = 'block';
        } else {
            this.element.parentNode.style.display = 'none';
        }
    },
    setHighlight: function(state) {
        state = typeof(state) !== 'undefined' ? state : this.isHighlighted();
        var cls = this.toolbar._getClassName('highlight');
        if (state) {
            if (!this.element.classList.contains(cls)) {
                this.element.classList.add(cls);
            }
        } else {
            this.element.classList.remove(cls);
        }
    },

    getFaElement: function(id) {
        var el = document.createElement('i');
        el.classList.add('fa', 'fa-' + id);
        return el;
    }
});


var Button = Class(BaseControl, {
    classes: ['button'],

    init: function(toolbar, id, options) {
        BaseControl.prototype.init.call(this, toolbar, id, options);

        var self = this;
        this.element.addEventListener('click', function(evt) {
            self.click(evt);
        });
    },

    _getParentElement: function() {
        var e = BaseControl.prototype._getParentElement.call(this);
        e.classList.add(this.toolbar._getClassName('button'));
        return e;
    },

    _initElement: function() {
        return document.createElement('button');
    },

    drawElement: function() {
        var e = document.createElement('li');
        e.classList.add(this.toolbar._getClassName('button'));
        return BaseControl.prototype.drawElement.call(this, e);
    },

    click: function() {
    }
});


var Menu = Class(BaseControl, {
    defaults: extend({}, BaseControl.prototype.defaults, {
        controls: []
    }),
    classes: ['button'],
    closeDelay: 400,

    init: function(toolbar, id, options) {
        ControlsMixin.prototype.init.call(this);
        BaseControl.prototype.init.call(this, toolbar, id, options);

        // Add predefined controls
        var _klass, _id, _options;
        for (var i=0; i<this.options.controls.length; i++) {
            _klass = this.options.controls[i][0];
            _id = this.options.controls[i][1];
            _options = this.options.controls[i][2];

            this.addControl(_klass, _id, _options);
        }

        this.container = document.createElement('ul');
        this.container.classList.add(this.toolbar._getClassName('controls'));
        this.container.style.display = 'none';

        // Open/Close handlers
        // There are added on toolbar show to avoid mouseover events when toolbar is moving
        var self = this;
        var openHandler = function() {
            self._open();
        };
        var closeHandler = function() {
            self._closetimer();
        };
        var cancelHandler = function() {
            self._canceltimer();
        };

        this.toolbar.element.addEventListener('toolbar.show', function() {
            self._close();
            self.element.removeEventListener('mouseover', openHandler);
            self.element.removeEventListener('mouseout', closeHandler);
            self.container.removeEventListener('mouseover', cancelHandler);
            self.container.removeEventListener('mouseout', closeHandler);

            setTimeout(function() {
                self.element.addEventListener('mouseover', openHandler);
                self.element.addEventListener('mouseout', closeHandler);
                self.container.addEventListener('mouseover', cancelHandler);
                self.container.addEventListener('mouseout', closeHandler);
            }, 200);
        });
    },

    _open: function() {
        var control, i;

        // Close all other menus
        for (i in this.toolbar.controls) {
            control = this.toolbar.controls[i];
            if (control instanceof Menu) {
                control._canceltimer();
                control._close();
            }
        }
        this._canceltimer();
        this.container.style.display = 'block';
    },
    _close: function() {
        this.container.style.display = 'none';
    },
    _closetimer: function() {
        var self = this;
        this.closeTimeout = setTimeout(function() {
            self._close();
        }, this.closeDelay);
    },
    _canceltimer: function() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    },

    _initElement: function() {
        return document.createElement('button');
    },

    isHighlighted: function() {
        var control, id;
        for (id in this.controls) {
            // Stop on first highlighted menu item and set its label to menu.
            control = this.controls[id];
            if (control.id, control.isHighlighted()) {
                this.setLabel(control.label, control.options.fontAwesomeID);
                return true;
            }
        }
        return false;
    },

    drawElement: function() {
        var e = document.createElement('li');
        e.classList.add(this.toolbar._getClassName('menu'));
        e = BaseControl.prototype.drawElement.call(this, e);

        // Add menu container
        e.appendChild(this.container);
        this.drawControls();
        return e;
    },

    setLabel: function(label, fontAwesomeID) {
        BaseControl.prototype.setLabel.call(this, label, fontAwesomeID);
        this.element.appendChild(document.createTextNode(' '));
        var e;
        if (this.toolbar.options.fontAwesomeEnabled) {
            e = this.getFaElement('chevron-down');
        } else {
            e = document.createElement('span');
            e.classList.add(this.toolbar._getClassName('menu-arrow'));
            e.appendChild(document.createTextNode('\u2193'));
        }
        this.element.appendChild(e);
    },

    addControl: function(Klass, id, options) {
        this.controls[id] = new Klass(this.toolbar, id, options);
        this.toolbar._dirty = true;
    },

    removeControl: function(id) {
        if (!this.controls[id]) {
            return;
        }

        ControlsMixin.prototype.removeControl.call(this, id);
        this.toolbar._dirty = true;
    },

    drawControls: function() {
        var control, id, e;

        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        for (id in this.controls) {
            control = this.controls[id];
            e = control.drawElement();
            control.setLabel();
            this.container.appendChild(e);

            if (control.options.title) {
                var el = document.createElement('em');
                var text = document.createTextNode(' - ' + control.options.title);
                el.appendChild(text);
                e.firstChild.appendChild(el);
            }
        }
    }
});


var Dialog = Class(Object, {
    init: function(control) {
        this.control = control;
        this.toolbar = control.toolbar;
        this.element = control.toolbar.dialog;
    },

    addTextField: function(label, options) {
        var defaults = {
            size: 30,
            enter: null,
            escape: null
        };
        options = extend({}, defaults, options || {});

        var input = document.createElement('input');
        var _label = document.createElement('label');
        _label.appendChild(document.createTextNode(label));
        input.setAttribute('size', options.size);
        input.setAttribute('type', 'text');
        _label.appendChild(input);
        this.element.appendChild(_label);

        if (options.enter || options.escape) {
            input.addEventListener('keyup', function(evt) {
                if (options.escape && evt.which === 27) {
                    options.escape.call(input, evt);
                }
                else if (options.enter && evt.which === 13) {
                    options.enter.call(input, evt);
                }
            });
        }

        return input;
    },

    addButton: function(label, options) {
        var defaults = {
            click: null,
            fontAwesomeID: null
        };
        options = extend({}, defaults, options || {});

        var button = document.createElement('button');
        button.appendChild(document.createTextNode(label));
        this.element.appendChild(document.createTextNode(' '));
        this.element.appendChild(button);
        this.element.appendChild(document.createTextNode(' '));

        if (options.click && typeof(options.click) === 'function') {
            button.addEventListener('click', options.click);
        }

        if (options.fontAwesomeID && this.toolbar.options.fontAwesomeEnabled) {
            button.removeChild(button.firstChild);
            button.setAttribute('title', label);
            var el = BaseControl.prototype.getFaElement.call(null, options.fontAwesomeID);
            button.appendChild(el);
        }

        return button;
    }
});


exports.ControlsMixin = ControlsMixin;
exports.BaseControl = BaseControl;
exports.Button = Button;
exports.Menu = Menu;
exports.Dialog = Dialog;
