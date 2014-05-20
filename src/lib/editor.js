/* global require */

/*
 * Base object
 */

var rangy = require('../vendor/rangy/core').api;

var Base = Object.freeze(Object.create(Object.prototype, {
    'new': {
        value: function create() {
            var object = Object.create(this);
            object.initialize.apply(object, arguments);
            return object;
        }
    },
    initialize: {
        value: function initialize() {}
    },
    merge: {
        value: function merge() {
            var descriptor = {};
            Array.prototype.forEach.call(arguments, function (properties) {
                Object.getOwnPropertyNames(properties).forEach(function(name) {
                    descriptor[name] = Object.getOwnPropertyDescriptor(properties, name);
                });
            });
            Object.defineProperties(this, descriptor);
            return this;
        }
    },
    extend: {
        value: function extend() {
            return Object.freeze(this.merge.apply(Object.create(this), arguments));
        }
    }
}));


/*
 * Editor (main)
 */
var Editor = function(elements, options) {
    if (!window.getSelection) {
        throw new Error('Browser features missing.');
    }
    return this.init(elements, options);
};

Editor.prototype = {
    defaults: {
        delay: 200,
        diffLeft: 2,
        diffTop: -10,
        fontAwesomeEnabled: true
    },

    init: function(elements, options) {
        this.elements = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
        if (this.elements.length === 0) {
            return;
        }

        if (!rangy.initialized) {
            rangy.init();
        }

        this.isActive = true;
        this.id = this.elements.length + 1;
        this.options = Base.extend(this.defaults, options);

        // Internal properties
        this._currentEditor = null;

        // Window resizing handler
        this._resizeHandler = (function(self) {
            var timeout = null;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    self.setToolbarPosition();
                }, 250);
            };
        })(this);

        // Init editor
        this.initElements()
            .initToolbar()
            .bindSelect()
            .bindTyping();
    },

    iter: function(callback) {
        var i;
        for (i=0; i<this.elements.length; i++) {
            callback.call(this, this.elements[i]);
        }
        return this;
    },

    on: function(name, handler) {
        return this.iter(function(node) {
            node.addEventListener(name, handler);
        });
    },

    off: function(name, handler) {
        return this.iter(function(node) {
            node.removeEventListener(name, handler);
        });
    },

    initElements: function() {
        var self = this;
        this.iter(function(node) {
            node.setAttribute('contentEditable', true);
            node.setAttribute('data-editor-element', true);
        });

        this.on('focus', function() {
            self._onFocus();
        });
        return this;
    },

    bindSelect: function() {
        var self = this,
            timeout = null;

        var wrapper = function(evt) {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                self._onSelect(evt);
            }, self.options.delay);
        };

        document.addEventListener('mouseup', wrapper);
        document.addEventListener('keyup', wrapper);
        return this;
    },

    bindTyping: function() {
        var self = this;

        this.on('keyup', function() {
            // Force paragraph on empty block
            if (self.getSelection().getStart() === self._currentEditor) {
                self.exec('formatBlock', 'p');
            }
        });
    },

    initToolbar: function() {
        this.toolbar = Toolbar['new']({
            fontAwesomeEnabled: this.options.fontAwesomeEnabled
        });
        this.toolbar.editor = this;

        this.addDefaultItems();
        return this;
    },

    addDefaultItems: function() {
        var i, item;
        for (i=0; i<Editor.defaultItems.length; i++) {
            item = Editor.defaultItems[i];
            if (item.type === 'menu') {
                this.addMenu(item.id, item.options, false);
            } else {
                this.addButton(item.id, item.options, false);
            }
        }
        this.toolbar.drawItems();

        return this;
    },

    addButton: function(id, options, redraw) {
        this.toolbar.addButton(id, options, redraw);
    },

    addMenu: function(id, options, redraw) {
        this.toolbar.addMenu(id, options, redraw);
    },

    exec: function(cmd, arg) {
        document.execCommand(cmd, false, arg);
    },

    showToolbar: function() {
        this.hideDialog();
        this.toolbar.show();
        this.setToolbarPosition();
        window.addEventListener('resize', this._resizeHandler);
        return this;
    },

    hideToolbar: function() {
        window.removeEventListener('resize', this._resizeHandler);
        this.toolbar.hide();
        return this;
    },

    showDialog: function(callback) {
        var self = this;
        this.toolbar.showDialog();

        setTimeout(function() {
            self.setToolbarPosition();
            if (typeof(callback) === 'function') {
                callback.call(self);
            }
        }, 20);

        return this;
    },

    hideDialog: function() {
        this.toolbar.hideDialog();
        this.setToolbarPosition();
        return this;
    },

    setToolbarPosition: function() {
        var info = this.getRangeInfo(),
            container = info.container,
            surrounding = info.surrounding,
            boundary = container.getBoundingClientRect(),
            height = this.toolbar.element.offsetHeight,
            width = this.toolbar.element.offsetWidth;

        if (surrounding && surrounding.nodeType === 1) {
            boundary = surrounding.getBoundingClientRect();
        }

        if (!info.range.collapsed && info.range.nativeRange.getBoundingClientRect) {
            boundary = info.range.nativeRange.getBoundingClientRect();
        }

        // Top position
        var top = 0;
        if (boundary.top < height) {
            top = boundary.bottom - this.options.diffTop + window.pageYOffset;
        } else {
            top = boundary.top + this.options.diffTop + window.pageYOffset - height;
        }

        // Left position
        var left = boundary.left;
        if (this._currentEditor.offsetWidth < width + boundary.left) {
            left =
                this._currentEditor.offsetWidth + this._currentEditor.offsetLeft -
                width - this.options.diffLeft;
        }

        this.toolbar.move(top, left);
    },

    restoreSelection: function(selection, showToolbar) {
        showToolbar = typeof(showToolbar) === 'undefined' ? true : showToolbar;

        rangy.restoreSelection(selection);
        rangy.removeMarkers(selection);
        this._getSelectionElement().focus();
        if (showToolbar) {
            this.showToolbar();
        }
    },

    _onFocus: function() {
        this._currentEditor = this._getSelectionElement();
    },

    _onSelect: function(evt) {
        var elements = [].slice.call(this.elements);
        elements.push(this.toolbar.element);
        if (!rangy.dom.hasParents(evt.target, elements)) {
            this.hideToolbar();
            this._currentEditor = false;
            return;
        }

        this._currentEditor = this._getSelectionElement();
        if (!rangy.dom.hasParents(evt.target, [this.toolbar.element])) {
            this.showToolbar();
        }
    },

    // Selected nodes utils.
    getSelection: function() {
        return rangy.getSelection();
    },

    getRange: function(index) {
        index = typeof(index) === 'undefined' ? 0 : index;
        return this.getSelection().getRangeAt(0);
    },

    setRange: function(node) {
        var range = rangy.createRange();
        range.selectNode(node);
        this.getSelection().setSingleRange(range);
    },

    getRangeInfo: function() {
        var range = this.getRange(),
            surrounding = range.getSurroundingNode(),
            container = range.getContainer(),
            topSurrounding,
            topContainer;

        if (surrounding !== null) {
            topSurrounding = rangy.dom.getTopContainer(surrounding);
        }
        if (container !== null) {
            topContainer = rangy.dom.getTopContainer(container);
        }

        return {
            range: range,
            surrounding: surrounding,
            container: container,
            topSurrounding: topSurrounding || null,
            topContainer: topContainer || null
        };
    },

    filterSelectionNodes: function(filter) {
        var info = this.getRangeInfo(),
            node,
            res = [];

        filter = filter || function(type, name, node) { return node; };

        // Set starting point
        if (info.surrounding && info.surrounding.nodeType === 1) {
            node = info.surrounding;
        } else {
            node = info.container;
        }

        while (node && node.childNodes.length === 1 && node.firstChild.nodeType === 1) {
            node = node.firstChild;
        }

        // Iterate parents from starting point
        while (node && node !== this._currentEditor) {
            if (filter(node.nodeType, node.nodeName.toLowerCase(), node)) {
                res.push(node);
            }
            node = node.parentNode;
        }
        return res;
    },

    filterSelectionNodeName: function() {
        var names = [].slice.apply(arguments);
        return this.filterSelectionNodes(function(t, n) {
            return t === 1 && names.indexOf(n) !== -1;
        });
    },

    _getSelectionElement: function() {
        var range = this.getRange(),
            current = range.commonAncestorContainer,
            parent = current.parentNode,
            result;

        var getEditor = function(e) {
            var parent = e;
            try {
                while (!parent.getAttribute('data-editor-element')) {
                    parent = parent.parentNode;
                }
            } catch (errb) {
                return false;
            }
            return parent;
        };

        // First try on current node
        try {
            if (current.getAttribute('data-editor-element')) {
                result = current;
            } else {
                result = getEditor(parent);
            }
        // If not search in the parent nodes.
        } catch (err) {
            result = getEditor(parent);
        }
        return result;
    }
};

Editor.defaultItems = [];

Editor.addDefaultButton = function(id, options) {
    Editor.defaultItems.push({id: id, options: options, type:'button'});
};

Editor.addDefaultMenu = function(id, options) {
    Editor.defaultItems.push({id: id, options: options, type:'menu'});
};


/*
 * Toolbar
 */
var Toolbar = Base.extend({
    defaults: {
        id: 'toolbar',
        toolbarClass: 'editor-toolbar',
        dialogClass: 'editor-dialog',
        buttonClass: 'editor-button',
        menuClass: 'editor-menu',
        fontAwesomeEnabled: false
    },

    initialize: function(options) {
        this.options = Base.extend(this.defaults, options || {});
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
        var item = Klass['new'](this, id, options);
        var el = document.createElement('li');
        el.appendChild(item.element);
        this.items[item.id] = {element: el, instance: item};

        if (Menu.isPrototypeOf(item)) {
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
            if (item.instance.options.menu && !Menu.isPrototypeOf(item.instance)) {
                parent = this.items[item.instance.options.menu];
                if (parent && Menu.isPrototypeOf(parent.instance)) {
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
        return Dialog['new'](this);
    }
});

var Item = Base.extend({
    defaults: {
        label: null,
        title: '',
        className: null,
        fontAwesomeID: null,
        init: function() {},
        isVisible: null,
        isHighlighted: null
    },

    initialize: function(toolbar, id, options) {
        var self = this;
        this.options = Base.extend(this.defaults, options || {});
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

var Button = Item.extend({
    defaults: Base.extend(Item.defaults, {
        click: null
    }),

    initialize: function(toolbar, id, options) {
        var self = this;
        Item.initialize.call(this, toolbar, id, options);

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
        Item.setLabel.call(this, label, fontAwesomeID);

        if (this.menu && this.options.title) {
            var el = document.createElement('em');
            var text = document.createTextNode(' - ' + this.options.title);
            el.appendChild(text);
            this.element.appendChild(el);
        }
    }
});


var Menu = Item.extend({
    defaults: Base.extend(Item.defaults, {
        closeDelay: 400
    }),

    initialize: function(toolbar, id, options) {
        var self = this;
        Item.initialize.call(this, toolbar, id, options);

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
        Item.setLabel.call(this, label, fontAwesomeID);
        var fa = this.getFaElement('chevron-down');
        this.element.appendChild(document.createTextNode(' '));
        this.element.appendChild(fa);
    },

    _open: function() {
        var item, i;

        // Close all other menus
        for (i in this.toolbar.items) {
            item = this.toolbar.items[i];
            if (Menu.isPrototypeOf(item.instance)) {
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

var Dialog = Base.extend({
    initialize: function(toolbar) {
        this.toolbar = toolbar;
        this.element = toolbar.dialog;
    },

    addTextField: function(label, options) {
        var defaults = {
            size: 30,
            enter: null,
            escape: null
        };
        options = Base.extend(defaults, options || {});

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
        options = Base.extend(defaults, options || {});

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
            var el = Item.getFaElement.call(null, options.fontAwesomeID);
            button.appendChild(el);
        }

        return button;
    }
});

exports.editor = Editor;
