/* jshint newcap:false */
/* global exports, require */

var _util = require('../util'),
    _controls = require('../controls'),

    Class = _util.Class,
    extend = _util.extend,
    Button = _controls.Button;


// Base block (paragraph)
var Block = Class(Button, {
    tagList: [],
    tag: null,
    command: 'formatblock',
    defaults: extend({}, Button.prototype.defaults),

    isHighlighted: function() {
        return this.toolbar.editor.filterTopNodeNames.apply(
            this.toolbar.editor, this.tagList
        ).length > 0;
    },

    click: function() {
        if (this.command === 'formatblock') {
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
        title: 'Paragraph'
    })
});

// Titles (H1 -> H6)
for (var i=1; i<=6; i++) {
    var C = Class(Block, {
        tagList: ['h' + i],
        tag: 'h' + i,
        defaults: extend({}, Block.prototype.defaults, {
            label: 'H' + i,
            title: 'Title level ' + i
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
        title: 'Code',
        fontAwesomeID: 'code'
    }),

    init: function() {
        Block.prototype.init.apply(this, arguments);
        var editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Activate tab in preformated blocks
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                if (editor.filterTopNodeNames('pre').length > 0) {
                    evt.preventDefault();
                    editor.exec('insertHtml', '    ');
                }
            }
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
                var node = editor.filterTopNodeNames('li');
                if (node.length === 0) {
                    return;
                }
                node = node[0];
                if (node.parentNode.nodeName.toLowerCase() === self.tag) {
                    evt.preventDefault();
                    // TODO: this produces deprecated HTML code for nested lists. Should be fixed.
                    editor.exec(evt.shiftKey ? 'outdent' : 'indent');
                }
            }
        });
    }
});

exports.UnorderedList = Class(BaseList, {
    tagList: ['ul'],
    tag: 'ul',
    command: 'insertunorderedlist',
    defaults: extend({}, BaseList.prototype.defaults, {
        label: 'UL',
        title: 'Unordered list',
        fontAwesomeID: 'list-ul'
    })
});


exports.OrderedList = Class(BaseList, {
    tagList: ['ol'],
    tag: 'ol',
    command: 'insertorderedlist',
    defaults: extend({}, BaseList.prototype.defaults, {
        label: 'OL',
        title: 'Ordered list',
        fontAwesomeID: 'list-ol'
    })
});
