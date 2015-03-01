/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),
    rangy = require('../../vendor/rangy/core').api,

    Class = _util.Class,
    extend = _util.extend,
    _ = _util._,
    tr = _util.tr,
    Button = _controls.Button;


// Base block (paragraph)
var Block = Class(Button, {
    tagList: [],
    tag: null,
    command: 'formatblock',
    defaults: extend({}, Button.prototype.defaults),

    init: function() {
        Button.prototype.init.apply(this, arguments);
        this.BLOCK_NODES = _.filter(this.toolbar.editor.BLOCK_NODES, function(v) {
            return ['ul', 'ol'].indexOf(v.toLowerCase()) === -1;
        });
    },

    isHighlighted: function() {
        return this.toolbar.editor.filterTopNodeNames.apply(
            this.toolbar.editor, this.tagList
        ).length > 0;
    },

    click: function() {
        var editor = this.toolbar.editor,
            topNodes;

        if (this.command === 'formatblock') {
            // Expand selection before formating to avoid some issues with webkit
            if (!this.isHighlighted()) {
                topNodes = editor.filterTopNodeNames.apply(editor, this.BLOCK_NODES);
                if (topNodes.length > 0) {
                    editor.setRange(topNodes[0]);
                }
            }
            this.toolbar.editor.exec(this.command, '<' + this.tag + '>');
        } else {
            this.toolbar.editor.exec(this.command);
        }
        this.toolbar.editor.showToolbar();
    }
});
exports.Block = Block;


exports.Paragraph = Class(Block, {
    tagList: ['p'],
    tag: 'p',
    command: 'formatblock',
    defaults: extend({}, Block.prototype.defaults, {
        label: '¶',
        title: tr('Paragraph')
    })
});

// Titles (H1 -> H6)
for (var i=1; i<=6; i++) {
    var C = Class(Block, {
        tagList: ['h' + i],
        tag: 'h' + i,
        defaults: extend({}, Block.prototype.defaults, {
            label: 'H' + i,
            title: tr('Title level {level}', {level: i})
        })
    });
    exports['H' + i] = C;
}


// Preformated text
exports.Preformated = Class(Block, {
    tagList: ['pre'],
    tag: 'pre',
    defaults: extend({}, Block.prototype.defaults, {
        label: '<>',
        title: tr('Code'),
        fontAwesomeID: 'code',
        tabReplacement: '    '
    }),

    init: function() {
        Block.prototype.init.apply(this, arguments);
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                // Activate tab in preformated blocks
                if (editor.filterTopNodeNames('pre').length > 0) {
                    evt.preventDefault();
                    editor.exec('insertHtml', self.options.tabReplacement);
                }
            }
        });
    },
    click: function() {
        // Replace <br> nodes by new line after formating (another webkit BS)
        Block.prototype.click.call(this);
        var editor = this.toolbar.editor,
            node = editor.getEnclosingNode(),
            nodeList = [].slice.call(node.getElementsByTagName('br'));

        _.each(nodeList, function(n) {
            n.parentNode.insertBefore(document.createTextNode('\n'), n);
            n.parentNode.removeChild(n);
        });
    }
});


// Lists
var BaseList = Class(Block, {
    init: function() {
        Block.prototype.init.apply(this, arguments);
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey) {
                var topNodes = editor.filterTopNodeNames('ul', 'ol');
                if (topNodes.length === 0 || topNodes[0].nodeName.toLowerCase() !== self.tag) {
                    return;
                }

                evt.preventDefault();
                if (evt.shiftKey) {
                    editor.exec('outdent');
                } else {
                    editor.exec('indent');
                }
            }
        });
    },
    click: function() {
        var editor = this.toolbar.editor,
            topListNodes = editor.filterTopNodeNames('ul', 'ol');

        if (topListNodes.length > 0) {
            if (topListNodes[0].nodeName.toLowerCase() === this.tag) {
                return;
            }

            // Changing list type
            var node = topListNodes[0],
                selection = rangy.saveSelection(),
                e = document.createElement(this.tag);

            node.parentNode.insertBefore(e, node);
            _.each([].slice.call(node.childNodes), function(n) {
                e.appendChild(n);
            });
            node.parentNode.removeChild(node);
            rangy.restoreSelection(selection);
            rangy.removeMarkers(selection);
            editor.showToolbar();
        } else {
            // Insert a list
            Block.prototype.click.call(this);
        }
    }
});

exports.UnorderedList = Class(BaseList, {
    tagList: ['ul'],
    tag: 'ul',
    command: 'insertunorderedlist',
    defaults: extend({}, BaseList.prototype.defaults, {
        label: 'UL',
        title: tr('Unordered list'),
        fontAwesomeID: 'list-ul'
    })
});


exports.OrderedList = Class(BaseList, {
    tagList: ['ol'],
    tag: 'ol',
    command: 'insertorderedlist',
    defaults: extend({}, BaseList.prototype.defaults, {
        label: 'OL',
        title: tr('Ordered list'),
        fontAwesomeID: 'list-ol'
    })
});


// Blockquotes
exports.Blockquote = Class(Block, {
    tagList: ['blockquote'],
    defaults: extend({}, Block.prototype.defaults, {
        label: 'Quote',
        title: tr('Quote'),
        fontAwesomeID: 'quote-right'
    }),

    init: function() {
        Block.prototype.init.apply(this, arguments);
        var self = this,
            editor = this.toolbar.editor;

        // Leave blockquote after an empty paragraph
        editor.on('keyup', function(evt) {
            if (evt.which === 13 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                var node = editor.filterTopNodeNames('blockquote');
                if (node.length === 0 || !editor.getSelection().isCollapsed) {
                    return;
                }

                var parent = node[0];
                node = editor.filterTopNodeNames('p');
                if (node.length === 0) {
                    return;
                }

                node = node[0];
                if(node.previousSibling && node.previousSibling.textContent === '') {
                    node.previousSibling.parentNode.removeChild(node.previousSibling);
                    parent.parentNode.insertBefore(node, parent.nextSibling);
                    editor.setRange(node);
                    editor.getSelection().collapse(node);
                }
            }
        });

        // Indent / unindent blockquote
        editor.on('keydown', function(evt) {
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey) {
                var node = editor.filterTopNodeNames('blockquote');
                if (node.length === 0) {
                    return;
                }

                evt.preventDefault();
                if (evt.shiftKey) {
                    self.removeBlockquote();
                } else {
                    self.insertBlockquote();
                }
            }
        });
    },

    click: function() {
        var editor = this.toolbar.editor,
            selection = editor.getSelection();

        if (selection.isCollapsed && editor.getTopNodes().length === 0) {
            return;
        }

        if (editor.filterTopNodeNames('blockquote').length > 0) {
            // Remove blockquote
            this.removeBlockquote();
        } else {
            // Insert blockquote
            this.insertBlockquote();
        }
        editor.showToolbar();
    },

    insertBlockquote: function() {
        var editor = this.toolbar.editor,
            nodeList = editor.filterTopNodeNames.apply(editor, editor.BLOCK_NODES),
            node = nodeList.length > 0 ? nodeList[0] : null,
            surroundingBlocks = editor.getSurroundingNodes(function(n) {
                return editor.BLOCK_NODES.indexOf(n.nodeName.toUpperCase()) !== -1;
            });

        if (surroundingBlocks.length > 0) {
            nodeList = surroundingBlocks;
        } else if (node) {
            nodeList = [node];
        } else {
            nodeList = editor.getSurroundingNodes();
        }

        // Expand selection to top nodes
        editor.setRange(nodeList[0], nodeList[nodeList.length - 1]);
        nodeList = editor.getSurroundingNodes();

        // Push nodes to blockquote
        var e = document.createElement('blockquote');
        nodeList[0].parentNode.insertBefore(e, nodeList[0]);
        _.each(nodeList, e.appendChild, e);

        // Set new range
        editor.setRange(e);
    },

    removeBlockquote: function() {
        var nodeList = this.toolbar.editor.filterTopNodeNames('blockquote'),
            selection = rangy.saveSelection();

        rangy.dom.replaceNodeByContents(nodeList[0]);
        rangy.restoreSelection(selection);
        rangy.removeMarkers(selection);
    }
});
