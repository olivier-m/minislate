/* jshint newcap:false */
/* global require, exports */
var rangy = require('../vendor/rangy/core').api;
var extend = require('./util').extend;
var Class = require('./util').Class;
var Toolbar = require('./toolbar').Toolbar;
var _ = require('./util')._;

/*
 * Editor (main)
 */
var Editor = Class(Object, {
    defaults: {
        delay: 300,
        diffLeft: 2,
        diffTop: -10,
        classPrefix: 'editor-',
        fontAwesomeEnabled: true
    },
    BLOCK_NODES: 'P H1 H2 H3 H4 H5 H6 UL OL PRE DL DIV NOSCRIPT BLOCKQUOTE FORM HR TABLE FIELDSET ADDRESS'.split(' '),

    init: function(elements, options) {
        if (!window.getSelection) {
            throw new Error('Browser features missing.');
        }

        this.elements = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
        if (this.elements.length === 0) {
            return;
        }

        if (!rangy.initialized) {
            rangy.init();
        }

        this.isActive = true;
        this.id = this.elements.length + 1;
        this.options = extend({}, this.defaults, options);

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
            var selection = self.getSelection();
            if (selection.isCollapsed && selection.getEnclosingNode() === self._currentEditor) {
                self.exec('formatBlock', 'p');
            }
        });
    },

    initToolbar: function() {
        var self = this;

        this.toolbar = new Toolbar(this, {
            classPrefix: this.options.classPrefix,
            fontAwesomeEnabled: this.options.fontAwesomeEnabled
        });

        // Restore focus on editor element when showing toolbar
        this.toolbar.element.addEventListener('toolbar.show', function() {
            self.focus();
        });

        // Remove all residual markers when hidding toolbar
        this.toolbar.element.addEventListener('toolbar.hide', function() {
            var elements = document.querySelectorAll('span.rangySelectionBoundary');
            _.each(elements, function(e) {
                e.parentNode.removeChild(e);
            });
        });

        return this;
    },

    exec: function(cmd, arg) {
        document.execCommand(cmd, false, arg);
    },

    focus: function() {
        if (this._currentEditor) {
            this._currentEditor.focus();
        }
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
        var selection = this.getSelection(),
            range = this.getRange(),
            node = selection.getEnclosingNode();

        if (node.nodeName.toLowerCase() === 'br') {
            // Edge case with chrome
            node = node.parentNode;
        }

        var boundary = node.getBoundingClientRect(),
            height = this.toolbar.element.offsetHeight,
            width = this.toolbar.element.offsetWidth;

        if (!selection.isCollapsed && rangy.util.isHostMethod(range.nativeRange, 'getBoundingClientRect')) {
            boundary = range.nativeRange.getBoundingClientRect();
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

    setRange: function(node, end) {
        if (typeof(node) === 'undefined') {
            return;
        }

        var range = rangy.createRange();
        range.selectNodeContents(node);

        if (end && end !== node) {
            if (end.lastChild) {
                range.setEndAfter(end.lastChild);
            } else {
                range.setEndAfter(end);
            }
        }
        this.getSelection().setSingleRange(range);
    },

    getEnclosingNode: function() {
        var selection = this.getSelection();
        if (selection.rangeCount !== 1) {
            return null;
        }
        var node = selection.getEnclosingNode();
        if (node === this._currentEditor) {
            return null;
        }
        return node;
    },

    getTopNodes: function(filter) {
        var selection = this.getSelection();
        if (selection.rangeCount !== 1) {
            return [];
        }
        return selection.getTopNodes(this._currentEditor, filter);
    },

    getSurroundingNodes: function(filter) {
        var selection = this.getSelection();
        if (selection.rangeCount !== 1) {
            return [];
        }

        return selection.getSurroundingNodes(filter);
    },

    filterTopNodeNames: function() {
        var names = _.map(arguments, function(v) {
            return v.toLowerCase();
        });
        return this.getTopNodes(function(n) {
            return names.indexOf(n.nodeName.toLowerCase()) !== -1;
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
    },

    // Cleanup operations
    cleanBlock: function(node) {
        // remove <br> at the end of block
        var e = node.childNodes[node.childNodes.length - 1];
        if (e.nodeType === 1 && e.nodeName.toLowerCase() === 'br') {
            node.removeChild(e);
        }
    }
});

exports.Editor = Editor;


var controls = {
    Menu: require('./controls').Menu,
    inline: require('./controls/inline'),
    block: require('./controls/block')
};

exports.simpleEditor = Class(Editor, {
    init: function() {
        Editor.prototype.init.apply(this, arguments);

        this.toolbar.addControl(controls.Menu, 'blocks', {
            label: '¶',
            title: 'Blocks',
            controls: [
                [controls.block.Paragraph, 'p'],
                [controls.block.H1, 'h1'],
                [controls.block.H2, 'h2'],
                [controls.block.H3, 'h3'],
                [controls.block.Preformated, 'pre']
            ]
        });
        this.toolbar.addControl(controls.Menu, 'lists', {
            label: 'Lists',
            title: 'Lists',
            fontAwesomeID: 'list-ul',
            controls: [
                [controls.block.UnorderedList, 'ul'],
                [controls.block.OrderedList, 'ol']
            ]
        });
        this.toolbar.addControl(controls.block.Blockquote, 'quote');
        this.toolbar.addControl(controls.inline.Bold, 'bold');
        this.toolbar.addControl(controls.inline.Italic, 'italic');
        this.toolbar.addControl(controls.inline.Underline, 'underline');
        this.toolbar.addControl(controls.inline.StrikeThrough, 'strike');
        this.toolbar.addControl(controls.inline.Link, 'link');
        this.toolbar.addControl(controls.inline.Image, 'image');
        this.toolbar.addControl(controls.inline.Oembed, 'oembed');
    }
});
