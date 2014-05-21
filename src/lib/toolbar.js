/* jshint newcap:false */
/* global require, exports */
var util = require('./util'),
    extend = util.extend,
    Class = util.Class;


var Item = Class(Object, {
    defaults: {
        label: null,
        title: '',
        className: null,
        fontAwesomeID: null,
        init: function() {},
        isVisible: null,
        isHighlighted: null
    },

    init: function(toolbar, id, options) {
        var self = this;
        this.options = extend({}, this.defaults, options || {});
        this.toolbar = toolbar;
        this.id = id;
        this.label = this.options.label || this.id;
        this.className = this.options.className || this.id.toLowerCase().replace(/\s+/, '-');

        this.element = this._initElement();
        this.setLabel();
        this.element.setAttribute('title', this.options.title);

        // Callbacks
        if (typeof(this.options.init) === 'function') {
            this.options.init.call(this);
        }

        if (typeof(this.options.isVisible) === 'function') {
            this.toolbar.element.addEventListener('toolbar.show', function(evt) {
                self.setVisibility(self.options.isVisible.call(self, evt));
            });
        }

        if (typeof(this.options.isHighlighted) === 'function') {
            this.toolbar.element.addEventListener('toolbar.show', function(evt) {
                self.setHighlight(self.options.isHighlighted.call(self, evt));
            });
        }
    },

    _initElement: function() {
        throw new Error('_initElement not implemented');
    },

    setLabel: function(label, fontAwesomeID) {
        label = label || this.label;
        fontAwesomeID = fontAwesomeID || this.options.fontAwesomeID;

        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        var text = document.createTextNode(label);
        if (this.toolbar.options.fontAwesomeEnabled && fontAwesomeID) {
            var fa = this.getFaElement(fontAwesomeID);
            var span = document.createElement('span');
            span.appendChild(text);
            fa.appendChild(span);
            this.element.appendChild(fa);
        } else {
            this.element.appendChild(text);
        }
    },

    setVisibility: function(state) {
        if (state) {
            this.element.parentNode.style.display = 'block';
        } else {
            this.element.parentNode.style.display = 'none';
        }
    },

    setHighlight: function(state) {
        if (state) {
            if (!this.element.classList.contains('editor-highlight')) {
                this.element.classList.add('editor-highlight');
            }
        } else {
            this.element.classList.remove('editor-highlight');
        }
    },

    getFaElement: function(id) {
        var el = document.createElement('i');
        el.classList.add('fa', 'fa-' + id);
        return el;
    }
});


var Button = Class(Item, {
    defaults: extend({}, Item.defaults, {
        click: null
    }),

    init: function(toolbar, id, options) {
        Item.prototype.init.call(this, toolbar, id, options);
        var self = this;

        this.element.classList.add(
            this.toolbar.options.buttonClass,
            this.toolbar.options.buttonClass + '-' + this.className
        );

        if (typeof(this.options.click) === 'function') {
            this.element.addEventListener('click', function(evt) {
                self.options.click.call(self, evt);
            });
        }
    },

    _initElement: function() {
        return document.createElement('button');
    },

    setLabel: function(label, fontAwesomeID) {
        Item.prototype.setLabel.call(this, label, fontAwesomeID);

        if (this.menu && this.options.title) {
            var el = document.createElement('em');
            var text = document.createTextNode(' - ' + this.options.title);
            el.appendChild(text);
            this.element.appendChild(el);
        }
    }
});


var Menu = Class(Item, {
    defaults: extend({}, Item.defaults, {
        closeDelay: 400
    }),

    init: function(toolbar, id, options) {
        var self = this;
        Item.prototype.init.call(this, toolbar, id, options);

        this.element.classList.add(
            this.toolbar.options.menuClass,
            this.toolbar.options.menuClass + '-' + this.className
        );

        this.container = document.createElement('ul');
        this.container.style.display = 'none';

        // Open/Close handlers
        // There are added on toolbar show to avoid mouseover events when toolbar is moving
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

    _initElement: function() {
        return document.createElement('button');
    },

    setLabel: function(label, fontAwesomeID) {
        Item.prototype.setLabel.call(this, label, fontAwesomeID);
        var fa = this.getFaElement('chevron-down');
        this.element.appendChild(document.createTextNode(' '));
        this.element.appendChild(fa);
    },

    _open: function() {
        var item, i;

        // Close all other menus
        for (i in this.toolbar.items) {
            item = this.toolbar.items[i];
            if (item.instance instanceof Menu) {
                item.instance._canceltimer();
                item.instance._close();
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
        }, this.options.closeDelay);
    },
    _canceltimer: function() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    }
});


var Dialog = Class(Object, {
    init: function(toolbar) {
        this.toolbar = toolbar;
        this.element = toolbar.dialog;
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
            var el = Item.prototype.getFaElement.call(null, options.fontAwesomeID);
            button.appendChild(el);
        }

        return button;
    }
});


var Toolbar = Class(Object, {
    defaults: {
        id: 'toolbar',
        toolbarClass: 'editor-toolbar',
        dialogClass: 'editor-dialog',
        buttonClass: 'editor-button',
        menuClass: 'editor-menu',
        fontAwesomeEnabled: false
    },

    init: function(options) {
        this.options = extend({}, this.defaults, options || {});
        this.element = document.createElement('div');
        this.controls = document.createElement('ul');
        this.dialog = document.createElement('div');

        this.element.id = this.options.id;
        this.element.classList.add(this.options.toolbarClass);
        document.body.appendChild(this.element);

        this.dialog.classList.add(this.options.dialogClass);
        this.dialog.style.display = 'none';

        this.element.appendChild(this.controls);
        this.element.appendChild(this.dialog);
        this.element.style.visibility = 'hidden';

        this.items = {};
        this.drawItems();

        this._showEvt = document.createEvent('Event');
        this._showEvt.initEvent('toolbar.show', false, true);
        this._hideEvt = document.createEvent('Event');
        this._hideEvt.initEvent('toolbar.hide', false, true);
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
        this.element.style.visibility = 'visible';
        this.element.dispatchEvent(this._showEvt);
    },

    showDialog: function() {
        this.emptyDialog();
        this.dialog.style.display = 'block';
        this.controls.style.display = 'none';
    },
    hideDialog: function() {
        this.dialog.style.display = 'none';
        this.controls.style.display = 'block';
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

    addItem: function(Klass, id, options, redraw) {
        redraw = typeof(redraw) === 'undefined' ? true : redraw;
        var item = new Klass(this, id, options);
        var el = document.createElement('li');
        el.appendChild(item.element);
        this.items[item.id] = {element: el, instance: item};

        if (item instanceof Menu) {
            el.appendChild(item.container);
            el.classList.add(this.options.menuClass);
        } else {
            el.classList.add(this.options.buttonClass);
        }

        if (redraw) {
            this.drawItems();
        }
    },

    addButton: function(id, options, redraw) {
        this.addItem(Button, id, options, redraw);
    },

    addMenu: function(id, options, redraw) {
        this.addItem(Menu, id, options, redraw);
    },

    removeItem: function(id) {
        if (!this.items[id]) {
            return;
        }

        var el = this.items[id].element;

        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        delete(this.items[id]);
    },

    drawItems: function() {
        var i, item, parent, sibling,
            reposition = [];

        while (this.controls.firstChild) {
            this.controls.removeChild(this.controls.firstChild);
        }

        for (var id in this.items) {
            item = this.items[id];

            this.controls.appendChild(item.element);

            if (item.instance.options.after || item.instance.options.menu) {
                reposition.push(id);
            }
            item.instance.menu = false;
        }

        for (i=0; i<reposition.length; i++) {
            item = this.items[reposition[i]];

            // Items in menu
            if (item.instance.options.menu && !(item instanceof Menu)) {
                parent = this.items[item.instance.options.menu];
                if (parent && parent.instance instanceof Menu) {
                    parent.instance.container.appendChild(item.element);
                    item.instance.menu = parent.instance;
                    item.instance.setLabel();
                }
            }

            // Items position
            if (item.instance.options.after) {
                sibling = this.items[item.instance.options.after];
                if (sibling) {
                    sibling.element.parentNode.insertBefore(item.element, sibling.element.nextSibling);
                }
            }
        }

        return this;
    },

    newDialog: function() {
        return new Dialog(this);
    }
});


exports.Toolbar = Toolbar;
exports.Item = Item;
exports.Button = Button;
exports.Menu = Menu;
exports.Dialog = Dialog;
