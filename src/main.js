(function() {
    'use strict';

    function extend(b, a) {
        var prop;
        if (b === undefined) {
            return a;
        }
        for (prop in a) {
            if (a.hasOwnProperty(prop) && b.hasOwnProperty(prop) === false) {
                b[prop] = a[prop];
            }
        }
        return b;
    }

    var Editor = function(elements, options) {
        if (!window.getSelection) {
            throw new Error('Browser features missing.');
        }
        return this.init(elements, options);
    };

    Editor.prototype = {
        defaults: {
            allowMultiParagraphSelection: true,
            anchorInputPlaceholder: 'Paste or type a link',
            buttons: ['bold', 'italic', 'underline', 'anchor', 'header1', 'header2', 'quote'],
            buttonLabels: false,
            delay: 200,
            diffLeft: 2,
            diffTop: -10,
            disableReturn: false,
            disableToolbar: false,
            firstHeader: 'h3',
            forcePlainText: true,
            placeholder: 'Type your text',
            secondHeader: 'h4',
            targetBlank: false,
            faEnabled: true
        },

        init: function(elements, options) {
            this.elements = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
            if (this.elements.length === 0) {
                return;
            }

            this.isActive = true;
            this.id = this.elements.length + 1;
            this.options = extend(options, this.defaults);

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
                .bindSelect();
        },

        iter: function(callback) {
            var i;
            for (i=0; i<this.elements.length; i++) {
                callback.call(this, this.elements[i]);
            }
        },

        initElements: function() {
            this._showEvt = document.createEvent('Event');
            this._showEvt.initEvent('toolbar.show', false, true);

            this._hideEvt = document.createEvent('Event');
            this._hideEvt.initEvent('toolbar.hide', false, true);

            this.iter(function(node) {
                node.setAttribute('contentEditable', true);
                node.setAttribute('data-editor-element', true);
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

            // this.iter(function(node) {
            //    node.addEventListener('mouseup', wrapper);
            //    node.addEventListener('keyup', wrapper);
            //    node.addEventListener('blur', wrapper);
            // });

            return this;
        },

        initToolbar: function() {
            var self =this,
                toolbar = document.createElement('div'),
                controls = document.createElement('ul'),
                dialog = document.createElement('div');

            toolbar.id = 'editor-toolbar-' + this.id;
            toolbar.classList.add('editor-toolbar');
            toolbar.appendChild(controls);

            dialog.classList.add('editor-dialog');
            dialog.style.display = 'none';
            toolbar.appendChild(dialog);

            document.body.appendChild(toolbar);

            this.toolbar = toolbar;
            this.controls = controls;
            this.dialog = dialog;
            this.addDefaultButtons();
            this._toolbarClicked = false;

            var focusEvent = function() {
                self._toolbarClicked = true;
            };
            this.toolbar.addEventListener('click', focusEvent);
            this.toolbar.addEventListener('focus', focusEvent);

            return this;
        },

        addDefaultButtons: function() {
            var i, button;
            for (i=0; i<Editor.defaultButtons.length; i++) {
                button = Editor.defaultButtons[i];
                this.addButton(button.id, button.options);
            }
        },

        addButton: function(label, options) {
            var btn = new Button(this, label, options);
            var li = document.createElement('li');
            li.appendChild(btn.element);
            this.controls.appendChild(li);
        },

        exec: function(cmd, arg) {
            document.execCommand(cmd, false, arg);
        },

        showToolbar: function() {
            this.hideDialog();
            if (!this.toolbar.classList.contains('editor-toolbar-active')) {
                this.toolbar.classList.add('editor-toolbar-active');
            }
            this.toolbar.dispatchEvent(this._showEvt);
            this.setToolbarPosition();
            window.addEventListener('resize', this._resizeHandler);
            return this;
        },

        hideToolbar: function() {
            window.removeEventListener('resize', this._resizeHandler);
            this.toolbar.classList.remove('editor-toolbar-active');
            this.toolbar.dispatchEvent(this._hideEvt);
            return this;
        },

        showDialog: function(callback) {
            callback = typeof(callback) === 'function' ? callback : function() {};

            this.emptyDialog();
            this.dialog.style.display = 'block';
            this.controls.style.display = 'none';

            var self = this;
            setTimeout(function() {
                self.setToolbarPosition();
                callback.call(self);
            }, 200);
        },

        hideDialog: function() {
            //this.emptyDialog();
            this.dialog.style.display = 'none';
            this.controls.style.display = 'block';
            this.setToolbarPosition();
        },

        emptyDialog: function() {
            while (this.dialog.firstChild) {
                this.dialog.removeChild(this.dialog.firstChild);
            }
        },

        setToolbarPosition: function() {
            var info = this.getRangeInfo(),
                container = info.container,
                surrounding = info.surrounding,
                boundary = container.getBoundingClientRect(),
                height = this.toolbar.offsetHeight,
                width = this.toolbar.offsetWidth;

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
            this.toolbar.style.top = top + 'px';

            // Left position
            var left = boundary.left;
            if (this._currentEditor.offsetWidth < width + boundary.left) {
                left = this._currentEditor.offsetWidth - width - this.options.diffLeft;
            }
            this.toolbar.style.left = left + 'px';
        },

        _onSelect: function(evt) {
            var elements = [].slice.call(this.elements);
            elements.push(this.toolbar);

            if (!this.rangy.dom.hasParents(evt.target, elements)) {
                this.hideToolbar();
                this._currentEditor = false;
                return;
            }

            this._currentEditor = this._getSelectionElement();
            if (!this.rangy.dom.hasParents(evt.target, [this.toolbar])) {
                this.showToolbar();
            }
        },

        // Selected nodes utils.
        getSelection: function() {
            return this.rangy.getSelection();
        },

        getRange: function(index) {
            index = typeof(index) === 'undefined' ? 0 : index;
            return this.getSelection().getRangeAt(0);
        },

        setRange: function(node) {
            var range = this.rangy.createRange();
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
                topSurrounding = this.rangy.dom.getTopContainer(surrounding);
            }
            if (container !== null) {
                topContainer = this.rangy.dom.getTopContainer(container);
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

            filter = filter || function(node) { return node; };

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

    Editor.defaultButtons = [];

    Editor.addDefaultButton = function(id, options) {
        Editor.defaultButtons.push({id: id, options: options});
    };

    function Button(editor, id, options) {
        this.init(editor, id, options);
    }

    Button.prototype = {
        defaults: {
            title: '',
            className: null,
            faId: null,
            init: function() {},
            click: function() {},
            isVisible: null,
            isHighlighted: null
        },

        init: function(editor, id, options) {
            var self = this;
            this.editor = editor;
            this.id = id;
            this.options = extend(options, this.defaults);

            this.label = this.options.label || this.id;

            // Button element
            var cls = this.options.className || this.label.toLowerCase().replace(/\s+/, '-');

            this.element = document.createElement('button');
            this.element.classList.add('editor-button-' + cls);
            if (this.options.title) {
                this.element.setAttribute('title', this.options.title);
            }

            var text = document.createTextNode(this.label);
            if (editor.options.faEnabled && this.options.faId) {
                var fa = document.createElement('i');
                var span = document.createElement('span');
                span.appendChild(text);
                fa.appendChild(span);
                fa.classList.add('fa', 'fa-' + this.options.faId);
                this.element.appendChild(fa);
            } else {
                this.element.appendChild(text);
            }

            this.options.init.call(this);
            this.element.addEventListener('click', function(evt) {
                self.options.click.call(self, evt);
            });

            if (typeof(this.options.isVisible) === 'function') {
                this.editor.toolbar.addEventListener('toolbar.show', function(evt) {
                    self.setVisibility(self.options.isVisible.call(self, evt));
                });
            }

            if (typeof(this.options.isHighlighted) === 'function') {
                this.editor.toolbar.addEventListener('toolbar.show', function(evt) {
                    self.setHighlight(self.options.isHighlighted.call(self, evt));
                });
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
        }
    };

    return Editor;
})();
