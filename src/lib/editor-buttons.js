/* global Editor:true */

Editor.getInlineButtonSpec = function(command, tagList, options) {
    options.isHighlighted = function() {
        return this.toolbar.editor.filterSelectionNodeName.apply(this.toolbar.editor, tagList).length > 0;
    };

    options.isVisible = function() {
        return !this.toolbar.editor.getRange().collapsed || this.options.isHighlighted.call(this);
    };

    options.click = function() {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        if (info.range.collapsed) {
            var node = editor.filterSelectionNodeName.apply(editor, tagList);
            if (node.length === 0) {
                return;
            }
            node = node[0];
            editor.setRange(node);
        }

        editor.exec(command);
        editor.showToolbar();
    };

    return options;
};


Editor.getBlockButtonSpec = function(tag, tagList, options) {
    options.isHighlighted = function() {
        var res = this.toolbar.editor.filterSelectionNodeName.apply(this.toolbar.editor, tagList).length > 0;
        if (res && this.menu) {
            this.menu.setHighlight(true);
            this.menu.setLabel(this.label, this.options.fontAwesomeID);
        }
        return res;
    };

    options.isVisible = function() {
        return true;
    };

    var command = 'formatblock';
    if (typeof(options.command) !== 'undefined') {
        command = options.command;
        delete(options.command);
    }

    options.click = function() {
        this.toolbar.editor.exec(command, '<' + tag + '>');
        this.toolbar.editor.showToolbar();
    };
    return options;
};


Editor.addDefaultMenu('blocks', {
    label: '¶',
    title: 'Blocks',
    isHighlighted: function() { return false; }
});

// Paragraph
Editor.addDefaultButton('p', Editor.getBlockButtonSpec('p', ['p'], {
    label: '¶',
    title: 'Paragraph',
    className: 'p',
    menu: 'blocks'
}));


// Titles
var levels = [1,2,3,4];
for (var i=0; i<levels.length; i++) {
    Editor.addDefaultButton('h' + levels[i], Editor.getBlockButtonSpec('h' + levels[i], ['h' + levels[i]], {
        label: 'H' + levels[i],
        title: 'Title level ' + levels[i],
        className: 'h' + levels[i],
        menu: 'blocks'
    }));
}

// Preformated text
Editor.addDefaultButton('pre', Editor.getBlockButtonSpec('pre', ['pre'], {
    label: '<>',
    title: 'Code',
    fontAwesomeID: 'code',
    menu: 'blocks',
    init: function() {
        var editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Activate tab in preformated, lists and blockquotes
            if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                var filter = editor.filterSelectionNodeName('pre');
                if (filter.length > 0) {
                    evt.preventDefault();
                    editor.exec('insertHtml', '    ');
                }
            }
        });
    }
}));

Editor.addDefaultMenu('lists', {
    label: 'Lists',
    title: 'Lists',
    fontAwesomeID: 'list-ul',
    isHighlighted: function() { return false; }
});

// Unordered list
Editor.addDefaultButton('ul', Editor.getBlockButtonSpec('ul', ['ul'], {
    label: 'UL',
    title: 'Unordered list',
    fontAwesomeID: 'list-ul',
    command: 'insertunorderedlist',
    menu: 'lists'
}));


// Ordered list
Editor.addDefaultButton('ol', Editor.getBlockButtonSpec('ol', ['ol'], {
    label: 'OL',
    title: 'Ordered list',
    fontAwesomeID: 'list-ol',
    command: 'insertorderedlist',
    menu: 'lists'
}));


// Bold
Editor.addDefaultButton('bold', Editor.getInlineButtonSpec('bold', ['b', 'strong'], {
    label: 'B',
    title: 'Bold',
    fontAwesomeID: 'bold',
    init: function() {
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Allow bold with Cmd+b or Ctrl+b
            if (evt.which === 66 && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                self.options.click.call(self);
            }
        });
    }
}));


// Italic
Editor.addDefaultButton('italic', Editor.getInlineButtonSpec('italic', ['i', 'em'], {
    label: 'I',
    title: 'Italic',
    fontAwesomeID: 'italic',
    init: function() {
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Allow bold with Cmd+i or Ctrl+i
            if (evt.which === 73 && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                self.options.click.call(self);
            }
        });
    }
}));


// Underline
Editor.addDefaultButton('underline', Editor.getInlineButtonSpec('underline', ['u', 'ins'], {
    label: 'U',
    title: 'Underline',
    fontAwesomeID: 'underline'
}));


// Strike
Editor.addDefaultButton('strike', Editor.getInlineButtonSpec('strikeThrough', ['strike', 'del'], {
    label: 'S',
    title: 'Strike',
    fontAwesomeID: 'strikethrough'
}));

// Link
Editor.addDefaultButton('link', {
    label: '#',
    base_title: 'Link',
    title: '',
    fontAwesomeID: 'link',

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
        return !this.toolbar.editor.getRange().collapsed || this.options.isHighlighted.call(this);
    },

    init: function() {
        var self = this,
            editor = this.toolbar.editor;

        editor.on('keydown', function(evt) {
            // Allow bold with Cmd+Shift+k or Ctrl+Shift+k
            if (evt.which === 75 && evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                self.options.click.call(self);
            }
        });
    },

    click: function() {
        var self = this,
            editor = this.toolbar.editor,
            info = editor.getRangeInfo(),
            dialog = this.toolbar.newDialog();

        var node = editor.filterSelectionNodeName('a');
        if (info.range.collapsed && node.length === 0) {
            return;
        }

        node = node.length === 0 ? null : node[0];
        if (info.range.collapsed) {
            editor.setRange(node);
        }

        var selection = editor.rangy.saveSelection();

        editor.showDialog(function() {
            input.focus();
        });

        var input = dialog.addTextField('URL: ', {
            escape: function() {
                editor.restoreSelection(selection);
            },
            enter: function(evt) {
                editor.restoreSelection(selection);
                self.options.saveLink.call(self, node, evt.target.value);
            }
        });

        dialog.addButton('Save', {
            fontAwesomeID: 'check',
            click: function(evt) {
                evt.stopImmediatePropagation();
                editor.restoreSelection(selection);
                self.options.saveLink.call(self, node, input.value);
            }
        });

        if (node) {
            input.value = node.getAttribute('href');
            dialog.addButton('Remove', {
                fontAwesomeID: 'chain-broken',
                click: function(evt) {
                    evt.stopImmediatePropagation();
                    editor.restoreSelection(selection);
                    self.options.saveLink.call(self, node, null);
                }
            });
        }
    },

    saveLink: function(node, url) {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        if (node) {
            if (!url) { //  Remove link
                var selection = editor.rangy.saveSelection();
                info.range.replaceNodeByContents(node, true);
                editor.rangy.restoreSelection(selection);
                editor.rangy.removeMarkers(selection);
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
    }
});

// Image
Editor.addDefaultButton('image', {
    label: 'IMG',
    title: 'Image',
    className: 'image',
    fontAwesomeID: 'picture-o',

    init: function() {
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
        var self = this,
            editor = this.toolbar.editor,
            dialog = this.toolbar.newDialog();

        var node = editor.filterSelectionNodeName('img');

        node = node.length === 0 ? null : node[0];

        var selection = editor.rangy.saveSelection();

        editor.showDialog(function() {
            input.focus();
        });

        var input = dialog.addTextField('URL: ', {
            escape: function() {
                editor.restoreSelection(selection);
            },
            enter: function(evt) {
                editor.restoreSelection(selection);
                self.options.saveImage.call(self, node, evt.target.value);
            }
        });

        dialog.addButton('Save', {
            fontAwesomeID: 'check',
            click: function(evt) {
                evt.stopImmediatePropagation();
                editor.restoreSelection(selection);
                self.options.saveImage.call(self, node, input.value);
            }
        });

        if (node) {
            input.value = node.getAttribute('src');
        }
    },

    saveImage: function(node, url) {
        var editor = this.toolbar.editor,
            info = editor.getRangeInfo();

        if (node && url) {
            node.setAttribute('src', url);
            editor.setRange(node);
        } else if (url) {
            var img = document.createElement('img');
            img.setAttribute('src', url);
            info.range.deleteContents();
            info.range.insertNode(img);
            editor.setRange(img);
        }
        editor.showToolbar();
    }
});


// Oembed
Editor.addDefaultButton('embed', {
    label: 'Embeded',
    title: 'Embeded content',
    className: 'oembed',
    fontAwesomeID: 'youtube-play',

    click: function() {
        window.alert('No implemented yet :)');
    }
});
