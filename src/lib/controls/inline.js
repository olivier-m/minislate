/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),
    rangy = require('../../vendor/rangy/core').api,

    Class = _util.Class,
    extend = _util.extend,
    Button = _controls.Button,
    Dialog = _controls.Dialog;


var Inline = Class(Button, {
    tagList: [],
    command: null,

    isHighlighted: function() {
        return this.toolbar.editor.filterSelectionNodeName.apply(
            this.toolbar.editor, this.tagList
        ).length > 0;
    },
    isVisible: function() {
        return !this.toolbar.editor.getRange().collapsed || this.isHighlighted();
    },

    click: function() {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        if (info.range.collapsed) {
            var node = editor.filterSelectionNodeName.apply(editor, this.tagList);
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
        title: 'Bold',
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
        title: 'Italic',
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
        title: 'Underline',
        fontAwesomeID: 'underline'
    }),
    tagList: ['u', 'ins'],
    command: 'underline'
});


exports.StrikeThrough = Class(Inline, {
    defaults: extend({}, Inline.prototype.defaults, {
        label: 'S',
        title: 'Strike-Through',
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
        base_title: 'Link',
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
        var nodes = this.toolbar.editor.filterSelectionNodeName('a');
        if (nodes.length > 0) {
            title += ': ' + nodes[0].href;
        }
        this.element.setAttribute('title', title);
        return nodes.length > 0;
    },
    isVisible: function() {
        return !this.toolbar.editor.getRange().collapsed || this.isHighlighted();
    },

    click: function() {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        var node = editor.filterSelectionNodeName('a');
        if (info.range.collapsed && node.length === 0) {
            return;
        }

        node = node.length === 0 ? null : node[0];
        if (info.range.collapsed) {
            editor.setRange(node);
        }

        (new LinkDialog(this)).show(node);
    },

    saveLink: function(node, url) {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        if (node) {
            if (!url) { //  Remove link
                var selection = rangy.saveSelection();
                info.range.replaceNodeByContents(node, true);
                rangy.restoreSelection(selection);
                rangy.removeMarkers(selection);
            } else {  // Update link
                node.setAttribute('href', url);
                editor.setRange(node);
            }
        } else if (url) { //  New link
            node = document.createElement('a');
            node.setAttribute('href', url);
            var contents = info.range.cloneContents();
            for (var i=0; i<contents.childNodes.length; i++) {
                node.appendChild(contents.childNodes[i].cloneNode(true));
            }
            info.range.deleteContents();
            info.range.insertNode(node);
            editor.setRange(node);
        }
        editor.showToolbar();
        return node;
    }
});


var ImageDialog = Class(Dialog, {
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
                control.saveImage(node, evt.target.value);
            }
        });

        this.addButton('Save', {
            fontAwesomeID: 'check',
            click: function(evt) {
                evt.stopImmediatePropagation();
                editor.restoreSelection(selection);
                control.saveImage(node, input.value);
            }
        });

        if (node) {
            input.value = node.getAttribute('src');
        }
    }
});

exports.Image = Class(Button, {
    defaults: extend({}, Button.prototype.defaults, {
        label: 'IMG',
        title: 'Image',
        fontAwesomeID: 'picture-o'
    }),

    init: function() {
        Button.prototype.init.apply(this, arguments);

        // Select image when clicked
        var editor = this.toolbar.editor;
        editor.on('click', function(evt) {
            if (evt.target.tagName.toLowerCase() === 'img') {
                editor.setRange(evt.target);
                editor.showToolbar();
            }
        });
    },

    isHighlighted: function() {
        return this.toolbar.editor.filterSelectionNodeName('img').length > 0;
    },

    click: function() {
        var editor = this.toolbar.editor,
            node = editor.filterSelectionNodeName('img');

        node = node.length === 0 ? null : node[0];
        (new ImageDialog(this)).show(node);
    },

    saveImage: function(node, url) {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        if (node && url) {
            node.setAttribute('src', url);
            editor.setRange(node);
        } else if (url) {
            node = document.createElement('img');
            node.setAttribute('src', url);
            info.range.deleteContents();
            info.range.insertNode(node);
            editor.cleanBlock(node.parentNode);
            editor.setRange(node);
        }
        editor.showToolbar();
        return node;
    }
});


exports.Oembed = Class(Button, {
    defaults: extend({}, Button.prototype.defaults, {
        label: 'Embeded',
        title: 'Embeded content',
        fontAwesomeID: 'youtube-play'
    }),

    click: function() {
        window.alert('No implemented yet :)');
    }
});
