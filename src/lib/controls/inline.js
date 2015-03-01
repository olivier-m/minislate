/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),
    rangy = require('../../vendor/rangy/core').api,

    Class = _util.Class,
    extend = _util.extend,
    _ = _util._,
    tr = _util.tr,
    Button = _controls.Button,
    Dialog = _controls.Dialog;


var Inline = Class(Button, {
    tagList: [],
    command: null,

    isHighlighted: function() {
        return this.toolbar.editor.filterTopNodeNames.apply(
            this.toolbar.editor, this.tagList
        ).length > 0;
    },
    isVisible: function() {
        return !this.toolbar.editor.getSelection().isCollapsed || this.isHighlighted();
    },

    click: function() {
        var editor = this.toolbar.editor;

        if (editor.getSelection().isCollapsed) {
            var node = editor.filterTopNodeNames.apply(editor, this.tagList);
            if (node.length === 0) {
                return;
            }
            node = node[0];
            editor.setRange(node);
        }

        editor.exec(this.command);
        editor.showToolbar();
    }
});
exports.Inline = Inline;


exports.Bold = Class(Inline, {
    defaults: extend({}, Inline.prototype.defaults, {
        label: 'B',
        title: tr('Bold'),
        fontAwesomeID: 'bold'
    }),
    tagList: ['b', 'strong'],
    command: 'bold',

    init: function() {
        Inline.prototype.init.apply(this, arguments);

        // Allow bold with Cmd+b or Ctrl+b
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            if (evt.which === 66 && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                self.click();
            }
        });
    }
});


exports.Italic = Class(Inline, {
    defaults: extend({}, Inline.prototype.defaults, {
        label: 'I',
        title: tr('Italic'),
        fontAwesomeID: 'italic'
    }),
    tagList: ['i', 'em'],
    command: 'italic',

    init: function() {
        Inline.prototype.init.apply(this, arguments);

        // Allow italic with Cmd+i or Ctrl+i
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            if (evt.which === 73 && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                self.click();
            }
        });
    }
});


exports.Underline = Class(Inline, {
    defaults: extend({}, Inline.prototype.defaults, {
        label: 'U',
        title: tr('Underline'),
        fontAwesomeID: 'underline'
    }),
    tagList: ['u', 'ins'],
    command: 'underline'
});


exports.StrikeThrough = Class(Inline, {
    defaults: extend({}, Inline.prototype.defaults, {
        label: 'S',
        title: tr('Strike-Through'),
        fontAwesomeID: 'strikethrough'
    }),
    tagList: ['strike', 'del'],
    command: 'strikeThrough'
});


var LinkDialog = Class(Dialog, {
    show: function(node) {
        var control = this.control,
            editor = this.toolbar.editor,
            selection = rangy.saveSelection();

        editor.showDialog(function() {
            input.focus();
        });

        var input = this.addTextField('URL: ', {
            escape: function() {
                editor.restoreSelection(selection);
            },
            enter: function(evt) {
                editor.restoreSelection(selection);
                control.saveLink(node, evt.target.value);
            }
        });

        this.addButton('Save', {
            fontAwesomeID: 'check',
            click: function(evt) {
                evt.stopImmediatePropagation();
                editor.restoreSelection(selection);
                control.saveLink(node, input.value);
            }
        });

        if (node) {
            input.value = node.getAttribute('href');
            this.addButton('Remove', {
                fontAwesomeID: 'chain-broken',
                click: function(evt) {
                    evt.stopImmediatePropagation();
                    editor.restoreSelection(selection);
                    control.saveLink(node, null);
                }
            });
        }
    }
});

exports.Link = Class(Button, {
    defaults: extend({}, Button.prototype.defaults, {
        label: '#',
        base_title: tr('Link'),
        title: '',
        fontAwesomeID: 'link'
    }),

    init: function() {
        Button.prototype.init.apply(this, arguments);
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Call link action with Cmd+Shift+k or Ctrl+Shift+k
            if (evt.which === 75 && evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                self.click();
            }
        });
    },

    isHighlighted: function() {
        var title = this.options.base_title;
        var nodes = this.toolbar.editor.filterTopNodeNames('a');
        if (nodes.length > 0) {
            title += ': ' + nodes[0].href;
        }
        this.element.setAttribute('title', title);
        return nodes.length > 0;
    },
    isVisible: function() {
        return !this.toolbar.editor.getSelection().isCollapsed || this.isHighlighted();
    },

    click: function() {
        var editor = this.toolbar.editor,
            collapsed = editor.getSelection().isCollapsed;

        var node = editor.filterTopNodeNames('a');
        if (collapsed && node.length === 0) {
            return;
        }

        node = node.length === 0 ? null : node[0];
        if (collapsed) {
            editor.setRange(node);
        }

        (new LinkDialog(this)).show(node);
    },

    saveLink: function(node, url) {
        var editor = this.toolbar.editor,
            range = editor.getRange();

        if (node) {
            if (!url) { //  Remove link
                var selection = rangy.saveSelection();
                rangy.dom.replaceNodeByContents(node, true);
                rangy.restoreSelection(selection);
                rangy.removeMarkers(selection);
            } else {  // Update link
                node.setAttribute('href', url);
                editor.setRange(node);
            }
        } else if (url) { //  New link
            node = document.createElement('a');
            node.setAttribute('href', url);
            var contents = range.cloneContents();
            _.each(contents.childNodes, function(n) {
                node.appendChild(n.cloneNode(true));
            });

            range.deleteContents();
            range.insertNode(node);
            editor.setRange(node);
        }
        editor.showToolbar();
        return node;
    }
});
