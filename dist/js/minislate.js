/*!
 * Minislate
 * Version: 0.3.0
 *
 * Includes Rangy
 * https://code.google.com/p/rangy/
 *
 * Copyright 2014, Olivier Meunier and contributors
 * Released under the MIT license
 *
 * Date: 2014-11-28T10:22:56Z
 */
!function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else {
        var f;
        "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), 
        f.Minislate = e();
    }
}(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    throw new Error("Cannot find module '" + o + "'");
                }
                var f = n[o] = {
                    exports: {}
                };
                t[o][0].call(f.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, f, f.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }({
        1: [ function(_dereq_, module, exports) {
            var _util = _dereq_("./util"), Class = _util.Class, extend = _util.extend;
            var ControlsMixin = Class(Object, {
                init: function() {
                    this.controls = {};
                },
                addControl: function(klass, id, options) {
                    throw new Error("Not implemented");
                },
                removeControl: function(id) {
                    if (!this.controls[id]) {
                        return;
                    }
                    delete this.controls[id];
                }
            });
            var BaseControl = Class(Object, {
                defaults: {
                    label: null,
                    title: "",
                    classes: "",
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
                    this.element.setAttribute("title", this.options.title);
                    if (this.options.classes) {
                        this.classes.push.apply(this.classes, this.options.classes.split(/\s+/));
                    }
                    for (var i = 0; i < this.classes.length; i++) {
                        this.element.classList.add(this.toolbar._getClassName(this.classes[i]));
                    }
                    var self = this;
                    this.toolbar.element.addEventListener("toolbar.show", function() {
                        self.setVisibility();
                        self.setHighlight();
                    });
                },
                _initElement: function() {
                    throw new Error("_initElement not implemented");
                },
                drawElement: function(e) {
                    e = e || document.createElement("li");
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
                    if (this.toolbar.options.fontAwesomeEnabled && fontAwesomeID) {
                        var fa = this.getFaElement(fontAwesomeID);
                        var span = document.createElement("span");
                        span.appendChild(text);
                        fa.appendChild(span);
                        this.element.appendChild(fa);
                    } else {
                        this.element.appendChild(text);
                    }
                },
                isHighlighted: function() {
                    return false;
                },
                isVisible: function() {
                    return true;
                },
                setVisibility: function(state) {
                    state = typeof state !== "undefined" ? state : this.isVisible();
                    if (state) {
                        this.element.parentNode.style.display = "block";
                    } else {
                        this.element.parentNode.style.display = "none";
                    }
                },
                setHighlight: function(state) {
                    state = typeof state !== "undefined" ? state : this.isHighlighted();
                    var cls = this.toolbar._getClassName("highlight");
                    if (state) {
                        if (!this.element.classList.contains(cls)) {
                            this.element.classList.add(cls);
                        }
                    } else {
                        this.element.classList.remove(cls);
                    }
                },
                getFaElement: function(id) {
                    var el = document.createElement("i");
                    el.classList.add("fa", "fa-" + id);
                    return el;
                }
            });
            var Button = Class(BaseControl, {
                classes: [ "button" ],
                init: function(toolbar, id, options) {
                    BaseControl.prototype.init.call(this, toolbar, id, options);
                    var self = this;
                    this.element.addEventListener("click", function(evt) {
                        self.click(evt);
                    });
                },
                _getParentElement: function() {
                    var e = BaseControl.prototype._getParentElement.call(this);
                    e.classList.add(this.toolbar._getClassName("button"));
                    return e;
                },
                _initElement: function() {
                    return document.createElement("button");
                },
                drawElement: function() {
                    var e = document.createElement("li");
                    e.classList.add(this.toolbar._getClassName("button"));
                    return BaseControl.prototype.drawElement.call(this, e);
                },
                click: function() {}
            });
            var Menu = Class(BaseControl, {
                defaults: extend({}, BaseControl.prototype.defaults, {
                    controls: []
                }),
                classes: [ "button" ],
                closeDelay: 400,
                init: function(toolbar, id, options) {
                    ControlsMixin.prototype.init.call(this);
                    BaseControl.prototype.init.call(this, toolbar, id, options);
                    var _klass, _id, _options;
                    for (var i = 0; i < this.options.controls.length; i++) {
                        _klass = this.options.controls[i][0];
                        _id = this.options.controls[i][1];
                        _options = this.options.controls[i][2];
                        this.addControl(_klass, _id, _options);
                    }
                    this.container = document.createElement("ul");
                    this.container.classList.add(this.toolbar._getClassName("controls"));
                    this.container.style.display = "none";
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
                    this.toolbar.element.addEventListener("toolbar.show", function() {
                        self._close();
                        self.element.removeEventListener("mouseover", openHandler);
                        self.element.removeEventListener("mouseout", closeHandler);
                        self.container.removeEventListener("mouseover", cancelHandler);
                        self.container.removeEventListener("mouseout", closeHandler);
                        setTimeout(function() {
                            self.element.addEventListener("mouseover", openHandler);
                            self.element.addEventListener("mouseout", closeHandler);
                            self.container.addEventListener("mouseover", cancelHandler);
                            self.container.addEventListener("mouseout", closeHandler);
                        }, 200);
                    });
                },
                _open: function() {
                    var control, i;
                    for (i in this.toolbar.controls) {
                        control = this.toolbar.controls[i];
                        if (control instanceof Menu) {
                            control._canceltimer();
                            control._close();
                        }
                    }
                    this._canceltimer();
                    this.container.style.display = "block";
                },
                _close: function() {
                    this.container.style.display = "none";
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
                    return document.createElement("button");
                },
                isHighlighted: function() {
                    var control, id;
                    for (id in this.controls) {
                        control = this.controls[id];
                        if (control.id, control.isHighlighted()) {
                            this.setLabel(control.label, control.options.fontAwesomeID);
                            return true;
                        }
                    }
                    return false;
                },
                drawElement: function() {
                    var e = document.createElement("li");
                    e.classList.add(this.toolbar._getClassName("menu"));
                    e = BaseControl.prototype.drawElement.call(this, e);
                    e.appendChild(this.container);
                    this.drawControls();
                    return e;
                },
                setLabel: function(label, fontAwesomeID) {
                    BaseControl.prototype.setLabel.call(this, label, fontAwesomeID);
                    this.element.appendChild(document.createTextNode(" "));
                    var e;
                    if (this.toolbar.options.fontAwesomeEnabled) {
                        e = this.getFaElement("chevron-down");
                    } else {
                        e = document.createElement("span");
                        e.classList.add(this.toolbar._getClassName("menu-arrow"));
                        e.appendChild(document.createTextNode("↓"));
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
                            var el = document.createElement("em");
                            var text = document.createTextNode(" - " + control.options.title);
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
                    var input = document.createElement("input");
                    var _label = document.createElement("label");
                    _label.appendChild(document.createTextNode(label));
                    input.setAttribute("size", options.size);
                    input.setAttribute("type", "text");
                    _label.appendChild(input);
                    this.element.appendChild(_label);
                    if (options.enter || options.escape) {
                        input.addEventListener("keyup", function(evt) {
                            if (options.escape && evt.which === 27) {
                                options.escape.call(input, evt);
                            } else if (options.enter && evt.which === 13) {
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
                    var button = document.createElement("button");
                    button.appendChild(document.createTextNode(label));
                    this.element.appendChild(document.createTextNode(" "));
                    this.element.appendChild(button);
                    this.element.appendChild(document.createTextNode(" "));
                    if (options.click && typeof options.click === "function") {
                        button.addEventListener("click", options.click);
                    }
                    if (options.fontAwesomeID && this.toolbar.options.fontAwesomeEnabled) {
                        button.removeChild(button.firstChild);
                        button.setAttribute("title", label);
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
        }, {
            "./util": 9
        } ],
        2: [ function(_dereq_, module, exports) {
            var _util = _dereq_("../util"), _controls = _dereq_("../controls"), rangy = _dereq_("../../vendor/rangy/core").api, Class = _util.Class, extend = _util.extend, _ = _util._, Button = _controls.Button;
            var Block = Class(Button, {
                tagList: [],
                tag: null,
                command: "formatblock",
                defaults: extend({}, Button.prototype.defaults),
                init: function() {
                    Button.prototype.init.apply(this, arguments);
                    this.BLOCK_NODES = _.filter(this.toolbar.editor.BLOCK_NODES, function(v) {
                        return [ "ul", "ol" ].indexOf(v.toLowerCase()) === -1;
                    });
                },
                isHighlighted: function() {
                    return this.toolbar.editor.filterTopNodeNames.apply(this.toolbar.editor, this.tagList).length > 0;
                },
                click: function() {
                    var editor = this.toolbar.editor, topNodes;
                    if (this.command === "formatblock") {
                        if (!this.isHighlighted()) {
                            topNodes = editor.filterTopNodeNames.apply(editor, this.BLOCK_NODES);
                            if (topNodes.length > 0) {
                                editor.setRange(topNodes[0]);
                            }
                        }
                        this.toolbar.editor.exec(this.command, "<" + this.tag + ">");
                    } else {
                        this.toolbar.editor.exec(this.command);
                    }
                    this.toolbar.editor.showToolbar();
                }
            });
            exports.Block = Block;
            exports.Paragraph = Class(Block, {
                tagList: [ "p" ],
                tag: "p",
                command: "formatblock",
                defaults: extend({}, Block.prototype.defaults, {
                    label: "¶",
                    title: "Paragraph"
                })
            });
            for (var i = 1; i <= 6; i++) {
                var C = Class(Block, {
                    tagList: [ "h" + i ],
                    tag: "h" + i,
                    defaults: extend({}, Block.prototype.defaults, {
                        label: "H" + i,
                        title: "Title level " + i
                    })
                });
                exports["H" + i] = C;
            }
            exports.Preformated = Class(Block, {
                tagList: [ "pre" ],
                tag: "pre",
                defaults: extend({}, Block.prototype.defaults, {
                    label: "<>",
                    title: "Code",
                    fontAwesomeID: "code",
                    tabReplacement: "    "
                }),
                init: function() {
                    Block.prototype.init.apply(this, arguments);
                    var self = this, editor = this.toolbar.editor;
                    editor.on("keydown", function(evt) {
                        if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                            if (editor.filterTopNodeNames("pre").length > 0) {
                                evt.preventDefault();
                                editor.exec("insertHtml", self.options.tabReplacement);
                            }
                        }
                    });
                },
                click: function() {
                    Block.prototype.click.call(this);
                    var editor = this.toolbar.editor, node = editor.getEnclosingNode(), nodeList = [].slice.call(node.getElementsByTagName("br"));
                    _.each(nodeList, function(n) {
                        n.parentNode.insertBefore(document.createTextNode("\n"), n);
                        n.parentNode.removeChild(n);
                    });
                }
            });
            var BaseList = Class(Block, {
                init: function() {
                    Block.prototype.init.apply(this, arguments);
                    var self = this, editor = this.toolbar.editor;
                    editor.on("keydown", function(evt) {
                        if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey) {
                            var topNodes = editor.filterTopNodeNames("ul", "ol");
                            if (topNodes.length === 0 || topNodes[0].nodeName.toLowerCase() !== self.tag) {
                                return;
                            }
                            evt.preventDefault();
                            if (evt.shiftKey) {
                                editor.exec("outdent");
                            } else {
                                editor.exec("indent");
                            }
                        }
                    });
                },
                click: function() {
                    var editor = this.toolbar.editor, topListNodes = editor.filterTopNodeNames("ul", "ol");
                    if (topListNodes.length > 0) {
                        if (topListNodes[0].nodeName.toLowerCase() === this.tag) {
                            return;
                        }
                        var node = topListNodes[0], selection = rangy.saveSelection(), e = document.createElement(this.tag);
                        node.parentNode.insertBefore(e, node);
                        _.each([].slice.call(node.childNodes), function(n) {
                            e.appendChild(n);
                        });
                        node.parentNode.removeChild(node);
                        rangy.restoreSelection(selection);
                        rangy.removeMarkers(selection);
                        editor.showToolbar();
                    } else {
                        Block.prototype.click.call(this);
                    }
                }
            });
            exports.UnorderedList = Class(BaseList, {
                tagList: [ "ul" ],
                tag: "ul",
                command: "insertunorderedlist",
                defaults: extend({}, BaseList.prototype.defaults, {
                    label: "UL",
                    title: "Unordered list",
                    fontAwesomeID: "list-ul"
                })
            });
            exports.OrderedList = Class(BaseList, {
                tagList: [ "ol" ],
                tag: "ol",
                command: "insertorderedlist",
                defaults: extend({}, BaseList.prototype.defaults, {
                    label: "OL",
                    title: "Ordered list",
                    fontAwesomeID: "list-ol"
                })
            });
            exports.Blockquote = Class(Block, {
                tagList: [ "blockquote" ],
                defaults: extend({}, Block.prototype.defaults, {
                    label: "Quote",
                    title: "Quote",
                    fontAwesomeID: "quote-right"
                }),
                init: function() {
                    Block.prototype.init.apply(this, arguments);
                    var self = this, editor = this.toolbar.editor;
                    editor.on("keyup", function(evt) {
                        if (evt.which === 13 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                            var node = editor.filterTopNodeNames("blockquote");
                            if (node.length === 0 || !editor.getSelection().isCollapsed) {
                                return;
                            }
                            var parent = node[0];
                            node = editor.filterTopNodeNames("p");
                            if (node.length === 0) {
                                return;
                            }
                            node = node[0];
                            if (node.previousSibling && node.previousSibling.textContent === "") {
                                node.previousSibling.parentNode.removeChild(node.previousSibling);
                                parent.parentNode.insertBefore(node, parent.nextSibling);
                                editor.setRange(node);
                                editor.getSelection().collapse(node);
                            }
                        }
                    });
                    editor.on("keydown", function(evt) {
                        if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey) {
                            var node = editor.filterTopNodeNames("blockquote");
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
                    var editor = this.toolbar.editor, selection = editor.getSelection();
                    if (selection.isCollapsed && editor.getTopNodes().length === 0) {
                        return;
                    }
                    if (editor.filterTopNodeNames("blockquote").length > 0) {
                        this.removeBlockquote();
                    } else {
                        this.insertBlockquote();
                    }
                    editor.showToolbar();
                },
                insertBlockquote: function() {
                    var editor = this.toolbar.editor, nodeList = editor.filterTopNodeNames.apply(editor, editor.BLOCK_NODES), node = nodeList.length > 0 ? nodeList[0] : null, surroundingBlocks = editor.getSurroundingNodes(function(n) {
                        return editor.BLOCK_NODES.indexOf(n.nodeName.toUpperCase()) !== -1;
                    });
                    if (surroundingBlocks.length > 0) {
                        nodeList = surroundingBlocks;
                    } else if (node) {
                        nodeList = [ node ];
                    } else {
                        nodeList = editor.getSurroundingNodes();
                    }
                    editor.setRange(nodeList[0], nodeList[nodeList.length - 1]);
                    nodeList = editor.getSurroundingNodes();
                    var e = document.createElement("blockquote");
                    nodeList[0].parentNode.insertBefore(e, nodeList[0]);
                    _.each(nodeList, e.appendChild, e);
                    editor.setRange(e);
                },
                removeBlockquote: function() {
                    var nodeList = this.toolbar.editor.filterTopNodeNames("blockquote"), selection = rangy.saveSelection();
                    rangy.dom.replaceNodeByContents(nodeList[0]);
                    rangy.restoreSelection(selection);
                    rangy.removeMarkers(selection);
                }
            });
        }, {
            "../../vendor/rangy/core": 11,
            "../controls": 1,
            "../util": 9
        } ],
        3: [ function(_dereq_, module, exports) {
            var _util = _dereq_("../util"), _controls = _dereq_("../controls"), rangy = _dereq_("../../vendor/rangy/core").api, Class = _util.Class, extend = _util.extend, _ = _util._, Button = _controls.Button, Dialog = _controls.Dialog;
            var Inline = Class(Button, {
                tagList: [],
                command: null,
                isHighlighted: function() {
                    return this.toolbar.editor.filterTopNodeNames.apply(this.toolbar.editor, this.tagList).length > 0;
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
                    label: "B",
                    title: "Bold",
                    fontAwesomeID: "bold"
                }),
                tagList: [ "b", "strong" ],
                command: "bold",
                init: function() {
                    Inline.prototype.init.apply(this, arguments);
                    var self = this, editor = this.toolbar.editor;
                    editor.on("keydown", function(evt) {
                        if (evt.which === 66 && (evt.ctrlKey || evt.metaKey)) {
                            evt.preventDefault();
                            self.click();
                        }
                    });
                }
            });
            exports.Italic = Class(Inline, {
                defaults: extend({}, Inline.prototype.defaults, {
                    label: "I",
                    title: "Italic",
                    fontAwesomeID: "italic"
                }),
                tagList: [ "i", "em" ],
                command: "italic",
                init: function() {
                    Inline.prototype.init.apply(this, arguments);
                    var self = this, editor = this.toolbar.editor;
                    editor.on("keydown", function(evt) {
                        if (evt.which === 73 && (evt.ctrlKey || evt.metaKey)) {
                            evt.preventDefault();
                            self.click();
                        }
                    });
                }
            });
            exports.Underline = Class(Inline, {
                defaults: extend({}, Inline.prototype.defaults, {
                    label: "U",
                    title: "Underline",
                    fontAwesomeID: "underline"
                }),
                tagList: [ "u", "ins" ],
                command: "underline"
            });
            exports.StrikeThrough = Class(Inline, {
                defaults: extend({}, Inline.prototype.defaults, {
                    label: "S",
                    title: "Strike-Through",
                    fontAwesomeID: "strikethrough"
                }),
                tagList: [ "strike", "del" ],
                command: "strikeThrough"
            });
            var LinkDialog = Class(Dialog, {
                show: function(node) {
                    var control = this.control, editor = this.toolbar.editor, selection = rangy.saveSelection();
                    editor.showDialog(function() {
                        input.focus();
                    });
                    var input = this.addTextField("URL: ", {
                        escape: function() {
                            editor.restoreSelection(selection);
                        },
                        enter: function(evt) {
                            editor.restoreSelection(selection);
                            control.saveLink(node, evt.target.value);
                        }
                    });
                    this.addButton("Save", {
                        fontAwesomeID: "check",
                        click: function(evt) {
                            evt.stopImmediatePropagation();
                            editor.restoreSelection(selection);
                            control.saveLink(node, input.value);
                        }
                    });
                    if (node) {
                        input.value = node.getAttribute("href");
                        this.addButton("Remove", {
                            fontAwesomeID: "chain-broken",
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
                    label: "#",
                    base_title: "Link",
                    title: "",
                    fontAwesomeID: "link"
                }),
                init: function() {
                    Button.prototype.init.apply(this, arguments);
                    var self = this, editor = this.toolbar.editor;
                    editor.on("keydown", function(evt) {
                        if (evt.which === 75 && evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                            evt.preventDefault();
                            self.click();
                        }
                    });
                },
                isHighlighted: function() {
                    var title = this.options.base_title;
                    var nodes = this.toolbar.editor.filterTopNodeNames("a");
                    if (nodes.length > 0) {
                        title += ": " + nodes[0].href;
                    }
                    this.element.setAttribute("title", title);
                    return nodes.length > 0;
                },
                isVisible: function() {
                    return !this.toolbar.editor.getSelection().isCollapsed || this.isHighlighted();
                },
                click: function() {
                    var editor = this.toolbar.editor, collapsed = editor.getSelection().isCollapsed;
                    var node = editor.filterTopNodeNames("a");
                    if (collapsed && node.length === 0) {
                        return;
                    }
                    node = node.length === 0 ? null : node[0];
                    if (collapsed) {
                        editor.setRange(node);
                    }
                    new LinkDialog(this).show(node);
                },
                saveLink: function(node, url) {
                    var editor = this.toolbar.editor, range = editor.getRange();
                    if (node) {
                        if (!url) {
                            var selection = rangy.saveSelection();
                            rangy.dom.replaceNodeByContents(node, true);
                            rangy.restoreSelection(selection);
                            rangy.removeMarkers(selection);
                        } else {
                            node.setAttribute("href", url);
                            editor.setRange(node);
                        }
                    } else if (url) {
                        node = document.createElement("a");
                        node.setAttribute("href", url);
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
        }, {
            "../../vendor/rangy/core": 11,
            "../controls": 1,
            "../util": 9
        } ],
        4: [ function(_dereq_, module, exports) {
            var _util = _dereq_("../util"), _controls = _dereq_("../controls"), rangy = _dereq_("../../vendor/rangy/core").api, Class = _util.Class, extend = _util.extend, Button = _controls.Button, Dialog = _controls.Dialog;
            var ImageDialog = Class(Dialog, {
                show: function(node) {
                    var control = this.control, editor = this.toolbar.editor, selection = rangy.saveSelection();
                    editor.showDialog(function() {
                        input.focus();
                    });
                    var input = this.addTextField("URL: ", {
                        escape: function() {
                            editor.restoreSelection(selection);
                        },
                        enter: function(evt) {
                            editor.restoreSelection(selection);
                            control.saveImage(node, evt.target.value);
                        }
                    });
                    this.addButton("Save", {
                        fontAwesomeID: "check",
                        click: function(evt) {
                            evt.stopImmediatePropagation();
                            editor.restoreSelection(selection);
                            control.saveImage(node, input.value);
                        }
                    });
                    if (node) {
                        input.value = node.getAttribute("src");
                    }
                }
            });
            exports.Image = Class(Button, {
                defaults: extend({}, Button.prototype.defaults, {
                    label: "IMG",
                    title: "Image",
                    fontAwesomeID: "picture-o"
                }),
                init: function() {
                    Button.prototype.init.apply(this, arguments);
                    var editor = this.toolbar.editor;
                    editor.on("click", function(evt) {
                        if (evt.target.tagName.toLowerCase() === "img") {
                            editor.setRange(evt.target);
                            editor.showToolbar();
                        }
                    });
                },
                isHighlighted: function() {
                    return this.toolbar.editor.filterTopNodeNames("img").length > 0;
                },
                click: function() {
                    var editor = this.toolbar.editor, node = editor.filterTopNodeNames("img");
                    node = node.length === 0 ? null : node[0];
                    new ImageDialog(this).show(node);
                },
                saveImage: function(node, url) {
                    var editor = this.toolbar.editor, range = editor.getRange();
                    if (node && url) {
                        node.setAttribute("src", url);
                        editor.setRange(node);
                    } else if (url) {
                        node = document.createElement("img");
                        node.setAttribute("src", url);
                        range.deleteContents();
                        range.insertNode(node);
                        editor.cleanBlock(node.parentNode);
                        editor.setRange(node);
                    }
                    editor.showToolbar();
                    return node;
                }
            });
            exports.Oembed = Class(Button, {
                defaults: extend({}, Button.prototype.defaults, {
                    label: "Embeded",
                    title: "Embeded content",
                    fontAwesomeID: "youtube-play"
                }),
                click: function() {
                    window.alert("No implemented yet :)");
                }
            });
        }, {
            "../../vendor/rangy/core": 11,
            "../controls": 1,
            "../util": 9
        } ],
        5: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("../vendor/rangy/core").api;
            var extend = _dereq_("./util").extend;
            var Class = _dereq_("./util").Class;
            var Toolbar = _dereq_("./toolbar").Toolbar;
            var _ = _dereq_("./util")._;
            var HtmlCleaner = _dereq_("./html-cleaner").HtmlCleaner;
            var Editor = Class(Object, {
                defaults: {
                    delay: 300,
                    diffLeft: 2,
                    diffTop: -10,
                    classPrefix: "editor-",
                    fontAwesomeEnabled: true
                },
                BLOCK_NODES: "P H1 H2 H3 H4 H5 H6 UL OL PRE DL DIV NOSCRIPT BLOCKQUOTE FORM HR TABLE FIELDSET ADDRESS".split(" "),
                init: function(element, options) {
                    if (!window.getSelection) {
                        throw new Error("Browser features missing.");
                    }
                    if (typeof element !== "object") {
                        return;
                    }
                    this.element = element;
                    if (!rangy.initialized) {
                        rangy.init();
                    }
                    this.isActive = true;
                    this.isSelected = false;
                    this.options = extend({}, this.defaults, options);
                    this._currentEditor = null;
                    this._resizeHandler = function(self) {
                        var timeout = null;
                        return function() {
                            clearTimeout(timeout);
                            timeout = setTimeout(function() {
                                self.setToolbarPosition();
                            }, 250);
                        };
                    }(this);
                    this.initElement().initToolbar().bindSelect().bindTyping();
                },
                on: function(name, handler) {
                    this.element.addEventListener(name, handler);
                },
                off: function(name, handler) {
                    this.element.removeEventListener(name, handler);
                },
                initElement: function() {
                    var self = this;
                    this.element.setAttribute("contentEditable", true);
                    this.element.setAttribute("data-editor-element", true);
                    this.on("focus", function() {
                        self._onFocus();
                    });
                    return this;
                },
                bindSelect: function() {
                    var self = this, timeout = null;
                    var wrapper = function(evt) {
                        clearTimeout(timeout);
                        timeout = setTimeout(function() {
                            self._onSelect(evt);
                        }, self.options.delay);
                    };
                    document.addEventListener("mouseup", wrapper);
                    document.addEventListener("keyup", wrapper);
                    return this;
                },
                bindTyping: function() {
                    var self = this;
                    this.on("keyup", function(evt) {
                        var selection = self.getSelection();
                        if (evt.which !== 9 && selection.isCollapsed && selection.getEnclosingNode() === self._currentEditor) {
                            self.exec("formatBlock", "p");
                        }
                    });
                    return this;
                },
                initToolbar: function() {
                    var self = this;
                    this.toolbar = new Toolbar(this, {
                        classPrefix: this.options.classPrefix,
                        fontAwesomeEnabled: this.options.fontAwesomeEnabled
                    });
                    this.toolbar.element.addEventListener("toolbar.show", function() {
                        self.focus();
                    });
                    this.toolbar.element.addEventListener("toolbar.hide", function() {
                        var elements = self.element.querySelectorAll("span.rangySelectionBoundary");
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
                    this.toolbar.hideDialog();
                    this.toolbar.show();
                    this.setToolbarPosition();
                    window.addEventListener("resize", this._resizeHandler);
                    return this;
                },
                hideToolbar: function() {
                    window.removeEventListener("resize", this._resizeHandler);
                    this.toolbar.hide();
                    return this;
                },
                showDialog: function(callback) {
                    var self = this;
                    this.toolbar.showDialog();
                    setTimeout(function() {
                        self.setToolbarPosition();
                        if (typeof callback === "function") {
                            callback.call(self);
                        }
                    }, 20);
                    return this;
                },
                setToolbarPosition: function() {
                    var selection = this.getSelection(), range = this.getRange(), node = selection.getEnclosingNode(), height = this.toolbar.element.offsetHeight, width = this.toolbar.element.offsetWidth, boundary;
                    if (!selection.isCollapsed && rangy.util.isHostMethod(range.nativeRange, "getBoundingClientRect")) {
                        boundary = range.nativeRange.getBoundingClientRect();
                    } else {
                        while (node.parentNode.childNodes.length === 1) {
                            node = node.parentNode;
                        }
                        boundary = node.getBoundingClientRect();
                    }
                    var top = 0;
                    if (boundary.top < height) {
                        top = boundary.bottom - this.options.diffTop + window.pageYOffset;
                    } else {
                        top = boundary.top + this.options.diffTop + window.pageYOffset - height;
                    }
                    var left = boundary.left - this.options.diffLeft;
                    if (this._currentEditor.offsetWidth < width + boundary.left) {
                        left = boundary.right - width + this.options.diffLeft;
                    }
                    this.toolbar.move(top, left);
                },
                restoreSelection: function(selection, showToolbar) {
                    showToolbar = typeof showToolbar === "undefined" ? true : showToolbar;
                    rangy.restoreSelection(selection);
                    rangy.removeMarkers(selection);
                    this.element.focus();
                    if (showToolbar) {
                        this.showToolbar();
                    }
                },
                _onFocus: function() {
                    this._currentEditor = this.element;
                },
                _onSelect: function(evt) {
                    var elements = [ this.element, this.toolbar.element ];
                    if (!rangy.dom.hasParents(evt.target, elements)) {
                        if (this.isSelected) {
                            this.hideToolbar();
                            this._currentEditor = null;
                            this.isSelected = false;
                        }
                        return;
                    }
                    this._currentEditor = this.element;
                    if (!rangy.dom.hasParents(evt.target, [ this.toolbar.element ])) {
                        this.showToolbar();
                    }
                    if (!this.isSelected) {
                        this.isSelected = true;
                        if (evt.which === 9) {
                            this.selectStart();
                        }
                    }
                },
                selectStart: function() {
                    var selection = this.getSelection();
                    if (!selection.isCollapsed) {
                        return;
                    }
                    if (this.element.childNodes.length > 0 && this.element.firstChild.nodeType === 3) {
                        if (this.element.firstChild.textContent.replace(/^\s*(.*?)\s*$/, "$1") === "") {
                            this.element.removeChild(this.element.firstChild);
                        }
                    }
                    var node, nodes;
                    if (this.element.childNodes.length > 0) {
                        node = this.element.firstChild;
                        nodes = rangy.dom.getNodes(node, 3);
                        if (nodes.length > 0) {
                            node = nodes[0];
                        }
                    } else {
                        node = document.createElement("p");
                        this.element.appendChild(node);
                        node.appendChild(document.createTextNode(""));
                        node = node.firstChild;
                    }
                    if (node.nodeType === 3) {
                        var range = rangy.createRange();
                        range.setStart(node, 0);
                        this.getSelection().setSingleRange(range);
                    } else {
                        this.setRange(node);
                    }
                    this.showToolbar();
                },
                getSelection: function() {
                    return rangy.getSelection();
                },
                getRange: function(index) {
                    index = typeof index === "undefined" ? 0 : index;
                    return this.getSelection().getRangeAt(0);
                },
                setRange: function(node, end) {
                    if (typeof node === "undefined") {
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
                cleanBlock: function(node) {
                    var e = node.childNodes[node.childNodes.length - 1];
                    if (e.nodeType === 1 && e.nodeName.toLowerCase() === "br") {
                        node.removeChild(e);
                    }
                },
                serialize: function(clean) {
                    var html = this.element.innerHTML;
                    if (clean) {
                        var cleaner = new HtmlCleaner();
                        html = cleaner.clean(html);
                    }
                    return html;
                }
            });
            exports.Editor = Editor;
            var controls = {
                Menu: _dereq_("./controls").Menu,
                inline: _dereq_("./controls/inline"),
                block: _dereq_("./controls/block"),
                media: _dereq_("./controls/media")
            };
            exports.controls = controls;
            exports.simpleEditor = Class(Editor, {
                init: function() {
                    Editor.prototype.init.apply(this, arguments);
                    this.toolbar.addControl(controls.Menu, "blocks", {
                        label: "¶",
                        title: "Blocks",
                        controls: [ [ controls.block.Paragraph, "p" ], [ controls.block.H1, "h1" ], [ controls.block.H2, "h2" ], [ controls.block.H3, "h3" ], [ controls.block.Preformated, "pre" ] ]
                    });
                    this.toolbar.addControl(controls.Menu, "lists", {
                        label: "Lists",
                        title: "Lists",
                        fontAwesomeID: "list-ul",
                        controls: [ [ controls.block.UnorderedList, "ul" ], [ controls.block.OrderedList, "ol" ] ]
                    });
                    this.toolbar.addControl(controls.block.Blockquote, "quote");
                    this.toolbar.addControl(controls.inline.Bold, "bold");
                    this.toolbar.addControl(controls.inline.Italic, "italic");
                    this.toolbar.addControl(controls.inline.Underline, "underline");
                    this.toolbar.addControl(controls.inline.StrikeThrough, "strike");
                    this.toolbar.addControl(controls.inline.Link, "link");
                    this.toolbar.addControl(controls.media.Image, "image");
                    this.toolbar.addControl(controls.media.Oembed, "oembed");
                }
            });
        }, {
            "../vendor/rangy/core": 11,
            "./controls": 1,
            "./controls/block": 2,
            "./controls/inline": 3,
            "./controls/media": 4,
            "./html-cleaner": 6,
            "./toolbar": 8,
            "./util": 9
        } ],
        6: [ function(_dereq_, module, exports) {
            var Class = _dereq_("./util").Class;
            var extend = _dereq_("./util").extend;
            var _ = _dereq_("./util")._;
            var HtmlCleaner = Class(Object, {
                defaults: {},
                init: function(options) {
                    this.options = extend({}, this.defaults, options);
                },
                formatRegexp: [ [ /(<[a-z][^>]*)margin\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)margin-bottom\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)margin-left\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)margin-right\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)margin-top\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)padding\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)padding-bottom\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)padding-left\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)padding-right\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)padding-top\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)font\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)font-family\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)font-size\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)font-style\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)font-variant\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)font-weight\s*:[^;]*;/gm, "$1" ], [ /(<[a-z][^>]*)color\s*:[^;]*;/gm, "$1" ] ],
                cleanRegexp: [ [ /<meta[\w\W]*?>/gim, "" ], [ /<style[\w\W]*?>[\w\W]*?<\/style>/gim, "" ], [ /<\/?font[\w\W]*?>/gim, "" ], [ /<(\/?)(B|b|STRONG)([\s>\/])/g, "<$1strong$3" ], [ /<(\/?)(I|i|EM)([\s>\/])/g, "<$1em$3" ], [ /<IMG ([^>]*?[^\/])>/gi, "<img $1 />" ], [ /<INPUT ([^>]*?[^\/])>/gi, "<input $1 />" ], [ /<COL ([^>]*?[^\/])>/gi, "<col $1 />" ], [ /<AREA ([^>]*?[^\/])>/gi, "<area $1 />" ], [ /<PARAM ([^>]*?[^\/])>/gi, "<param $1 />" ], [ /<HR ([^>]*?[^\/])>/gi, "<hr $1/>" ], [ /<BR ([^>]*?[^\/])>/gi, "<br $1/>" ], [ /<(\/?)U([\s>\/])/gi, "<$1ins$2" ], [ /<(\/?)STRIKE([\s>\/])/gi, "<$1del$2" ], [ /<span style="font-weight: normal;">([\w\W]*?)<\/span>/gm, "$1" ], [ /<span style="font-weight: bold;">([\w\W]*?)<\/span>/gm, "<strong>$1</strong>" ], [ /<span style="font-style: italic;">([\w\W]*?)<\/span>/gm, "<em>$1</em>" ], [ /<span style="text-decoration: underline;">([\w\W]*?)<\/span>/gm, "<ins>$1</ins>" ], [ /<span style="text-decoration: line-through;">([\w\W]*?)<\/span>/gm, "<del>$1</del>" ], [ /<span style="text-decoration: underline line-through;">([\w\W]*?)<\/span>/gm, "<del><ins>$1</ins></del>" ], [ /<span style="(font-weight: bold; ?|font-style: italic; ?){2}">([\w\W]*?)<\/span>/gm, "<strong><em>$2</em></strong>" ], [ /<span style="(font-weight: bold; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/span>/gm, "<ins><strong>$2</strong></ins>" ], [ /<span style="(font-weight: italic; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/span>/gm, "<ins><em>$2</em></ins>" ], [ /<span style="(font-weight: bold; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/span>/gm, "<del><strong>$2</strong></del>" ], [ /<span style="(font-weight: italic; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/span>/gm, "<del><em>$2</em></del>" ], [ /<span style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline; ?){3}">([\w\W]*?)<\/span>/gm, "<ins><strong><em>$2</em></strong></ins>" ], [ /<span style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: line-through; ?){3}">([\w\W]*?)<\/span>/gm, "<del><strong><em>$2</em></strong></del>" ], [ /<span style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline line-through; ?){3}">([\w\W]*?)<\/span>/gm, "<del><ins><strong><em>$2</em></strong></ins></del>" ], [ /<strong style="font-weight: normal;">([\w\W]*?)<\/strong>/gm, "$1" ], [ /<([a-z]+) style="font-weight: normal;">([\w\W]*?)<\/\1>/gm, "<$1>$2</$1>" ], [ /<([a-z]+) style="font-weight: bold;">([\w\W]*?)<\/\1>/gm, "<$1><strong>$2</strong></$1>" ], [ /<([a-z]+) style="font-style: italic;">([\w\W]*?)<\/\1>/gm, "<$1><em>$2</em></$1>" ], [ /<([a-z]+) style="text-decoration: underline;">([\w\W]*?)<\/\1>/gm, "<ins><$1>$2</$1></ins>" ], [ /<([a-z]+) style="text-decoration: line-through;">([\w\W]*?)<\/\1>/gm, "<del><$1>$2</$1></del>" ], [ /<([a-z]+) style="text-decoration: underline line-through;">([\w\W]*?)<\/\1>/gm, "<del><ins><$1>$2</$1></ins></del>" ], [ /<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?){2}">([\w\W]*?)<\/\1>/gm, "<$1><strong><em>$3</em></strong></$1>" ], [ /<([a-z]+) style="(font-weight: bold; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/\1>/gm, "<ins><$1><strong>$3</strong></$1></ins>" ], [ /<([a-z]+) style="(font-weight: italic; ?|text-decoration: underline; ?){2}">([\w\W]*?)<\/\1>/gm, "<ins><$1><em>$3</em></$1></ins>" ], [ /<([a-z]+) style="(font-weight: bold; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/\1>/gm, "<del><$1><strong>$3</strong></$1></del>" ], [ /<([a-z]+) style="(font-weight: italic; ?|text-decoration: line-through; ?){2}">([\w\W]*?)<\/\1>/gm, "<del><$1><em>$3</em></$1></del>" ], [ /<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline; ?){3}">([\w\W]*?)<\/\1>/gm, "<ins><$1><strong><em>$3</em></strong></$1></ins>" ], [ /<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: line-through; ?){3}">([\w\W]*?)<\/\1>/gm, "<del><$1><strong><em>$3</em></strong></$1></del>" ], [ /<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?|text-decoration: underline line-through; ?){3}">([\w\W]*?)<\/\1>/gm, "<del><ins><$1><strong><em>$3</em></strong></$1></ins></del>" ], [ /<p><blockquote>(.*)(\n)+<\/blockquote><\/p>/i, "<blockquote>$1</blockquote>\n" ], [ /<\/(strong|em|ins|del|q|code)>(\s*?)<\1>/gim, "$2" ], [ /<(br|BR)>/g, "<br />" ], [ /<(hr|HR)>/g, "<hr />" ], [ /([^\s])\/>/g, "$1 />" ], [ /<br \/>\s*<\/(h1|h2|h3|h4|h5|h6|ul|ol|li|p|blockquote|div)/gi, "</$1" ], [ /<\/(h1|h2|h3|h4|h5|h6|ul|ol|li|p|blockquote)>([^\n\u000B\r\f])/gi, "</$1>\n$2" ], [ /<hr style="width: 100%; height: 2px;" \/>/g, "<hr />" ], [ /style="\s*?"/gim, "" ], [ /<\s+/gim, "<" ], [ /\s+>/gim, ">" ] ],
                removeFormat: function(html) {
                    _.each(this.formatRegexp, function(v) {
                        html = "".replace.apply(html, v);
                    });
                    return html;
                },
                tagsoup2html: function(html) {
                    _.each(this.cleanRegexp, function(v) {
                        html = "".replace.apply(html, v);
                    });
                    while (/(<[^\/!]>|<[^\/!][^>]*[^\/]>)\s*<\/[^>]*[^-]>/.test(html)) {
                        html = html.replace(/(<[^\/!]>|<[^\/!][^>]*[^\/]>)\s*<\/[^>]*[^-]>/g, "");
                    }
                    html = html.replace(/<(\/?)([A-Z0-9]+)/g, function(m0, m1, m2) {
                        return "<" + m1 + m2.toLowerCase();
                    });
                    var reg = /<[^>]+((\s+\w+\s*=\s*)([^"'][\w~@+$,%\/:.#?=&;!*()-]*))[^>]*?>/;
                    var _f = function(m0, m1, m2, m3) {
                        var _r = m1.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, "\\$1");
                        return m0.replace(_r, m2 + '"' + m3 + '"');
                    };
                    while (reg.test(html)) {
                        html = html.replace(reg, _f);
                    }
                    while (/(<[^>]+style=(["'])[^>]+[\s:]+)0(pt|px)(\2|\s|;)/.test(html)) {
                        html = html.replace(/(<[^>]+style=(["'])[^>]+[\s:]+)0(pt|px)(\2|\s|;)/gi, "$1" + "0$4");
                    }
                    html = html.replace(/\r\n/g, "\n");
                    html = html.replace(/^\s+/, "").replace(/\s+$/, "");
                    return html;
                },
                clean: function(html) {
                    html = this.removeFormat(html);
                    html = this.tagsoup2html(html);
                    return html;
                }
            });
            exports.HtmlCleaner = HtmlCleaner;
        }, {
            "./util": 9
        } ],
        7: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("../vendor/rangy/core");
            var _ = _dereq_("./util")._;
            rangy.api.createCoreModule("RangyExtensions", [], function(api) {
                api.selectionPrototype.getBoundaryNodes = function() {
                    var startNode, startOffset, endNode, endOffset;
                    if (!this.isBackwards()) {
                        startNode = this.anchorNode;
                        startOffset = this.anchorOffset;
                        endNode = this.focusNode;
                        endOffset = this.focusOffset;
                    } else {
                        startNode = this.focusNode;
                        startOffset = this.focusOffset;
                        endNode = this.anchorNode;
                        endOffset = this.anchorOffset;
                    }
                    if (startNode.nodeType === 3 && startNode.nextSibling && startNode.length === startOffset) {
                        startNode = startNode.nextSibling;
                    } else if (startNode.nodeType === 1 && startNode.childNodes.length > startOffset) {
                        startNode = startNode.childNodes[startOffset];
                    }
                    while (startNode.firstChild && startNode.firstChild.nodeType === 1) {
                        startNode = startNode.firstChild;
                    }
                    if (endNode.nodeType === 3 && endNode.previousSibling && endOffset === 0) {
                        endNode = endNode.previousSibling;
                    } else if (endOffset > 0 && endNode.nodeType === 1 && endNode.childNodes.length > 0) {
                        endNode = endNode.childNodes[endOffset - 1];
                    }
                    while (endNode.lastChild && endNode.lastChild.nodeType === 1) {
                        endNode = endNode.lastChild;
                    }
                    startNode = startNode && startNode.nodeType !== 1 ? startNode.parentNode : startNode;
                    endNode = endNode && endNode.nodeType !== 1 ? endNode.parentNode : endNode;
                    return {
                        start: startNode,
                        end: endNode
                    };
                };
                api.selectionPrototype.getEnclosingNode = function() {
                    var nodes = this.getBoundaryNodes(), node;
                    if (nodes.start === nodes.end) {
                        node = nodes.start;
                    } else {
                        node = api.dom.getCommonAncestor(nodes.start, nodes.end);
                    }
                    return api.dom.getDeepestNode(node);
                };
                api.selectionPrototype.getTopNodes = function(boundary, filter) {
                    boundary = boundary || document.body;
                    var node = this.getEnclosingNode(), result = [ node ];
                    if (node === boundary) {
                        return [];
                    }
                    while (node.parentNode !== boundary) {
                        node = node.parentNode;
                        result.push(node);
                    }
                    return typeof filter === "function" ? _.filter(result, filter) : result;
                };
                api.selectionPrototype.getSurroundingNodes = function(filter) {
                    var nodes = this.getBoundaryNodes(), parent = this.getEnclosingNode(), started = false, node, result = [];
                    if (api.dom.isAncestorOf(nodes.start, nodes.end, true)) {
                        return [ nodes.start ];
                    }
                    if (api.dom.isAncestorOf(nodes.end, nodes.start, true)) {
                        return [ nodes.end ];
                    }
                    for (var i = 0; i < parent.childNodes.length; i++) {
                        node = parent.childNodes[i];
                        if (!started) {
                            started = api.dom.isAncestorOf(node, nodes.start, true);
                        }
                        if (started) {
                            result.push(node);
                        }
                        if (api.dom.isAncestorOf(node, nodes.end, true)) {
                            break;
                        }
                    }
                    return typeof filter === "function" ? _.filter(result, filter) : result;
                };
                api.dom.hasParents = function(node, parents) {
                    while ([ document, document.body ].indexOf(node) === -1 && node != null) {
                        if (parents.indexOf(node) !== -1) {
                            return true;
                        }
                        node = node.parentNode;
                    }
                    return false;
                };
                api.dom.getDeepestNode = function(node) {
                    while (node.childNodes.length === 1 && node.firstChild.nodeType === 1) {
                        node = node.firstChild;
                    }
                    return node;
                };
                api.dom.replaceNodeByContents = function(node) {
                    var content = this.getDocument(node).createDocumentFragment();
                    _.each(node.childNodes, function(n) {
                        content.appendChild(n.cloneNode(true));
                    });
                    node.parentNode.replaceChild(content, node);
                };
                api.dom.getNodes = function(node, nodeType, inloop) {
                    var result = [];
                    if (!inloop && (typeof nodeType === "undefined" || node.nodeType === nodeType)) {
                        result.push(node);
                    }
                    for (var i = 0; i < node.childNodes.length; i++) {
                        if (typeof nodeType === "undefined" || node.childNodes[i].nodeType === nodeType) {
                            result.push(node.childNodes[i]);
                        }
                        [].push.apply(result, api.dom.getNodes(node.childNodes[i], nodeType, true));
                    }
                    return result;
                };
            });
        }, {
            "../vendor/rangy/core": 11,
            "./util": 9
        } ],
        8: [ function(_dereq_, module, exports) {
            var _util = _dereq_("./util"), _controls = _dereq_("./controls"), ControlsMixin = _controls.ControlsMixin, extend = _util.extend, Class = _util.Class;
            var Toolbar = Class(Object, {
                defaults: {
                    classPrefix: "",
                    fontAwesomeEnabled: false
                },
                init: function(editor, options) {
                    ControlsMixin.prototype.init.call(this);
                    this.editor = editor;
                    this.options = extend({}, this.defaults, options || {});
                    this.element = document.createElement("div");
                    this.container = document.createElement("ul");
                    this.dialog = document.createElement("div");
                    this.container.classList.add(this._getClassName("controls"));
                    this.element.classList.add(this._getClassName("toolbar"));
                    document.body.appendChild(this.element);
                    this.dialog.classList.add(this._getClassName("dialog"));
                    this.dialog.style.display = "none";
                    this.element.appendChild(this.container);
                    this.element.appendChild(this.dialog);
                    this.element.style.visibility = "hidden";
                    this._showEvt = document.createEvent("Event");
                    this._showEvt.initEvent("toolbar.show", false, true);
                    this._hideEvt = document.createEvent("Event");
                    this._hideEvt.initEvent("toolbar.hide", false, true);
                    this._dirty = false;
                },
                _getClassName: function(name) {
                    return this.options.classPrefix + name;
                },
                click: function(fn) {
                    this.element.addEventListener("click", fn);
                },
                focus: function(fn) {
                    this.element.addEventListener("focus", fn);
                },
                hide: function() {
                    this.element.style.visibility = "hidden";
                    this.element.dispatchEvent(this._hideEvt);
                },
                show: function() {
                    if (this._dirty) {
                        this.drawControls();
                    }
                    this.element.style.visibility = "visible";
                    this.element.dispatchEvent(this._showEvt);
                },
                showDialog: function() {
                    this.emptyDialog();
                    this.dialog.style.display = "block";
                    this.container.style.display = "none";
                },
                hideDialog: function() {
                    this.dialog.style.display = "none";
                    this.container.style.display = "block";
                },
                emptyDialog: function() {
                    while (this.dialog.firstChild) {
                        this.dialog.removeChild(this.dialog.firstChild);
                    }
                },
                move: function(top, left) {
                    this.element.style.top = top + "px";
                    this.element.style.left = left + "px";
                },
                addControl: function(Klass, id, options) {
                    this.controls[id] = new Klass(this, id, options);
                    this._dirty = true;
                },
                removeControl: function(id) {
                    if (!this.controls[id]) {
                        return;
                    }
                    ControlsMixin.prototype.removeControl.call(this, id);
                    this._dirty = true;
                },
                drawControls: function() {
                    var control;
                    while (this.container.firstChild) {
                        this.container.removeChild(this.container.firstChild);
                    }
                    for (var id in this.controls) {
                        control = this.controls[id];
                        this.container.appendChild(control.drawElement());
                    }
                    this._dirty = false;
                }
            });
            exports.Toolbar = Toolbar;
        }, {
            "./controls": 1,
            "./util": 9
        } ],
        9: [ function(_dereq_, module, exports) {
            var extend = function() {
                var args = Array.prototype.slice.call(arguments);
                var base = args.shift();
                var type = "";
                if (typeof base === "string" || typeof base === "boolean") {
                    type = base === true ? "deep" : base;
                    base = args.shift();
                    if (type === "defaults") {
                        base = extend({}, base);
                        type = "strict";
                    }
                }
                for (var i = 0, c = args.length; i < c; i++) {
                    var prop = args[i];
                    for (var name in prop) {
                        if (type === "deep" && typeof prop[name] === "object" && typeof base[name] !== "undefined") {
                            extend(type, base[name], prop[name]);
                        } else if (type !== "strict" || type === "strict" && typeof base[name] !== "undefined") {
                            base[name] = prop[name];
                        }
                    }
                }
                return base;
            };
            var Class = function(parent, proto) {
                var C = function() {
                    if (typeof this.init !== "undefined") {
                        this.init.apply(this, arguments);
                    }
                };
                var F = function() {};
                F.prototype = parent.prototype;
                C.prototype = new F();
                C.prototype.constructor = parent;
                extend(C.prototype, proto);
                return C;
            };
            var _ = {};
            var breaker = {};
            var nativeForEach = Array.prototype.forEach, nativeMap = Array.prototype.map, nativeFilter = Array.prototype.filter;
            _.each = function(obj, iterator, context) {
                if (obj == null) return obj;
                if (nativeForEach && obj.forEach === nativeForEach) {
                    obj.forEach(iterator, context);
                } else if (obj.length === +obj.length) {
                    for (var i = 0, length = obj.length; i < length; i++) {
                        if (iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    var keys = _.keys(obj);
                    for (var i = 0, length = keys.length; i < length; i++) {
                        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
                    }
                }
                return obj;
            };
            _.map = function(obj, iterator, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
                _.each(obj, function(value, index, list) {
                    results.push(iterator.call(context, value, index, list));
                });
                return results;
            };
            _.filter = function(obj, predicate, context) {
                var results = [];
                if (obj == null) return results;
                if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
                _.each(obj, function(value, index, list) {
                    if (predicate.call(context, value, index, list)) results.push(value);
                });
                return results;
            };
            exports.extend = extend;
            exports.Class = Class;
            exports._ = _;
        }, {} ],
        10: [ function(_dereq_, module, exports) {
            exports.VERSION = "0.3.0";
            exports.rangy = _dereq_("./vendor/rangy/core").api;
            _dereq_("./vendor/rangy/dom");
            _dereq_("./vendor/rangy/domrange");
            _dereq_("./vendor/rangy/selectionsaverestore");
            _dereq_("./vendor/rangy/wrappedrange");
            _dereq_("./vendor/rangy/wrappedselection");
            _dereq_("./lib/rangy-extensions");
            exports.extend = _dereq_("./lib/util").extend;
            exports.Class = _dereq_("./lib/util").Class;
            exports.HtmlCleaner = _dereq_("./lib/html-cleaner").HtmlCleaner;
            exports.Editor = _dereq_("./lib/editor").Editor;
            exports.controls = _dereq_("./lib/editor").controls;
            exports.simpleEditor = _dereq_("./lib/editor").simpleEditor;
        }, {
            "./lib/editor": 5,
            "./lib/html-cleaner": 6,
            "./lib/rangy-extensions": 7,
            "./lib/util": 9,
            "./vendor/rangy/core": 11,
            "./vendor/rangy/dom": 12,
            "./vendor/rangy/domrange": 13,
            "./vendor/rangy/selectionsaverestore": 14,
            "./vendor/rangy/wrappedrange": 15,
            "./vendor/rangy/wrappedselection": 16
        } ],
        11: [ function(_dereq_, module, exports) {
            var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";
            var domRangeProperties = [ "startContainer", "startOffset", "endContainer", "endOffset", "collapsed", "commonAncestorContainer" ];
            var domRangeMethods = [ "setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore", "setEndAfter", "collapse", "selectNode", "selectNodeContents", "compareBoundaryPoints", "deleteContents", "extractContents", "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString", "detach" ];
            var textRangeProperties = [ "boundingHeight", "boundingLeft", "boundingTop", "boundingWidth", "htmlText", "text" ];
            var textRangeMethods = [ "collapse", "compareEndPoints", "duplicate", "moveToElementText", "parentElement", "select", "setEndPoint", "getBoundingClientRect" ];
            function isHostMethod(o, p) {
                var t = typeof o[p];
                return t == FUNCTION || !!(t == OBJECT && o[p]) || t == "unknown";
            }
            function isHostObject(o, p) {
                return !!(typeof o[p] == OBJECT && o[p]);
            }
            function isHostProperty(o, p) {
                return typeof o[p] != UNDEFINED;
            }
            function createMultiplePropertyTest(testFunc) {
                return function(o, props) {
                    var i = props.length;
                    while (i--) {
                        if (!testFunc(o, props[i])) {
                            return false;
                        }
                    }
                    return true;
                };
            }
            var areHostMethods = createMultiplePropertyTest(isHostMethod);
            var areHostObjects = createMultiplePropertyTest(isHostObject);
            var areHostProperties = createMultiplePropertyTest(isHostProperty);
            function isTextRange(range) {
                return range && areHostMethods(range, textRangeMethods) && areHostProperties(range, textRangeProperties);
            }
            function getBody(doc) {
                return isHostObject(doc, "body") ? doc.body : doc.getElementsByTagName("body")[0];
            }
            var modules = {};
            var api = {
                version: "1.3alpha.804",
                initialized: false,
                supported: true,
                util: {
                    isHostMethod: isHostMethod,
                    isHostObject: isHostObject,
                    isHostProperty: isHostProperty,
                    areHostMethods: areHostMethods,
                    areHostObjects: areHostObjects,
                    areHostProperties: areHostProperties,
                    isTextRange: isTextRange,
                    getBody: getBody
                },
                features: {},
                modules: modules,
                config: {
                    alertOnFail: true,
                    alertOnWarn: false,
                    preferTextRange: false
                }
            };
            function consoleLog(msg) {
                if (isHostObject(window, "console") && isHostMethod(window.console, "log")) {
                    window.console.log(msg);
                }
            }
            function alertOrLog(msg, shouldAlert) {
                if (shouldAlert) {
                    window.alert(msg);
                } else {
                    consoleLog(msg);
                }
            }
            function fail(reason) {
                api.initialized = true;
                api.supported = false;
                alertOrLog("Rangy is not supported on this page in your browser. Reason: " + reason, api.config.alertOnFail);
            }
            api.fail = fail;
            function warn(msg) {
                alertOrLog("Rangy warning: " + msg, api.config.alertOnWarn);
            }
            api.warn = warn;
            if ({}.hasOwnProperty) {
                api.util.extend = function(obj, props, deep) {
                    var o, p;
                    for (var i in props) {
                        if (props.hasOwnProperty(i)) {
                            o = obj[i];
                            p = props[i];
                            if (deep && o !== null && typeof o == "object" && p !== null && typeof p == "object") {
                                api.util.extend(o, p, true);
                            }
                            obj[i] = p;
                        }
                    }
                    return obj;
                };
            } else {
                fail("hasOwnProperty not supported");
            }
            (function() {
                var el = document.createElement("div");
                el.appendChild(document.createElement("span"));
                var slice = [].slice;
                var toArray;
                try {
                    if (slice.call(el.childNodes, 0)[0].nodeType == 1) {
                        toArray = function(arrayLike) {
                            return slice.call(arrayLike, 0);
                        };
                    }
                } catch (e) {}
                if (!toArray) {
                    toArray = function(arrayLike) {
                        var arr = [];
                        for (var i = 0, len = arrayLike.length; i < len; ++i) {
                            arr[i] = arrayLike[i];
                        }
                        return arr;
                    };
                }
                api.util.toArray = toArray;
            })();
            var addListener;
            if (isHostMethod(document, "addEventListener")) {
                addListener = function(obj, eventType, listener) {
                    obj.addEventListener(eventType, listener, false);
                };
            } else if (isHostMethod(document, "attachEvent")) {
                addListener = function(obj, eventType, listener) {
                    obj.attachEvent("on" + eventType, listener);
                };
            } else {
                fail("Document does not have required addEventListener or attachEvent method");
            }
            api.util.addListener = addListener;
            var initListeners = [];
            function getErrorDesc(ex) {
                return ex.message || ex.description || String(ex);
            }
            function init() {
                if (api.initialized) {
                    return;
                }
                var testRange;
                var implementsDomRange = false, implementsTextRange = false;
                if (isHostMethod(document, "createRange")) {
                    testRange = document.createRange();
                    if (areHostMethods(testRange, domRangeMethods) && areHostProperties(testRange, domRangeProperties)) {
                        implementsDomRange = true;
                    }
                    testRange.detach();
                }
                var body = getBody(document);
                if (!body || body.nodeName.toLowerCase() != "body") {
                    fail("No body element found");
                    return;
                }
                if (body && isHostMethod(body, "createTextRange")) {
                    testRange = body.createTextRange();
                    if (isTextRange(testRange)) {
                        implementsTextRange = true;
                    }
                }
                if (!implementsDomRange && !implementsTextRange) {
                    fail("Neither Range nor TextRange are available");
                    return;
                }
                api.initialized = true;
                api.features = {
                    implementsDomRange: implementsDomRange,
                    implementsTextRange: implementsTextRange
                };
                var module, errorMessage;
                for (var moduleName in modules) {
                    if ((module = modules[moduleName]) instanceof Module) {
                        module.init(module, api);
                    }
                }
                for (var i = 0, len = initListeners.length; i < len; ++i) {
                    try {
                        initListeners[i](api);
                    } catch (ex) {
                        errorMessage = "Rangy init listener threw an exception. Continuing. Detail: " + getErrorDesc(ex);
                        consoleLog(errorMessage);
                    }
                }
            }
            api.init = init;
            api.addInitListener = function(listener) {
                if (api.initialized) {
                    listener(api);
                } else {
                    initListeners.push(listener);
                }
            };
            var createMissingNativeApiListeners = [];
            api.addCreateMissingNativeApiListener = function(listener) {
                createMissingNativeApiListeners.push(listener);
            };
            function createMissingNativeApi(win) {
                win = win || window;
                init();
                for (var i = 0, len = createMissingNativeApiListeners.length; i < len; ++i) {
                    createMissingNativeApiListeners[i](win);
                }
            }
            api.createMissingNativeApi = createMissingNativeApi;
            function Module(name, dependencies, initializer) {
                this.name = name;
                this.dependencies = dependencies;
                this.initialized = false;
                this.supported = false;
                this.initializer = initializer;
            }
            Module.prototype = {
                init: function(api) {
                    var requiredModuleNames = this.dependencies || [];
                    for (var i = 0, len = requiredModuleNames.length, requiredModule, moduleName; i < len; ++i) {
                        moduleName = requiredModuleNames[i];
                        requiredModule = modules[moduleName];
                        if (!requiredModule || !(requiredModule instanceof Module)) {
                            throw new Error("required module '" + moduleName + "' not found");
                        }
                        requiredModule.init();
                        if (!requiredModule.supported) {
                            throw new Error("required module '" + moduleName + "' not supported");
                        }
                    }
                    this.initializer(this);
                },
                fail: function(reason) {
                    this.initialized = true;
                    this.supported = false;
                    throw new Error("Module '" + this.name + "' failed to load: " + reason);
                },
                warn: function(msg) {
                    api.warn("Module " + this.name + ": " + msg);
                },
                deprecationNotice: function(deprecated, replacement) {
                    api.warn("DEPRECATED: " + deprecated + " in module " + this.name + "is deprecated. Please use " + replacement + " instead");
                },
                createError: function(msg) {
                    return new Error("Error in Rangy " + this.name + " module: " + msg);
                }
            };
            function createModule(isCore, name, dependencies, initFunc) {
                var newModule = new Module(name, dependencies, function(module) {
                    if (!module.initialized) {
                        module.initialized = true;
                        try {
                            initFunc(api, module);
                            module.supported = true;
                        } catch (ex) {
                            var errorMessage = "Module '" + name + "' failed to load: " + getErrorDesc(ex);
                            consoleLog(errorMessage);
                        }
                    }
                });
                modules[name] = newModule;
            }
            api.createModule = function(name) {
                var initFunc, dependencies;
                if (arguments.length == 2) {
                    initFunc = arguments[1];
                    dependencies = [];
                } else {
                    initFunc = arguments[2];
                    dependencies = arguments[1];
                }
                createModule(false, name, dependencies, initFunc);
            };
            api.createCoreModule = function(name, dependencies, initFunc) {
                createModule(true, name, dependencies, initFunc);
            };
            function RangePrototype() {}
            api.RangePrototype = RangePrototype;
            api.rangePrototype = new RangePrototype();
            function SelectionPrototype() {}
            api.selectionPrototype = new SelectionPrototype();
            exports.api = api;
        }, {} ],
        12: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("./core");
            rangy.api.createCoreModule("DomUtil", [], function(api, module) {
                var UNDEF = "undefined";
                var util = api.util;
                if (!util.areHostMethods(document, [ "createDocumentFragment", "createElement", "createTextNode" ])) {
                    module.fail("document missing a Node creation method");
                }
                if (!util.isHostMethod(document, "getElementsByTagName")) {
                    module.fail("document missing getElementsByTagName method");
                }
                var el = document.createElement("div");
                if (!util.areHostMethods(el, [ "insertBefore", "appendChild", "cloneNode" ] || !util.areHostObjects(el, [ "previousSibling", "nextSibling", "childNodes", "parentNode" ]))) {
                    module.fail("Incomplete Element implementation");
                }
                if (!util.isHostProperty(el, "innerHTML")) {
                    module.fail("Element is missing innerHTML property");
                }
                var textNode = document.createTextNode("test");
                if (!util.areHostMethods(textNode, [ "splitText", "deleteData", "insertData", "appendData", "cloneNode" ] || !util.areHostObjects(el, [ "previousSibling", "nextSibling", "childNodes", "parentNode" ]) || !util.areHostProperties(textNode, [ "data" ]))) {
                    module.fail("Incomplete Text Node implementation");
                }
                var arrayContains = function(arr, val) {
                    var i = arr.length;
                    while (i--) {
                        if (arr[i] === val) {
                            return true;
                        }
                    }
                    return false;
                };
                function isHtmlNamespace(node) {
                    var ns;
                    return typeof node.namespaceURI == UNDEF || ((ns = node.namespaceURI) === null || ns == "http://www.w3.org/1999/xhtml");
                }
                function parentElement(node) {
                    var parent = node.parentNode;
                    return parent.nodeType == 1 ? parent : null;
                }
                function getNodeIndex(node) {
                    var i = 0;
                    while (node = node.previousSibling) {
                        ++i;
                    }
                    return i;
                }
                function getNodeLength(node) {
                    switch (node.nodeType) {
                      case 7:
                      case 10:
                        return 0;

                      case 3:
                      case 8:
                        return node.length;

                      default:
                        return node.childNodes.length;
                    }
                }
                function getCommonAncestor(node1, node2) {
                    var ancestors = [], n;
                    for (n = node1; n; n = n.parentNode) {
                        ancestors.push(n);
                    }
                    for (n = node2; n; n = n.parentNode) {
                        if (arrayContains(ancestors, n)) {
                            return n;
                        }
                    }
                    return null;
                }
                function isAncestorOf(ancestor, descendant, selfIsAncestor) {
                    var n = selfIsAncestor ? descendant : descendant.parentNode;
                    while (n) {
                        if (n === ancestor) {
                            return true;
                        } else {
                            n = n.parentNode;
                        }
                    }
                    return false;
                }
                function isOrIsAncestorOf(ancestor, descendant) {
                    return isAncestorOf(ancestor, descendant, true);
                }
                function getClosestAncestorIn(node, ancestor, selfIsAncestor) {
                    var p, n = selfIsAncestor ? node : node.parentNode;
                    while (n) {
                        p = n.parentNode;
                        if (p === ancestor) {
                            return n;
                        }
                        n = p;
                    }
                    return null;
                }
                function isCharacterDataNode(node) {
                    var t = node.nodeType;
                    return t == 3 || t == 4 || t == 8;
                }
                function isTextOrCommentNode(node) {
                    if (!node) {
                        return false;
                    }
                    var t = node.nodeType;
                    return t == 3 || t == 8;
                }
                function insertAfter(node, precedingNode) {
                    var nextNode = precedingNode.nextSibling, parent = precedingNode.parentNode;
                    if (nextNode) {
                        parent.insertBefore(node, nextNode);
                    } else {
                        parent.appendChild(node);
                    }
                    return node;
                }
                function splitDataNode(node, index, positionsToPreserve) {
                    var newNode = node.cloneNode(false);
                    newNode.deleteData(0, index);
                    node.deleteData(index, node.length - index);
                    insertAfter(newNode, node);
                    if (positionsToPreserve) {
                        for (var i = 0, position; position = positionsToPreserve[i++]; ) {
                            if (position.node == node && position.offset > index) {
                                position.node = newNode;
                                position.offset -= index;
                            } else if (position.node == node.parentNode && position.offset > getNodeIndex(node)) {
                                ++position.offset;
                            }
                        }
                    }
                    return newNode;
                }
                function getDocument(node) {
                    if (node.nodeType == 9) {
                        return node;
                    } else if (typeof node.ownerDocument != UNDEF) {
                        return node.ownerDocument;
                    } else if (typeof node.document != UNDEF) {
                        return node.document;
                    } else if (node.parentNode) {
                        return getDocument(node.parentNode);
                    } else {
                        throw module.createError("getDocument: no document found for node");
                    }
                }
                function getWindow(node) {
                    var doc = getDocument(node);
                    if (typeof doc.defaultView != UNDEF) {
                        return doc.defaultView;
                    } else if (typeof doc.parentWindow != UNDEF) {
                        return doc.parentWindow;
                    } else {
                        throw module.createError("Cannot get a window object for node");
                    }
                }
                function getIframeDocument(iframeEl) {
                    if (typeof iframeEl.contentDocument != UNDEF) {
                        return iframeEl.contentDocument;
                    } else if (typeof iframeEl.contentWindow != UNDEF) {
                        return iframeEl.contentWindow.document;
                    } else {
                        throw module.createError("getIframeDocument: No Document object found for iframe element");
                    }
                }
                function getIframeWindow(iframeEl) {
                    if (typeof iframeEl.contentWindow != UNDEF) {
                        return iframeEl.contentWindow;
                    } else if (typeof iframeEl.contentDocument != UNDEF) {
                        return iframeEl.contentDocument.defaultView;
                    } else {
                        throw module.createError("getIframeWindow: No Window object found for iframe element");
                    }
                }
                function isWindow(obj) {
                    return obj && util.isHostMethod(obj, "setTimeout") && util.isHostObject(obj, "document");
                }
                function getContentDocument(obj, module, methodName) {
                    var doc;
                    if (!obj) {
                        doc = document;
                    } else if (util.isHostProperty(obj, "nodeType")) {
                        doc = obj.nodeType == 1 && obj.tagName.toLowerCase() == "iframe" ? getIframeDocument(obj) : getDocument(obj);
                    } else if (isWindow(obj)) {
                        doc = obj.document;
                    }
                    if (!doc) {
                        throw module.createError(methodName + "(): Parameter must be a Window object or DOM node");
                    }
                    return doc;
                }
                function getRootContainer(node) {
                    var parent;
                    while (parent = node.parentNode) {
                        node = parent;
                    }
                    return node;
                }
                function comparePoints(nodeA, offsetA, nodeB, offsetB) {
                    var nodeC, root, childA, childB, n;
                    if (nodeA == nodeB) {
                        return offsetA === offsetB ? 0 : offsetA < offsetB ? -1 : 1;
                    } else if (nodeC = getClosestAncestorIn(nodeB, nodeA, true)) {
                        return offsetA <= getNodeIndex(nodeC) ? -1 : 1;
                    } else if (nodeC = getClosestAncestorIn(nodeA, nodeB, true)) {
                        return getNodeIndex(nodeC) < offsetB ? -1 : 1;
                    } else {
                        root = getCommonAncestor(nodeA, nodeB);
                        if (!root) {
                            throw new Error("comparePoints error: nodes have no common ancestor");
                        }
                        childA = nodeA === root ? root : getClosestAncestorIn(nodeA, root, true);
                        childB = nodeB === root ? root : getClosestAncestorIn(nodeB, root, true);
                        if (childA === childB) {
                            throw module.createError("comparePoints got to case 4 and childA and childB are the same!");
                        } else {
                            n = root.firstChild;
                            while (n) {
                                if (n === childA) {
                                    return -1;
                                } else if (n === childB) {
                                    return 1;
                                }
                                n = n.nextSibling;
                            }
                        }
                    }
                }
                var crashyTextNodes = false;
                function isBrokenNode(node) {
                    try {
                        node.parentNode;
                        return false;
                    } catch (e) {
                        return true;
                    }
                }
                (function() {
                    var el = document.createElement("b");
                    el.innerHTML = "1";
                    var textNode = el.firstChild;
                    el.innerHTML = "<br>";
                    crashyTextNodes = isBrokenNode(textNode);
                    api.features.crashyTextNodes = crashyTextNodes;
                })();
                function inspectNode(node) {
                    if (!node) {
                        return "[No node]";
                    }
                    if (crashyTextNodes && isBrokenNode(node)) {
                        return "[Broken node]";
                    }
                    if (isCharacterDataNode(node)) {
                        return '"' + node.data + '"';
                    }
                    if (node.nodeType == 1) {
                        var idAttr = node.id ? ' id="' + node.id + '"' : "";
                        return "<" + node.nodeName + idAttr + ">[" + getNodeIndex(node) + "][" + node.childNodes.length + "][" + (node.innerHTML || "[innerHTML not supported]").slice(0, 25) + "]";
                    }
                    return node.nodeName;
                }
                function fragmentFromNodeChildren(node) {
                    var fragment = getDocument(node).createDocumentFragment(), child;
                    while (child = node.firstChild) {
                        fragment.appendChild(child);
                    }
                    return fragment;
                }
                var getComputedStyleProperty;
                if (typeof window.getComputedStyle != UNDEF) {
                    getComputedStyleProperty = function(el, propName) {
                        return getWindow(el).getComputedStyle(el, null)[propName];
                    };
                } else if (typeof document.documentElement.currentStyle != UNDEF) {
                    getComputedStyleProperty = function(el, propName) {
                        return el.currentStyle[propName];
                    };
                } else {
                    module.fail("No means of obtaining computed style properties found");
                }
                function NodeIterator(root) {
                    this.root = root;
                    this._next = root;
                }
                NodeIterator.prototype = {
                    _current: null,
                    hasNext: function() {
                        return !!this._next;
                    },
                    next: function() {
                        var n = this._current = this._next;
                        var child, next;
                        if (this._current) {
                            child = n.firstChild;
                            if (child) {
                                this._next = child;
                            } else {
                                next = null;
                                while (n !== this.root && !(next = n.nextSibling)) {
                                    n = n.parentNode;
                                }
                                this._next = next;
                            }
                        }
                        return this._current;
                    },
                    detach: function() {
                        this._current = this._next = this.root = null;
                    }
                };
                function createIterator(root) {
                    return new NodeIterator(root);
                }
                function DomPosition(node, offset) {
                    this.node = node;
                    this.offset = offset;
                }
                DomPosition.prototype = {
                    equals: function(pos) {
                        return !!pos && this.node === pos.node && this.offset == pos.offset;
                    },
                    inspect: function() {
                        return "[DomPosition(" + inspectNode(this.node) + ":" + this.offset + ")]";
                    },
                    toString: function() {
                        return this.inspect();
                    }
                };
                function DOMException(codeName) {
                    this.code = this[codeName];
                    this.codeName = codeName;
                    this.message = "DOMException: " + this.codeName;
                }
                DOMException.prototype = {
                    INDEX_SIZE_ERR: 1,
                    HIERARCHY_REQUEST_ERR: 3,
                    WRONG_DOCUMENT_ERR: 4,
                    NO_MODIFICATION_ALLOWED_ERR: 7,
                    NOT_FOUND_ERR: 8,
                    NOT_SUPPORTED_ERR: 9,
                    INVALID_STATE_ERR: 11
                };
                DOMException.prototype.toString = function() {
                    return this.message;
                };
                api.dom = {
                    arrayContains: arrayContains,
                    isHtmlNamespace: isHtmlNamespace,
                    parentElement: parentElement,
                    getNodeIndex: getNodeIndex,
                    getNodeLength: getNodeLength,
                    getCommonAncestor: getCommonAncestor,
                    isAncestorOf: isAncestorOf,
                    isOrIsAncestorOf: isOrIsAncestorOf,
                    getClosestAncestorIn: getClosestAncestorIn,
                    isCharacterDataNode: isCharacterDataNode,
                    isTextOrCommentNode: isTextOrCommentNode,
                    insertAfter: insertAfter,
                    splitDataNode: splitDataNode,
                    getDocument: getDocument,
                    getWindow: getWindow,
                    getIframeWindow: getIframeWindow,
                    getIframeDocument: getIframeDocument,
                    getBody: util.getBody,
                    isWindow: isWindow,
                    getContentDocument: getContentDocument,
                    getRootContainer: getRootContainer,
                    comparePoints: comparePoints,
                    isBrokenNode: isBrokenNode,
                    inspectNode: inspectNode,
                    getComputedStyleProperty: getComputedStyleProperty,
                    fragmentFromNodeChildren: fragmentFromNodeChildren,
                    createIterator: createIterator,
                    DomPosition: DomPosition
                };
                api.DOMException = DOMException;
            });
        }, {
            "./core": 11
        } ],
        13: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("./core");
            rangy.api.createCoreModule("DomRange", [ "DomUtil" ], function(api, module) {
                var dom = api.dom;
                var util = api.util;
                var DomPosition = dom.DomPosition;
                var DOMException = api.DOMException;
                var isCharacterDataNode = dom.isCharacterDataNode;
                var getNodeIndex = dom.getNodeIndex;
                var isOrIsAncestorOf = dom.isOrIsAncestorOf;
                var getDocument = dom.getDocument;
                var comparePoints = dom.comparePoints;
                var splitDataNode = dom.splitDataNode;
                var getClosestAncestorIn = dom.getClosestAncestorIn;
                var getNodeLength = dom.getNodeLength;
                var arrayContains = dom.arrayContains;
                var getRootContainer = dom.getRootContainer;
                var crashyTextNodes = api.features.crashyTextNodes;
                function isNonTextPartiallySelected(node, range) {
                    return node.nodeType != 3 && (isOrIsAncestorOf(node, range.startContainer) || isOrIsAncestorOf(node, range.endContainer));
                }
                function getRangeDocument(range) {
                    return range.document || getDocument(range.startContainer);
                }
                function getBoundaryBeforeNode(node) {
                    return new DomPosition(node.parentNode, getNodeIndex(node));
                }
                function getBoundaryAfterNode(node) {
                    return new DomPosition(node.parentNode, getNodeIndex(node) + 1);
                }
                function insertNodeAtPosition(node, n, o) {
                    var firstNodeInserted = node.nodeType == 11 ? node.firstChild : node;
                    if (isCharacterDataNode(n)) {
                        if (o == n.length) {
                            dom.insertAfter(node, n);
                        } else {
                            n.parentNode.insertBefore(node, o == 0 ? n : splitDataNode(n, o));
                        }
                    } else if (o >= n.childNodes.length) {
                        n.appendChild(node);
                    } else {
                        n.insertBefore(node, n.childNodes[o]);
                    }
                    return firstNodeInserted;
                }
                function rangesIntersect(rangeA, rangeB, touchingIsIntersecting) {
                    assertRangeValid(rangeA);
                    assertRangeValid(rangeB);
                    if (getRangeDocument(rangeB) != getRangeDocument(rangeA)) {
                        throw new DOMException("WRONG_DOCUMENT_ERR");
                    }
                    var startComparison = comparePoints(rangeA.startContainer, rangeA.startOffset, rangeB.endContainer, rangeB.endOffset), endComparison = comparePoints(rangeA.endContainer, rangeA.endOffset, rangeB.startContainer, rangeB.startOffset);
                    return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
                }
                function cloneSubtree(iterator) {
                    var partiallySelected;
                    for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
                        partiallySelected = iterator.isPartiallySelectedSubtree();
                        node = node.cloneNode(!partiallySelected);
                        if (partiallySelected) {
                            subIterator = iterator.getSubtreeIterator();
                            node.appendChild(cloneSubtree(subIterator));
                            subIterator.detach(true);
                        }
                        if (node.nodeType == 10) {
                            throw new DOMException("HIERARCHY_REQUEST_ERR");
                        }
                        frag.appendChild(node);
                    }
                    return frag;
                }
                function iterateSubtree(rangeIterator, func, iteratorState) {
                    var it, n;
                    iteratorState = iteratorState || {
                        stop: false
                    };
                    for (var node, subRangeIterator; node = rangeIterator.next(); ) {
                        if (rangeIterator.isPartiallySelectedSubtree()) {
                            if (func(node) === false) {
                                iteratorState.stop = true;
                                return;
                            } else {
                                subRangeIterator = rangeIterator.getSubtreeIterator();
                                iterateSubtree(subRangeIterator, func, iteratorState);
                                subRangeIterator.detach(true);
                                if (iteratorState.stop) {
                                    return;
                                }
                            }
                        } else {
                            it = dom.createIterator(node);
                            while (n = it.next()) {
                                if (func(n) === false) {
                                    iteratorState.stop = true;
                                    return;
                                }
                            }
                        }
                    }
                }
                function deleteSubtree(iterator) {
                    var subIterator;
                    while (iterator.next()) {
                        if (iterator.isPartiallySelectedSubtree()) {
                            subIterator = iterator.getSubtreeIterator();
                            deleteSubtree(subIterator);
                            subIterator.detach(true);
                        } else {
                            iterator.remove();
                        }
                    }
                }
                function extractSubtree(iterator) {
                    for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
                        if (iterator.isPartiallySelectedSubtree()) {
                            node = node.cloneNode(false);
                            subIterator = iterator.getSubtreeIterator();
                            node.appendChild(extractSubtree(subIterator));
                            subIterator.detach(true);
                        } else {
                            iterator.remove();
                        }
                        if (node.nodeType == 10) {
                            throw new DOMException("HIERARCHY_REQUEST_ERR");
                        }
                        frag.appendChild(node);
                    }
                    return frag;
                }
                function getNodesInRange(range, nodeTypes, filter) {
                    var filterNodeTypes = !!(nodeTypes && nodeTypes.length), regex;
                    var filterExists = !!filter;
                    if (filterNodeTypes) {
                        regex = new RegExp("^(" + nodeTypes.join("|") + ")$");
                    }
                    var nodes = [];
                    iterateSubtree(new RangeIterator(range, false), function(node) {
                        if (filterNodeTypes && !regex.test(node.nodeType)) {
                            return;
                        }
                        if (filterExists && !filter(node)) {
                            return;
                        }
                        var sc = range.startContainer;
                        if (node == sc && isCharacterDataNode(sc) && range.startOffset == sc.length) {
                            return;
                        }
                        var ec = range.endContainer;
                        if (node == ec && isCharacterDataNode(ec) && range.endOffset == 0) {
                            return;
                        }
                        nodes.push(node);
                    });
                    return nodes;
                }
                function inspect(range) {
                    var name = typeof range.getName == "undefined" ? "Range" : range.getName();
                    return "[" + name + "(" + dom.inspectNode(range.startContainer) + ":" + range.startOffset + ", " + dom.inspectNode(range.endContainer) + ":" + range.endOffset + ")]";
                }
                function RangeIterator(range, clonePartiallySelectedTextNodes) {
                    this.range = range;
                    this.clonePartiallySelectedTextNodes = clonePartiallySelectedTextNodes;
                    if (!range.collapsed) {
                        this.sc = range.startContainer;
                        this.so = range.startOffset;
                        this.ec = range.endContainer;
                        this.eo = range.endOffset;
                        var root = range.commonAncestorContainer;
                        if (this.sc === this.ec && isCharacterDataNode(this.sc)) {
                            this.isSingleCharacterDataNode = true;
                            this._first = this._last = this._next = this.sc;
                        } else {
                            this._first = this._next = this.sc === root && !isCharacterDataNode(this.sc) ? this.sc.childNodes[this.so] : getClosestAncestorIn(this.sc, root, true);
                            this._last = this.ec === root && !isCharacterDataNode(this.ec) ? this.ec.childNodes[this.eo - 1] : getClosestAncestorIn(this.ec, root, true);
                        }
                    }
                }
                RangeIterator.prototype = {
                    _current: null,
                    _next: null,
                    _first: null,
                    _last: null,
                    isSingleCharacterDataNode: false,
                    reset: function() {
                        this._current = null;
                        this._next = this._first;
                    },
                    hasNext: function() {
                        return !!this._next;
                    },
                    next: function() {
                        var current = this._current = this._next;
                        if (current) {
                            this._next = current !== this._last ? current.nextSibling : null;
                            if (isCharacterDataNode(current) && this.clonePartiallySelectedTextNodes) {
                                if (current === this.ec) {
                                    (current = current.cloneNode(true)).deleteData(this.eo, current.length - this.eo);
                                }
                                if (this._current === this.sc) {
                                    (current = current.cloneNode(true)).deleteData(0, this.so);
                                }
                            }
                        }
                        return current;
                    },
                    remove: function() {
                        var current = this._current, start, end;
                        if (isCharacterDataNode(current) && (current === this.sc || current === this.ec)) {
                            start = current === this.sc ? this.so : 0;
                            end = current === this.ec ? this.eo : current.length;
                            if (start != end) {
                                current.deleteData(start, end - start);
                            }
                        } else {
                            if (current.parentNode) {
                                current.parentNode.removeChild(current);
                            } else {}
                        }
                    },
                    isPartiallySelectedSubtree: function() {
                        var current = this._current;
                        return isNonTextPartiallySelected(current, this.range);
                    },
                    getSubtreeIterator: function() {
                        var subRange;
                        if (this.isSingleCharacterDataNode) {
                            subRange = this.range.cloneRange();
                            subRange.collapse(false);
                        } else {
                            subRange = new Range(getRangeDocument(this.range));
                            var current = this._current;
                            var startContainer = current, startOffset = 0, endContainer = current, endOffset = getNodeLength(current);
                            if (isOrIsAncestorOf(current, this.sc)) {
                                startContainer = this.sc;
                                startOffset = this.so;
                            }
                            if (isOrIsAncestorOf(current, this.ec)) {
                                endContainer = this.ec;
                                endOffset = this.eo;
                            }
                            updateBoundaries(subRange, startContainer, startOffset, endContainer, endOffset);
                        }
                        return new RangeIterator(subRange, this.clonePartiallySelectedTextNodes);
                    },
                    detach: function(detachRange) {
                        if (detachRange) {
                            this.range.detach();
                        }
                        this.range = this._current = this._next = this._first = this._last = this.sc = this.so = this.ec = this.eo = null;
                    }
                };
                function RangeException(codeName) {
                    this.code = this[codeName];
                    this.codeName = codeName;
                    this.message = "RangeException: " + this.codeName;
                }
                RangeException.prototype = {
                    BAD_BOUNDARYPOINTS_ERR: 1,
                    INVALID_NODE_TYPE_ERR: 2
                };
                RangeException.prototype.toString = function() {
                    return this.message;
                };
                var beforeAfterNodeTypes = [ 1, 3, 4, 5, 7, 8, 10 ];
                var rootContainerNodeTypes = [ 2, 9, 11 ];
                var readonlyNodeTypes = [ 5, 6, 10, 12 ];
                var insertableNodeTypes = [ 1, 3, 4, 5, 7, 8, 10, 11 ];
                var surroundNodeTypes = [ 1, 3, 4, 5, 7, 8 ];
                function createAncestorFinder(nodeTypes) {
                    return function(node, selfIsAncestor) {
                        var t, n = selfIsAncestor ? node : node.parentNode;
                        while (n) {
                            t = n.nodeType;
                            if (arrayContains(nodeTypes, t)) {
                                return n;
                            }
                            n = n.parentNode;
                        }
                        return null;
                    };
                }
                var getDocumentOrFragmentContainer = createAncestorFinder([ 9, 11 ]);
                var getReadonlyAncestor = createAncestorFinder(readonlyNodeTypes);
                var getDocTypeNotationEntityAncestor = createAncestorFinder([ 6, 10, 12 ]);
                function assertNoDocTypeNotationEntityAncestor(node, allowSelf) {
                    if (getDocTypeNotationEntityAncestor(node, allowSelf)) {
                        throw new RangeException("INVALID_NODE_TYPE_ERR");
                    }
                }
                function assertNotDetached(range) {
                    if (!range.startContainer) {
                        throw new DOMException("INVALID_STATE_ERR");
                    }
                }
                function assertValidNodeType(node, invalidTypes) {
                    if (!arrayContains(invalidTypes, node.nodeType)) {
                        throw new RangeException("INVALID_NODE_TYPE_ERR");
                    }
                }
                function assertValidOffset(node, offset) {
                    if (offset < 0 || offset > (isCharacterDataNode(node) ? node.length : node.childNodes.length)) {
                        throw new DOMException("INDEX_SIZE_ERR");
                    }
                }
                function assertSameDocumentOrFragment(node1, node2) {
                    if (getDocumentOrFragmentContainer(node1, true) !== getDocumentOrFragmentContainer(node2, true)) {
                        throw new DOMException("WRONG_DOCUMENT_ERR");
                    }
                }
                function assertNodeNotReadOnly(node) {
                    if (getReadonlyAncestor(node, true)) {
                        throw new DOMException("NO_MODIFICATION_ALLOWED_ERR");
                    }
                }
                function assertNode(node, codeName) {
                    if (!node) {
                        throw new DOMException(codeName);
                    }
                }
                function isOrphan(node) {
                    return crashyTextNodes && dom.isBrokenNode(node) || !arrayContains(rootContainerNodeTypes, node.nodeType) && !getDocumentOrFragmentContainer(node, true);
                }
                function isValidOffset(node, offset) {
                    return offset <= (isCharacterDataNode(node) ? node.length : node.childNodes.length);
                }
                function isRangeValid(range) {
                    return !!range.startContainer && !!range.endContainer && !isOrphan(range.startContainer) && !isOrphan(range.endContainer) && isValidOffset(range.startContainer, range.startOffset) && isValidOffset(range.endContainer, range.endOffset);
                }
                function assertRangeValid(range) {
                    assertNotDetached(range);
                    if (!isRangeValid(range)) {
                        throw new Error("Range error: Range is no longer valid after DOM mutation (" + range.inspect() + ")");
                    }
                }
                var styleEl = document.createElement("style");
                var htmlParsingConforms = false;
                try {
                    styleEl.innerHTML = "<b>x</b>";
                    htmlParsingConforms = styleEl.firstChild.nodeType == 3;
                } catch (e) {}
                api.features.htmlParsingConforms = htmlParsingConforms;
                var createContextualFragment = htmlParsingConforms ? function(fragmentStr) {
                    var node = this.startContainer;
                    var doc = getDocument(node);
                    if (!node) {
                        throw new DOMException("INVALID_STATE_ERR");
                    }
                    var el = null;
                    if (node.nodeType == 1) {
                        el = node;
                    } else if (isCharacterDataNode(node)) {
                        el = dom.parentElement(node);
                    }
                    if (el === null || el.nodeName == "HTML" && dom.isHtmlNamespace(getDocument(el).documentElement) && dom.isHtmlNamespace(el)) {
                        el = doc.createElement("body");
                    } else {
                        el = el.cloneNode(false);
                    }
                    el.innerHTML = fragmentStr;
                    return dom.fragmentFromNodeChildren(el);
                } : function(fragmentStr) {
                    assertNotDetached(this);
                    var doc = getRangeDocument(this);
                    var el = doc.createElement("body");
                    el.innerHTML = fragmentStr;
                    return dom.fragmentFromNodeChildren(el);
                };
                function splitRangeBoundaries(range, positionsToPreserve) {
                    assertRangeValid(range);
                    var sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
                    var startEndSame = sc === ec;
                    if (isCharacterDataNode(ec) && eo > 0 && eo < ec.length) {
                        splitDataNode(ec, eo, positionsToPreserve);
                    }
                    if (isCharacterDataNode(sc) && so > 0 && so < sc.length) {
                        sc = splitDataNode(sc, so, positionsToPreserve);
                        if (startEndSame) {
                            eo -= so;
                            ec = sc;
                        } else if (ec == sc.parentNode && eo >= getNodeIndex(sc)) {
                            eo++;
                        }
                        so = 0;
                    }
                    range.setStartAndEnd(sc, so, ec, eo);
                }
                var rangeProperties = [ "startContainer", "startOffset", "endContainer", "endOffset", "collapsed", "commonAncestorContainer" ];
                var s2s = 0, s2e = 1, e2e = 2, e2s = 3;
                var n_b = 0, n_a = 1, n_b_a = 2, n_i = 3;
                util.extend(api.rangePrototype, {
                    compareBoundaryPoints: function(how, range) {
                        assertRangeValid(this);
                        assertSameDocumentOrFragment(this.startContainer, range.startContainer);
                        var nodeA, offsetA, nodeB, offsetB;
                        var prefixA = how == e2s || how == s2s ? "start" : "end";
                        var prefixB = how == s2e || how == s2s ? "start" : "end";
                        nodeA = this[prefixA + "Container"];
                        offsetA = this[prefixA + "Offset"];
                        nodeB = range[prefixB + "Container"];
                        offsetB = range[prefixB + "Offset"];
                        return comparePoints(nodeA, offsetA, nodeB, offsetB);
                    },
                    insertNode: function(node) {
                        assertRangeValid(this);
                        assertValidNodeType(node, insertableNodeTypes);
                        assertNodeNotReadOnly(this.startContainer);
                        if (isOrIsAncestorOf(node, this.startContainer)) {
                            throw new DOMException("HIERARCHY_REQUEST_ERR");
                        }
                        var firstNodeInserted = insertNodeAtPosition(node, this.startContainer, this.startOffset);
                        this.setStartBefore(firstNodeInserted);
                    },
                    cloneContents: function() {
                        assertRangeValid(this);
                        var clone, frag;
                        if (this.collapsed) {
                            return getRangeDocument(this).createDocumentFragment();
                        } else {
                            if (this.startContainer === this.endContainer && isCharacterDataNode(this.startContainer)) {
                                clone = this.startContainer.cloneNode(true);
                                clone.data = clone.data.slice(this.startOffset, this.endOffset);
                                frag = getRangeDocument(this).createDocumentFragment();
                                frag.appendChild(clone);
                                return frag;
                            } else {
                                var iterator = new RangeIterator(this, true);
                                clone = cloneSubtree(iterator);
                                iterator.detach();
                            }
                            return clone;
                        }
                    },
                    canSurroundContents: function() {
                        assertRangeValid(this);
                        assertNodeNotReadOnly(this.startContainer);
                        assertNodeNotReadOnly(this.endContainer);
                        var iterator = new RangeIterator(this, true);
                        var boundariesInvalid = iterator._first && isNonTextPartiallySelected(iterator._first, this) || iterator._last && isNonTextPartiallySelected(iterator._last, this);
                        iterator.detach();
                        return !boundariesInvalid;
                    },
                    surroundContents: function(node) {
                        assertValidNodeType(node, surroundNodeTypes);
                        if (!this.canSurroundContents()) {
                            throw new RangeException("BAD_BOUNDARYPOINTS_ERR");
                        }
                        var content = this.extractContents();
                        if (node.hasChildNodes()) {
                            while (node.lastChild) {
                                node.removeChild(node.lastChild);
                            }
                        }
                        insertNodeAtPosition(node, this.startContainer, this.startOffset);
                        node.appendChild(content);
                        this.selectNode(node);
                    },
                    cloneRange: function() {
                        assertRangeValid(this);
                        var range = new Range(getRangeDocument(this));
                        var i = rangeProperties.length, prop;
                        while (i--) {
                            prop = rangeProperties[i];
                            range[prop] = this[prop];
                        }
                        return range;
                    },
                    toString: function() {
                        assertRangeValid(this);
                        var sc = this.startContainer;
                        if (sc === this.endContainer && isCharacterDataNode(sc)) {
                            return sc.nodeType == 3 || sc.nodeType == 4 ? sc.data.slice(this.startOffset, this.endOffset) : "";
                        } else {
                            var textParts = [], iterator = new RangeIterator(this, true);
                            iterateSubtree(iterator, function(node) {
                                if (node.nodeType == 3 || node.nodeType == 4) {
                                    textParts.push(node.data);
                                }
                            });
                            iterator.detach();
                            return textParts.join("");
                        }
                    },
                    compareNode: function(node) {
                        assertRangeValid(this);
                        var parent = node.parentNode;
                        var nodeIndex = getNodeIndex(node);
                        if (!parent) {
                            throw new DOMException("NOT_FOUND_ERR");
                        }
                        var startComparison = this.comparePoint(parent, nodeIndex), endComparison = this.comparePoint(parent, nodeIndex + 1);
                        if (startComparison < 0) {
                            return endComparison > 0 ? n_b_a : n_b;
                        } else {
                            return endComparison > 0 ? n_a : n_i;
                        }
                    },
                    comparePoint: function(node, offset) {
                        assertRangeValid(this);
                        assertNode(node, "HIERARCHY_REQUEST_ERR");
                        assertSameDocumentOrFragment(node, this.startContainer);
                        if (comparePoints(node, offset, this.startContainer, this.startOffset) < 0) {
                            return -1;
                        } else if (comparePoints(node, offset, this.endContainer, this.endOffset) > 0) {
                            return 1;
                        }
                        return 0;
                    },
                    createContextualFragment: createContextualFragment,
                    toHtml: function() {
                        assertRangeValid(this);
                        var container = this.commonAncestorContainer.parentNode.cloneNode(false);
                        container.appendChild(this.cloneContents());
                        return container.innerHTML;
                    },
                    intersectsNode: function(node, touchingIsIntersecting) {
                        assertRangeValid(this);
                        assertNode(node, "NOT_FOUND_ERR");
                        if (getDocument(node) !== getRangeDocument(this)) {
                            return false;
                        }
                        var parent = node.parentNode, offset = getNodeIndex(node);
                        assertNode(parent, "NOT_FOUND_ERR");
                        var startComparison = comparePoints(parent, offset, this.endContainer, this.endOffset), endComparison = comparePoints(parent, offset + 1, this.startContainer, this.startOffset);
                        return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
                    },
                    isPointInRange: function(node, offset) {
                        assertRangeValid(this);
                        assertNode(node, "HIERARCHY_REQUEST_ERR");
                        assertSameDocumentOrFragment(node, this.startContainer);
                        return comparePoints(node, offset, this.startContainer, this.startOffset) >= 0 && comparePoints(node, offset, this.endContainer, this.endOffset) <= 0;
                    },
                    intersectsRange: function(range) {
                        return rangesIntersect(this, range, false);
                    },
                    intersectsOrTouchesRange: function(range) {
                        return rangesIntersect(this, range, true);
                    },
                    intersection: function(range) {
                        if (this.intersectsRange(range)) {
                            var startComparison = comparePoints(this.startContainer, this.startOffset, range.startContainer, range.startOffset), endComparison = comparePoints(this.endContainer, this.endOffset, range.endContainer, range.endOffset);
                            var intersectionRange = this.cloneRange();
                            if (startComparison == -1) {
                                intersectionRange.setStart(range.startContainer, range.startOffset);
                            }
                            if (endComparison == 1) {
                                intersectionRange.setEnd(range.endContainer, range.endOffset);
                            }
                            return intersectionRange;
                        }
                        return null;
                    },
                    union: function(range) {
                        if (this.intersectsOrTouchesRange(range)) {
                            var unionRange = this.cloneRange();
                            if (comparePoints(range.startContainer, range.startOffset, this.startContainer, this.startOffset) == -1) {
                                unionRange.setStart(range.startContainer, range.startOffset);
                            }
                            if (comparePoints(range.endContainer, range.endOffset, this.endContainer, this.endOffset) == 1) {
                                unionRange.setEnd(range.endContainer, range.endOffset);
                            }
                            return unionRange;
                        } else {
                            throw new RangeException("Ranges do not intersect");
                        }
                    },
                    containsNode: function(node, allowPartial) {
                        if (allowPartial) {
                            return this.intersectsNode(node, false);
                        } else {
                            return this.compareNode(node) == n_i;
                        }
                    },
                    containsNodeContents: function(node) {
                        return this.comparePoint(node, 0) >= 0 && this.comparePoint(node, getNodeLength(node)) <= 0;
                    },
                    containsRange: function(range) {
                        var intersection = this.intersection(range);
                        return intersection !== null && range.equals(intersection);
                    },
                    containsNodeText: function(node) {
                        var nodeRange = this.cloneRange();
                        nodeRange.selectNode(node);
                        var textNodes = nodeRange.getNodes([ 3 ]);
                        if (textNodes.length > 0) {
                            nodeRange.setStart(textNodes[0], 0);
                            var lastTextNode = textNodes.pop();
                            nodeRange.setEnd(lastTextNode, lastTextNode.length);
                            var contains = this.containsRange(nodeRange);
                            nodeRange.detach();
                            return contains;
                        } else {
                            return this.containsNodeContents(node);
                        }
                    },
                    getNodes: function(nodeTypes, filter) {
                        assertRangeValid(this);
                        return getNodesInRange(this, nodeTypes, filter);
                    },
                    getDocument: function() {
                        return getRangeDocument(this);
                    },
                    collapseBefore: function(node) {
                        assertNotDetached(this);
                        this.setEndBefore(node);
                        this.collapse(false);
                    },
                    collapseAfter: function(node) {
                        assertNotDetached(this);
                        this.setStartAfter(node);
                        this.collapse(true);
                    },
                    getBookmark: function(containerNode) {
                        var doc = getRangeDocument(this);
                        var preSelectionRange = api.createRange(doc);
                        containerNode = containerNode || dom.getBody(doc);
                        preSelectionRange.selectNodeContents(containerNode);
                        var range = this.intersection(preSelectionRange);
                        var start = 0, end = 0;
                        if (range) {
                            preSelectionRange.setEnd(range.startContainer, range.startOffset);
                            start = preSelectionRange.toString().length;
                            end = start + range.toString().length;
                            preSelectionRange.detach();
                        }
                        return {
                            start: start,
                            end: end,
                            containerNode: containerNode
                        };
                    },
                    moveToBookmark: function(bookmark) {
                        var containerNode = bookmark.containerNode;
                        var charIndex = 0;
                        this.setStart(containerNode, 0);
                        this.collapse(true);
                        var nodeStack = [ containerNode ], node, foundStart = false, stop = false;
                        var nextCharIndex, i, childNodes;
                        while (!stop && (node = nodeStack.pop())) {
                            if (node.nodeType == 3) {
                                nextCharIndex = charIndex + node.length;
                                if (!foundStart && bookmark.start >= charIndex && bookmark.start <= nextCharIndex) {
                                    this.setStart(node, bookmark.start - charIndex);
                                    foundStart = true;
                                }
                                if (foundStart && bookmark.end >= charIndex && bookmark.end <= nextCharIndex) {
                                    this.setEnd(node, bookmark.end - charIndex);
                                    stop = true;
                                }
                                charIndex = nextCharIndex;
                            } else {
                                childNodes = node.childNodes;
                                i = childNodes.length;
                                while (i--) {
                                    nodeStack.push(childNodes[i]);
                                }
                            }
                        }
                    },
                    getName: function() {
                        return "DomRange";
                    },
                    equals: function(range) {
                        return Range.rangesEqual(this, range);
                    },
                    isValid: function() {
                        return isRangeValid(this);
                    },
                    inspect: function() {
                        return inspect(this);
                    }
                });
                function copyComparisonConstantsToObject(obj) {
                    obj.START_TO_START = s2s;
                    obj.START_TO_END = s2e;
                    obj.END_TO_END = e2e;
                    obj.END_TO_START = e2s;
                    obj.NODE_BEFORE = n_b;
                    obj.NODE_AFTER = n_a;
                    obj.NODE_BEFORE_AND_AFTER = n_b_a;
                    obj.NODE_INSIDE = n_i;
                }
                function copyComparisonConstants(constructor) {
                    copyComparisonConstantsToObject(constructor);
                    copyComparisonConstantsToObject(constructor.prototype);
                }
                function createRangeContentRemover(remover, boundaryUpdater) {
                    return function() {
                        assertRangeValid(this);
                        var sc = this.startContainer, so = this.startOffset, root = this.commonAncestorContainer;
                        var iterator = new RangeIterator(this, true);
                        var node, boundary;
                        if (sc !== root) {
                            node = getClosestAncestorIn(sc, root, true);
                            boundary = getBoundaryAfterNode(node);
                            sc = boundary.node;
                            so = boundary.offset;
                        }
                        iterateSubtree(iterator, assertNodeNotReadOnly);
                        iterator.reset();
                        var returnValue = remover(iterator);
                        iterator.detach();
                        boundaryUpdater(this, sc, so, sc, so);
                        return returnValue;
                    };
                }
                function createPrototypeRange(constructor, boundaryUpdater, detacher) {
                    function createBeforeAfterNodeSetter(isBefore, isStart) {
                        return function(node) {
                            assertNotDetached(this);
                            assertValidNodeType(node, beforeAfterNodeTypes);
                            assertValidNodeType(getRootContainer(node), rootContainerNodeTypes);
                            var boundary = (isBefore ? getBoundaryBeforeNode : getBoundaryAfterNode)(node);
                            (isStart ? setRangeStart : setRangeEnd)(this, boundary.node, boundary.offset);
                        };
                    }
                    function setRangeStart(range, node, offset) {
                        var ec = range.endContainer, eo = range.endOffset;
                        if (node !== range.startContainer || offset !== range.startOffset) {
                            if (getRootContainer(node) != getRootContainer(ec) || comparePoints(node, offset, ec, eo) == 1) {
                                ec = node;
                                eo = offset;
                            }
                            boundaryUpdater(range, node, offset, ec, eo);
                        }
                    }
                    function setRangeEnd(range, node, offset) {
                        var sc = range.startContainer, so = range.startOffset;
                        if (node !== range.endContainer || offset !== range.endOffset) {
                            if (getRootContainer(node) != getRootContainer(sc) || comparePoints(node, offset, sc, so) == -1) {
                                sc = node;
                                so = offset;
                            }
                            boundaryUpdater(range, sc, so, node, offset);
                        }
                    }
                    var F = function() {};
                    F.prototype = api.rangePrototype;
                    constructor.prototype = new F();
                    util.extend(constructor.prototype, {
                        setStart: function(node, offset) {
                            assertNotDetached(this);
                            assertNoDocTypeNotationEntityAncestor(node, true);
                            assertValidOffset(node, offset);
                            setRangeStart(this, node, offset);
                        },
                        setEnd: function(node, offset) {
                            assertNotDetached(this);
                            assertNoDocTypeNotationEntityAncestor(node, true);
                            assertValidOffset(node, offset);
                            setRangeEnd(this, node, offset);
                        },
                        setStartAndEnd: function() {
                            assertNotDetached(this);
                            var args = arguments;
                            var sc = args[0], so = args[1], ec = sc, eo = so;
                            switch (args.length) {
                              case 3:
                                eo = args[2];
                                break;

                              case 4:
                                ec = args[2];
                                eo = args[3];
                                break;
                            }
                            boundaryUpdater(this, sc, so, ec, eo);
                        },
                        setBoundary: function(node, offset, isStart) {
                            this["set" + (isStart ? "Start" : "End")](node, offset);
                        },
                        setStartBefore: createBeforeAfterNodeSetter(true, true),
                        setStartAfter: createBeforeAfterNodeSetter(false, true),
                        setEndBefore: createBeforeAfterNodeSetter(true, false),
                        setEndAfter: createBeforeAfterNodeSetter(false, false),
                        collapse: function(isStart) {
                            assertRangeValid(this);
                            if (isStart) {
                                boundaryUpdater(this, this.startContainer, this.startOffset, this.startContainer, this.startOffset);
                            } else {
                                boundaryUpdater(this, this.endContainer, this.endOffset, this.endContainer, this.endOffset);
                            }
                        },
                        selectNodeContents: function(node) {
                            assertNotDetached(this);
                            assertNoDocTypeNotationEntityAncestor(node, true);
                            boundaryUpdater(this, node, 0, node, getNodeLength(node));
                        },
                        selectNode: function(node) {
                            assertNotDetached(this);
                            assertNoDocTypeNotationEntityAncestor(node, false);
                            assertValidNodeType(node, beforeAfterNodeTypes);
                            var start = getBoundaryBeforeNode(node), end = getBoundaryAfterNode(node);
                            boundaryUpdater(this, start.node, start.offset, end.node, end.offset);
                        },
                        extractContents: createRangeContentRemover(extractSubtree, boundaryUpdater),
                        deleteContents: createRangeContentRemover(deleteSubtree, boundaryUpdater),
                        canSurroundContents: function() {
                            assertRangeValid(this);
                            assertNodeNotReadOnly(this.startContainer);
                            assertNodeNotReadOnly(this.endContainer);
                            var iterator = new RangeIterator(this, true);
                            var boundariesInvalid = iterator._first && isNonTextPartiallySelected(iterator._first, this) || iterator._last && isNonTextPartiallySelected(iterator._last, this);
                            iterator.detach();
                            return !boundariesInvalid;
                        },
                        detach: function() {
                            detacher(this);
                        },
                        splitBoundaries: function() {
                            splitRangeBoundaries(this);
                        },
                        splitBoundariesPreservingPositions: function(positionsToPreserve) {
                            splitRangeBoundaries(this, positionsToPreserve);
                        },
                        normalizeBoundaries: function() {
                            assertRangeValid(this);
                            var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;
                            var mergeForward = function(node) {
                                var sibling = node.nextSibling;
                                if (sibling && sibling.nodeType == node.nodeType) {
                                    ec = node;
                                    eo = node.length;
                                    node.appendData(sibling.data);
                                    sibling.parentNode.removeChild(sibling);
                                }
                            };
                            var mergeBackward = function(node) {
                                var sibling = node.previousSibling;
                                if (sibling && sibling.nodeType == node.nodeType) {
                                    sc = node;
                                    var nodeLength = node.length;
                                    so = sibling.length;
                                    node.insertData(0, sibling.data);
                                    sibling.parentNode.removeChild(sibling);
                                    if (sc == ec) {
                                        eo += so;
                                        ec = sc;
                                    } else if (ec == node.parentNode) {
                                        var nodeIndex = getNodeIndex(node);
                                        if (eo == nodeIndex) {
                                            ec = node;
                                            eo = nodeLength;
                                        } else if (eo > nodeIndex) {
                                            eo--;
                                        }
                                    }
                                }
                            };
                            var normalizeStart = true;
                            if (isCharacterDataNode(ec)) {
                                if (ec.length == eo) {
                                    mergeForward(ec);
                                }
                            } else {
                                if (eo > 0) {
                                    var endNode = ec.childNodes[eo - 1];
                                    if (endNode && isCharacterDataNode(endNode)) {
                                        mergeForward(endNode);
                                    }
                                }
                                normalizeStart = !this.collapsed;
                            }
                            if (normalizeStart) {
                                if (isCharacterDataNode(sc)) {
                                    if (so == 0) {
                                        mergeBackward(sc);
                                    }
                                } else {
                                    if (so < sc.childNodes.length) {
                                        var startNode = sc.childNodes[so];
                                        if (startNode && isCharacterDataNode(startNode)) {
                                            mergeBackward(startNode);
                                        }
                                    }
                                }
                            } else {
                                sc = ec;
                                so = eo;
                            }
                            boundaryUpdater(this, sc, so, ec, eo);
                        },
                        collapseToPoint: function(node, offset) {
                            assertNotDetached(this);
                            assertNoDocTypeNotationEntityAncestor(node, true);
                            assertValidOffset(node, offset);
                            this.setStartAndEnd(node, offset);
                        }
                    });
                    copyComparisonConstants(constructor);
                }
                function updateCollapsedAndCommonAncestor(range) {
                    range.collapsed = range.startContainer === range.endContainer && range.startOffset === range.endOffset;
                    range.commonAncestorContainer = range.collapsed ? range.startContainer : dom.getCommonAncestor(range.startContainer, range.endContainer);
                }
                function updateBoundaries(range, startContainer, startOffset, endContainer, endOffset) {
                    range.startContainer = startContainer;
                    range.startOffset = startOffset;
                    range.endContainer = endContainer;
                    range.endOffset = endOffset;
                    range.document = dom.getDocument(startContainer);
                    updateCollapsedAndCommonAncestor(range);
                }
                function detach(range) {
                    assertNotDetached(range);
                    range.startContainer = range.startOffset = range.endContainer = range.endOffset = range.document = null;
                    range.collapsed = range.commonAncestorContainer = null;
                }
                function Range(doc) {
                    this.startContainer = doc;
                    this.startOffset = 0;
                    this.endContainer = doc;
                    this.endOffset = 0;
                    this.document = doc;
                    updateCollapsedAndCommonAncestor(this);
                }
                createPrototypeRange(Range, updateBoundaries, detach);
                util.extend(Range, {
                    rangeProperties: rangeProperties,
                    RangeIterator: RangeIterator,
                    copyComparisonConstants: copyComparisonConstants,
                    createPrototypeRange: createPrototypeRange,
                    inspect: inspect,
                    getRangeDocument: getRangeDocument,
                    rangesEqual: function(r1, r2) {
                        return r1.startContainer === r2.startContainer && r1.startOffset === r2.startOffset && r1.endContainer === r2.endContainer && r1.endOffset === r2.endOffset;
                    }
                });
                api.DomRange = Range;
                api.RangeException = RangeException;
            });
        }, {
            "./core": 11
        } ],
        14: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("./core");
            rangy.api.createModule("SaveRestore", [ "WrappedRange" ], function(api, module) {
                var dom = api.dom;
                var markerTextChar = "﻿";
                function gEBI(id, doc) {
                    return (doc || document).getElementById(id);
                }
                function insertRangeBoundaryMarker(range, atStart) {
                    var markerId = "selectionBoundary_" + +new Date() + "_" + ("" + Math.random()).slice(2);
                    var markerEl;
                    var doc = dom.getDocument(range.startContainer);
                    var boundaryRange = range.cloneRange();
                    boundaryRange.collapse(atStart);
                    markerEl = doc.createElement("span");
                    markerEl.id = markerId;
                    markerEl.style.lineHeight = "0";
                    markerEl.style.display = "none";
                    markerEl.className = "rangySelectionBoundary";
                    markerEl.appendChild(doc.createTextNode(markerTextChar));
                    boundaryRange.insertNode(markerEl);
                    boundaryRange.detach();
                    return markerEl;
                }
                function setRangeBoundary(doc, range, markerId, atStart) {
                    var markerEl = gEBI(markerId, doc);
                    if (markerEl) {
                        range[atStart ? "setStartBefore" : "setEndBefore"](markerEl);
                        markerEl.parentNode.removeChild(markerEl);
                    } else {
                        module.warn("Marker element has been removed. Cannot restore selection.");
                    }
                }
                function compareRanges(r1, r2) {
                    return r2.compareBoundaryPoints(r1.START_TO_START, r1);
                }
                function saveRange(range, backward) {
                    var startEl, endEl, doc = api.DomRange.getRangeDocument(range), text = range.toString();
                    if (range.collapsed) {
                        endEl = insertRangeBoundaryMarker(range, false);
                        return {
                            document: doc,
                            markerId: endEl.id,
                            collapsed: true
                        };
                    } else {
                        endEl = insertRangeBoundaryMarker(range, false);
                        startEl = insertRangeBoundaryMarker(range, true);
                        return {
                            document: doc,
                            startMarkerId: startEl.id,
                            endMarkerId: endEl.id,
                            collapsed: false,
                            backward: backward,
                            toString: function() {
                                return "original text: '" + text + "', new text: '" + range.toString() + "'";
                            }
                        };
                    }
                }
                function restoreRange(rangeInfo, normalize) {
                    var doc = rangeInfo.document;
                    if (typeof normalize == "undefined") {
                        normalize = true;
                    }
                    var range = api.createRange(doc);
                    if (rangeInfo.collapsed) {
                        var markerEl = gEBI(rangeInfo.markerId, doc);
                        if (markerEl) {
                            markerEl.style.display = "inline";
                            var previousNode = markerEl.previousSibling;
                            if (previousNode && previousNode.nodeType == 3) {
                                markerEl.parentNode.removeChild(markerEl);
                                range.collapseToPoint(previousNode, previousNode.length);
                            } else {
                                range.collapseBefore(markerEl);
                                markerEl.parentNode.removeChild(markerEl);
                            }
                        } else {
                            module.warn("Marker element has been removed. Cannot restore selection.");
                        }
                    } else {
                        setRangeBoundary(doc, range, rangeInfo.startMarkerId, true);
                        setRangeBoundary(doc, range, rangeInfo.endMarkerId, false);
                    }
                    if (normalize) {
                        range.normalizeBoundaries();
                    }
                    return range;
                }
                function saveRanges(ranges, backward) {
                    var rangeInfos = [], range, doc;
                    ranges = ranges.slice(0);
                    ranges.sort(compareRanges);
                    for (var i = 0, len = ranges.length; i < len; ++i) {
                        rangeInfos[i] = saveRange(ranges[i], backward);
                    }
                    for (i = len - 1; i >= 0; --i) {
                        range = ranges[i];
                        doc = api.DomRange.getRangeDocument(range);
                        if (range.collapsed) {
                            range.collapseAfter(gEBI(rangeInfos[i].markerId, doc));
                        } else {
                            range.setEndBefore(gEBI(rangeInfos[i].endMarkerId, doc));
                            range.setStartAfter(gEBI(rangeInfos[i].startMarkerId, doc));
                        }
                    }
                    return rangeInfos;
                }
                function saveSelection(win) {
                    if (!api.isSelectionValid(win)) {
                        module.warn("Cannot save selection. This usually happens when the selection is collapsed and the selection document has lost focus.");
                        return null;
                    }
                    var sel = api.getSelection(win);
                    var ranges = sel.getAllRanges();
                    var backward = ranges.length == 1 && sel.isBackward();
                    var rangeInfos = saveRanges(ranges, backward);
                    if (backward) {
                        sel.setSingleRange(ranges[0], "backward");
                    } else {
                        sel.setRanges(ranges);
                    }
                    return {
                        win: win,
                        rangeInfos: rangeInfos,
                        restored: false
                    };
                }
                function restoreRanges(rangeInfos) {
                    var ranges = [];
                    var rangeCount = rangeInfos.length;
                    for (var i = rangeCount - 1; i >= 0; i--) {
                        ranges[i] = restoreRange(rangeInfos[i], true);
                    }
                    return ranges;
                }
                function restoreSelection(savedSelection, preserveDirection) {
                    if (!savedSelection.restored) {
                        var rangeInfos = savedSelection.rangeInfos;
                        var sel = api.getSelection(savedSelection.win);
                        var ranges = restoreRanges(rangeInfos), rangeCount = rangeInfos.length;
                        if (rangeCount == 1 && preserveDirection && api.features.selectionHasExtend && rangeInfos[0].backward) {
                            sel.removeAllRanges();
                            sel.addRange(ranges[0], true);
                        } else {
                            sel.setRanges(ranges);
                        }
                        savedSelection.restored = true;
                    }
                }
                function removeMarkerElement(doc, markerId) {
                    var markerEl = gEBI(markerId, doc);
                    if (markerEl) {
                        markerEl.parentNode.removeChild(markerEl);
                    }
                }
                function removeMarkers(savedSelection) {
                    var rangeInfos = savedSelection.rangeInfos;
                    for (var i = 0, len = rangeInfos.length, rangeInfo; i < len; ++i) {
                        rangeInfo = rangeInfos[i];
                        if (rangeInfo.collapsed) {
                            removeMarkerElement(savedSelection.doc, rangeInfo.markerId);
                        } else {
                            removeMarkerElement(savedSelection.doc, rangeInfo.startMarkerId);
                            removeMarkerElement(savedSelection.doc, rangeInfo.endMarkerId);
                        }
                    }
                }
                api.util.extend(api, {
                    saveRange: saveRange,
                    restoreRange: restoreRange,
                    saveRanges: saveRanges,
                    restoreRanges: restoreRanges,
                    saveSelection: saveSelection,
                    restoreSelection: restoreSelection,
                    removeMarkerElement: removeMarkerElement,
                    removeMarkers: removeMarkers
                });
            });
        }, {
            "./core": 11
        } ],
        15: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("./core");
            rangy.api.createCoreModule("WrappedRange", [ "DomRange" ], function(api, module) {
                var WrappedRange, WrappedTextRange;
                var dom = api.dom;
                var util = api.util;
                var DomPosition = dom.DomPosition;
                var DomRange = api.DomRange;
                var getBody = dom.getBody;
                var getContentDocument = dom.getContentDocument;
                var isCharacterDataNode = dom.isCharacterDataNode;
                if (api.features.implementsDomRange) {
                    (function() {
                        var rangeProto;
                        var rangeProperties = DomRange.rangeProperties;
                        function updateRangeProperties(range) {
                            var i = rangeProperties.length, prop;
                            while (i--) {
                                prop = rangeProperties[i];
                                range[prop] = range.nativeRange[prop];
                            }
                            range.collapsed = range.startContainer === range.endContainer && range.startOffset === range.endOffset;
                        }
                        function updateNativeRange(range, startContainer, startOffset, endContainer, endOffset) {
                            var startMoved = range.startContainer !== startContainer || range.startOffset != startOffset;
                            var endMoved = range.endContainer !== endContainer || range.endOffset != endOffset;
                            var nativeRangeDifferent = !range.equals(range.nativeRange);
                            if (startMoved || endMoved || nativeRangeDifferent) {
                                range.setEnd(endContainer, endOffset);
                                range.setStart(startContainer, startOffset);
                            }
                        }
                        function detach(range) {
                            range.nativeRange.detach();
                            range.detached = true;
                            var i = rangeProperties.length;
                            while (i--) {
                                range[rangeProperties[i]] = null;
                            }
                        }
                        var createBeforeAfterNodeSetter;
                        WrappedRange = function(range) {
                            if (!range) {
                                throw module.createError("WrappedRange: Range must be specified");
                            }
                            this.nativeRange = range;
                            updateRangeProperties(this);
                        };
                        DomRange.createPrototypeRange(WrappedRange, updateNativeRange, detach);
                        rangeProto = WrappedRange.prototype;
                        rangeProto.selectNode = function(node) {
                            this.nativeRange.selectNode(node);
                            updateRangeProperties(this);
                        };
                        rangeProto.cloneContents = function() {
                            return this.nativeRange.cloneContents();
                        };
                        rangeProto.surroundContents = function(node) {
                            this.nativeRange.surroundContents(node);
                            updateRangeProperties(this);
                        };
                        rangeProto.collapse = function(isStart) {
                            this.nativeRange.collapse(isStart);
                            updateRangeProperties(this);
                        };
                        rangeProto.cloneRange = function() {
                            return new WrappedRange(this.nativeRange.cloneRange());
                        };
                        rangeProto.refresh = function() {
                            updateRangeProperties(this);
                        };
                        rangeProto.toString = function() {
                            return this.nativeRange.toString();
                        };
                        var testTextNode = document.createTextNode("test");
                        getBody(document).appendChild(testTextNode);
                        var range = document.createRange();
                        range.setStart(testTextNode, 0);
                        range.setEnd(testTextNode, 0);
                        try {
                            range.setStart(testTextNode, 1);
                            rangeProto.setStart = function(node, offset) {
                                this.nativeRange.setStart(node, offset);
                                updateRangeProperties(this);
                            };
                            rangeProto.setEnd = function(node, offset) {
                                this.nativeRange.setEnd(node, offset);
                                updateRangeProperties(this);
                            };
                            createBeforeAfterNodeSetter = function(name) {
                                return function(node) {
                                    this.nativeRange[name](node);
                                    updateRangeProperties(this);
                                };
                            };
                        } catch (ex) {
                            rangeProto.setStart = function(node, offset) {
                                try {
                                    this.nativeRange.setStart(node, offset);
                                } catch (ex) {
                                    this.nativeRange.setEnd(node, offset);
                                    this.nativeRange.setStart(node, offset);
                                }
                                updateRangeProperties(this);
                            };
                            rangeProto.setEnd = function(node, offset) {
                                try {
                                    this.nativeRange.setEnd(node, offset);
                                } catch (ex) {
                                    this.nativeRange.setStart(node, offset);
                                    this.nativeRange.setEnd(node, offset);
                                }
                                updateRangeProperties(this);
                            };
                            createBeforeAfterNodeSetter = function(name, oppositeName) {
                                return function(node) {
                                    try {
                                        this.nativeRange[name](node);
                                    } catch (ex) {
                                        this.nativeRange[oppositeName](node);
                                        this.nativeRange[name](node);
                                    }
                                    updateRangeProperties(this);
                                };
                            };
                        }
                        rangeProto.setStartBefore = createBeforeAfterNodeSetter("setStartBefore", "setEndBefore");
                        rangeProto.setStartAfter = createBeforeAfterNodeSetter("setStartAfter", "setEndAfter");
                        rangeProto.setEndBefore = createBeforeAfterNodeSetter("setEndBefore", "setStartBefore");
                        rangeProto.setEndAfter = createBeforeAfterNodeSetter("setEndAfter", "setStartAfter");
                        rangeProto.selectNodeContents = function(node) {
                            this.setStartAndEnd(node, 0, dom.getNodeLength(node));
                        };
                        range.selectNodeContents(testTextNode);
                        range.setEnd(testTextNode, 3);
                        var range2 = document.createRange();
                        range2.selectNodeContents(testTextNode);
                        range2.setEnd(testTextNode, 4);
                        range2.setStart(testTextNode, 2);
                        if (range.compareBoundaryPoints(range.START_TO_END, range2) == -1 && range.compareBoundaryPoints(range.END_TO_START, range2) == 1) {
                            rangeProto.compareBoundaryPoints = function(type, range) {
                                range = range.nativeRange || range;
                                if (type == range.START_TO_END) {
                                    type = range.END_TO_START;
                                } else if (type == range.END_TO_START) {
                                    type = range.START_TO_END;
                                }
                                return this.nativeRange.compareBoundaryPoints(type, range);
                            };
                        } else {
                            rangeProto.compareBoundaryPoints = function(type, range) {
                                return this.nativeRange.compareBoundaryPoints(type, range.nativeRange || range);
                            };
                        }
                        var el = document.createElement("div");
                        el.innerHTML = "123";
                        var textNode = el.firstChild;
                        var body = getBody(document);
                        body.appendChild(el);
                        range.setStart(textNode, 1);
                        range.setEnd(textNode, 2);
                        range.deleteContents();
                        if (textNode.data == "13") {
                            rangeProto.deleteContents = function() {
                                this.nativeRange.deleteContents();
                                updateRangeProperties(this);
                            };
                            rangeProto.extractContents = function() {
                                var frag = this.nativeRange.extractContents();
                                updateRangeProperties(this);
                                return frag;
                            };
                        } else {}
                        body.removeChild(el);
                        body = null;
                        if (util.isHostMethod(range, "createContextualFragment")) {
                            rangeProto.createContextualFragment = function(fragmentStr) {
                                return this.nativeRange.createContextualFragment(fragmentStr);
                            };
                        }
                        getBody(document).removeChild(testTextNode);
                        range.detach();
                        range2.detach();
                        rangeProto.getName = function() {
                            return "WrappedRange";
                        };
                        api.WrappedRange = WrappedRange;
                        api.createNativeRange = function(doc) {
                            doc = getContentDocument(doc, module, "createNativeRange");
                            return doc.createRange();
                        };
                    })();
                }
                if (api.features.implementsTextRange) {
                    var getTextRangeContainerElement = function(textRange) {
                        var parentEl = textRange.parentElement();
                        var range = textRange.duplicate();
                        range.collapse(true);
                        var startEl = range.parentElement();
                        range = textRange.duplicate();
                        range.collapse(false);
                        var endEl = range.parentElement();
                        var startEndContainer = startEl == endEl ? startEl : dom.getCommonAncestor(startEl, endEl);
                        return startEndContainer == parentEl ? startEndContainer : dom.getCommonAncestor(parentEl, startEndContainer);
                    };
                    var textRangeIsCollapsed = function(textRange) {
                        return textRange.compareEndPoints("StartToEnd", textRange) == 0;
                    };
                    var getTextRangeBoundaryPosition = function(textRange, wholeRangeContainerElement, isStart, isCollapsed, startInfo) {
                        var workingRange = textRange.duplicate();
                        workingRange.collapse(isStart);
                        var containerElement = workingRange.parentElement();
                        if (!dom.isOrIsAncestorOf(wholeRangeContainerElement, containerElement)) {
                            containerElement = wholeRangeContainerElement;
                        }
                        if (!containerElement.canHaveHTML) {
                            var pos = new DomPosition(containerElement.parentNode, dom.getNodeIndex(containerElement));
                            return {
                                boundaryPosition: pos,
                                nodeInfo: {
                                    nodeIndex: pos.offset,
                                    containerElement: pos.node
                                }
                            };
                        }
                        var workingNode = dom.getDocument(containerElement).createElement("span");
                        if (workingNode.parentNode) {
                            workingNode.parentNode.removeChild(workingNode);
                        }
                        var comparison, workingComparisonType = isStart ? "StartToStart" : "StartToEnd";
                        var previousNode, nextNode, boundaryPosition, boundaryNode;
                        var start = startInfo && startInfo.containerElement == containerElement ? startInfo.nodeIndex : 0;
                        var childNodeCount = containerElement.childNodes.length;
                        var end = childNodeCount;
                        var nodeIndex = end;
                        while (true) {
                            if (nodeIndex == childNodeCount) {
                                containerElement.appendChild(workingNode);
                            } else {
                                containerElement.insertBefore(workingNode, containerElement.childNodes[nodeIndex]);
                            }
                            workingRange.moveToElementText(workingNode);
                            comparison = workingRange.compareEndPoints(workingComparisonType, textRange);
                            if (comparison == 0 || start == end) {
                                break;
                            } else if (comparison == -1) {
                                if (end == start + 1) {
                                    break;
                                } else {
                                    start = nodeIndex;
                                }
                            } else {
                                end = end == start + 1 ? start : nodeIndex;
                            }
                            nodeIndex = Math.floor((start + end) / 2);
                            containerElement.removeChild(workingNode);
                        }
                        boundaryNode = workingNode.nextSibling;
                        if (comparison == -1 && boundaryNode && isCharacterDataNode(boundaryNode)) {
                            workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);
                            var offset;
                            if (/[\r\n]/.test(boundaryNode.data)) {
                                var tempRange = workingRange.duplicate();
                                var rangeLength = tempRange.text.replace(/\r\n/g, "\r").length;
                                offset = tempRange.moveStart("character", rangeLength);
                                while ((comparison = tempRange.compareEndPoints("StartToEnd", tempRange)) == -1) {
                                    offset++;
                                    tempRange.moveStart("character", 1);
                                }
                            } else {
                                offset = workingRange.text.length;
                            }
                            boundaryPosition = new DomPosition(boundaryNode, offset);
                        } else {
                            previousNode = (isCollapsed || !isStart) && workingNode.previousSibling;
                            nextNode = (isCollapsed || isStart) && workingNode.nextSibling;
                            if (nextNode && isCharacterDataNode(nextNode)) {
                                boundaryPosition = new DomPosition(nextNode, 0);
                            } else if (previousNode && isCharacterDataNode(previousNode)) {
                                boundaryPosition = new DomPosition(previousNode, previousNode.data.length);
                            } else {
                                boundaryPosition = new DomPosition(containerElement, dom.getNodeIndex(workingNode));
                            }
                        }
                        workingNode.parentNode.removeChild(workingNode);
                        return {
                            boundaryPosition: boundaryPosition,
                            nodeInfo: {
                                nodeIndex: nodeIndex,
                                containerElement: containerElement
                            }
                        };
                    };
                    var createBoundaryTextRange = function(boundaryPosition, isStart) {
                        var boundaryNode, boundaryParent, boundaryOffset = boundaryPosition.offset;
                        var doc = dom.getDocument(boundaryPosition.node);
                        var workingNode, childNodes, workingRange = getBody(doc).createTextRange();
                        var nodeIsDataNode = isCharacterDataNode(boundaryPosition.node);
                        if (nodeIsDataNode) {
                            boundaryNode = boundaryPosition.node;
                            boundaryParent = boundaryNode.parentNode;
                        } else {
                            childNodes = boundaryPosition.node.childNodes;
                            boundaryNode = boundaryOffset < childNodes.length ? childNodes[boundaryOffset] : null;
                            boundaryParent = boundaryPosition.node;
                        }
                        workingNode = doc.createElement("span");
                        workingNode.innerHTML = "&#feff;";
                        if (boundaryNode) {
                            boundaryParent.insertBefore(workingNode, boundaryNode);
                        } else {
                            boundaryParent.appendChild(workingNode);
                        }
                        workingRange.moveToElementText(workingNode);
                        workingRange.collapse(!isStart);
                        boundaryParent.removeChild(workingNode);
                        if (nodeIsDataNode) {
                            workingRange[isStart ? "moveStart" : "moveEnd"]("character", boundaryOffset);
                        }
                        return workingRange;
                    };
                    WrappedTextRange = function(textRange) {
                        this.textRange = textRange;
                        this.refresh();
                    };
                    WrappedTextRange.prototype = new DomRange(document);
                    WrappedTextRange.prototype.refresh = function() {
                        var start, end, startBoundary;
                        var rangeContainerElement = getTextRangeContainerElement(this.textRange);
                        if (textRangeIsCollapsed(this.textRange)) {
                            end = start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, true).boundaryPosition;
                        } else {
                            startBoundary = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, false);
                            start = startBoundary.boundaryPosition;
                            end = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, false, false, startBoundary.nodeInfo).boundaryPosition;
                        }
                        this.setStart(start.node, start.offset);
                        this.setEnd(end.node, end.offset);
                    };
                    WrappedTextRange.prototype.getName = function() {
                        return "WrappedTextRange";
                    };
                    DomRange.copyComparisonConstants(WrappedTextRange);
                    WrappedTextRange.rangeToTextRange = function(range) {
                        if (range.collapsed) {
                            return createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
                        } else {
                            var startRange = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true);
                            var endRange = createBoundaryTextRange(new DomPosition(range.endContainer, range.endOffset), false);
                            var textRange = getBody(DomRange.getRangeDocument(range)).createTextRange();
                            textRange.setEndPoint("StartToStart", startRange);
                            textRange.setEndPoint("EndToEnd", endRange);
                            return textRange;
                        }
                    };
                    api.WrappedTextRange = WrappedTextRange;
                    if (!api.features.implementsDomRange || api.config.preferTextRange) {
                        var globalObj = function() {
                            return this;
                        }();
                        if (typeof globalObj.Range == "undefined") {
                            globalObj.Range = WrappedTextRange;
                        }
                        api.createNativeRange = function(doc) {
                            doc = getContentDocument(doc, module, "createNativeRange");
                            return getBody(doc).createTextRange();
                        };
                        api.WrappedRange = WrappedTextRange;
                    }
                }
                api.createRange = function(doc) {
                    doc = getContentDocument(doc, module, "createRange");
                    return new api.WrappedRange(api.createNativeRange(doc));
                };
                api.createRangyRange = function(doc) {
                    doc = getContentDocument(doc, module, "createRangyRange");
                    return new DomRange(doc);
                };
                api.createIframeRange = function(iframeEl) {
                    module.deprecationNotice("createIframeRange()", "createRange(iframeEl)");
                    return api.createRange(iframeEl);
                };
                api.createIframeRangyRange = function(iframeEl) {
                    module.deprecationNotice("createIframeRangyRange()", "createRangyRange(iframeEl)");
                    return api.createRangyRange(iframeEl);
                };
                api.addCreateMissingNativeApiListener(function(win) {
                    var doc = win.document;
                    if (typeof doc.createRange == "undefined") {
                        doc.createRange = function() {
                            return api.createRange(doc);
                        };
                    }
                    doc = win = null;
                });
            });
        }, {
            "./core": 11
        } ],
        16: [ function(_dereq_, module, exports) {
            var rangy = _dereq_("./core");
            rangy.api.createCoreModule("WrappedSelection", [ "DomRange", "WrappedRange" ], function(api, module) {
                api.config.checkSelectionRanges = true;
                var BOOLEAN = "boolean";
                var NUMBER = "number";
                var dom = api.dom;
                var util = api.util;
                var isHostMethod = util.isHostMethod;
                var DomRange = api.DomRange;
                var WrappedRange = api.WrappedRange;
                var DOMException = api.DOMException;
                var DomPosition = dom.DomPosition;
                var getNativeSelection;
                var selectionIsCollapsed;
                var features = api.features;
                var CONTROL = "Control";
                var getDocument = dom.getDocument;
                var getBody = dom.getBody;
                var rangesEqual = DomRange.rangesEqual;
                function isDirectionBackward(dir) {
                    return typeof dir == "string" ? /^backward(s)?$/i.test(dir) : !!dir;
                }
                function getWindow(win, methodName) {
                    if (!win) {
                        return window;
                    } else if (dom.isWindow(win)) {
                        return win;
                    } else if (win instanceof WrappedSelection) {
                        return win.win;
                    } else {
                        var doc = dom.getContentDocument(win, module, methodName);
                        return dom.getWindow(doc);
                    }
                }
                function getWinSelection(winParam) {
                    return getWindow(winParam, "getWinSelection").getSelection();
                }
                function getDocSelection(winParam) {
                    return getWindow(winParam, "getDocSelection").document.selection;
                }
                function winSelectionIsBackward(sel) {
                    var backward = false;
                    if (sel.anchorNode) {
                        backward = dom.comparePoints(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset) == 1;
                    }
                    return backward;
                }
                var implementsWinGetSelection = isHostMethod(window, "getSelection"), implementsDocSelection = util.isHostObject(document, "selection");
                features.implementsWinGetSelection = implementsWinGetSelection;
                features.implementsDocSelection = implementsDocSelection;
                var useDocumentSelection = implementsDocSelection && (!implementsWinGetSelection || api.config.preferTextRange);
                if (useDocumentSelection) {
                    getNativeSelection = getDocSelection;
                    api.isSelectionValid = function(winParam) {
                        var doc = getWindow(winParam, "isSelectionValid").document, nativeSel = doc.selection;
                        return nativeSel.type != "None" || getDocument(nativeSel.createRange().parentElement()) == doc;
                    };
                } else if (implementsWinGetSelection) {
                    getNativeSelection = getWinSelection;
                    api.isSelectionValid = function() {
                        return true;
                    };
                } else {
                    module.fail("Neither document.selection or window.getSelection() detected.");
                }
                api.getNativeSelection = getNativeSelection;
                var testSelection = getNativeSelection();
                var testRange = api.createNativeRange(document);
                var body = getBody(document);
                var selectionHasAnchorAndFocus = util.areHostProperties(testSelection, [ "anchorNode", "focusNode", "anchorOffset", "focusOffset" ]);
                features.selectionHasAnchorAndFocus = selectionHasAnchorAndFocus;
                var selectionHasExtend = isHostMethod(testSelection, "extend");
                features.selectionHasExtend = selectionHasExtend;
                var selectionHasRangeCount = typeof testSelection.rangeCount == NUMBER;
                features.selectionHasRangeCount = selectionHasRangeCount;
                var selectionSupportsMultipleRanges = false;
                var collapsedNonEditableSelectionsSupported = true;
                var addRangeBackwardToNative = selectionHasExtend ? function(nativeSelection, range) {
                    var doc = DomRange.getRangeDocument(range);
                    var endRange = api.createRange(doc);
                    endRange.collapseToPoint(range.endContainer, range.endOffset);
                    nativeSelection.addRange(getNativeRange(endRange));
                    nativeSelection.extend(range.startContainer, range.startOffset);
                } : null;
                if (util.areHostMethods(testSelection, [ "addRange", "getRangeAt", "removeAllRanges" ]) && typeof testSelection.rangeCount == NUMBER && features.implementsDomRange) {
                    (function() {
                        var sel = window.getSelection();
                        if (sel) {
                            var originalSelectionRangeCount = sel.rangeCount;
                            var selectionHasMultipleRanges = originalSelectionRangeCount > 1;
                            var originalSelectionRanges = [];
                            var originalSelectionBackward = winSelectionIsBackward(sel);
                            for (var i = 0; i < originalSelectionRangeCount; ++i) {
                                originalSelectionRanges[i] = sel.getRangeAt(i);
                            }
                            var body = getBody(document);
                            var testEl = body.appendChild(document.createElement("div"));
                            testEl.contentEditable = "false";
                            var textNode = testEl.appendChild(document.createTextNode("   "));
                            var r1 = document.createRange();
                            r1.setStart(textNode, 1);
                            r1.collapse(true);
                            sel.addRange(r1);
                            collapsedNonEditableSelectionsSupported = sel.rangeCount == 1;
                            sel.removeAllRanges();
                            if (!selectionHasMultipleRanges) {
                                var r2 = r1.cloneRange();
                                r1.setStart(textNode, 0);
                                r2.setEnd(textNode, 3);
                                r2.setStart(textNode, 2);
                                sel.addRange(r1);
                                sel.addRange(r2);
                                selectionSupportsMultipleRanges = sel.rangeCount == 2;
                                r2.detach();
                            }
                            body.removeChild(testEl);
                            sel.removeAllRanges();
                            r1.detach();
                            for (i = 0; i < originalSelectionRangeCount; ++i) {
                                if (i == 0 && originalSelectionBackward) {
                                    if (addRangeBackwardToNative) {
                                        addRangeBackwardToNative(sel, originalSelectionRanges[i]);
                                    } else {
                                        api.warn("Rangy initialization: original selection was backwards but selection has been restored forwards because browser does not support Selection.extend");
                                        sel.addRange(originalSelectionRanges[i]);
                                    }
                                } else {
                                    sel.addRange(originalSelectionRanges[i]);
                                }
                            }
                        }
                    })();
                }
                features.selectionSupportsMultipleRanges = selectionSupportsMultipleRanges;
                features.collapsedNonEditableSelectionsSupported = collapsedNonEditableSelectionsSupported;
                var implementsControlRange = false, testControlRange;
                if (body && isHostMethod(body, "createControlRange")) {
                    testControlRange = body.createControlRange();
                    if (util.areHostProperties(testControlRange, [ "item", "add" ])) {
                        implementsControlRange = true;
                    }
                }
                features.implementsControlRange = implementsControlRange;
                if (selectionHasAnchorAndFocus) {
                    selectionIsCollapsed = function(sel) {
                        return sel.anchorNode === sel.focusNode && sel.anchorOffset === sel.focusOffset;
                    };
                } else {
                    selectionIsCollapsed = function(sel) {
                        return sel.rangeCount ? sel.getRangeAt(sel.rangeCount - 1).collapsed : false;
                    };
                }
                function updateAnchorAndFocusFromRange(sel, range, backward) {
                    var anchorPrefix = backward ? "end" : "start", focusPrefix = backward ? "start" : "end";
                    sel.anchorNode = range[anchorPrefix + "Container"];
                    sel.anchorOffset = range[anchorPrefix + "Offset"];
                    sel.focusNode = range[focusPrefix + "Container"];
                    sel.focusOffset = range[focusPrefix + "Offset"];
                }
                function updateAnchorAndFocusFromNativeSelection(sel) {
                    var nativeSel = sel.nativeSelection;
                    sel.anchorNode = nativeSel.anchorNode;
                    sel.anchorOffset = nativeSel.anchorOffset;
                    sel.focusNode = nativeSel.focusNode;
                    sel.focusOffset = nativeSel.focusOffset;
                }
                function updateEmptySelection(sel) {
                    sel.anchorNode = sel.focusNode = null;
                    sel.anchorOffset = sel.focusOffset = 0;
                    sel.rangeCount = 0;
                    sel.isCollapsed = true;
                    sel._ranges.length = 0;
                }
                function getNativeRange(range) {
                    var nativeRange;
                    if (range instanceof DomRange) {
                        nativeRange = api.createNativeRange(range.getDocument());
                        nativeRange.setEnd(range.endContainer, range.endOffset);
                        nativeRange.setStart(range.startContainer, range.startOffset);
                    } else if (range instanceof WrappedRange) {
                        nativeRange = range.nativeRange;
                    } else if (features.implementsDomRange && range instanceof dom.getWindow(range.startContainer).Range) {
                        nativeRange = range;
                    }
                    return nativeRange;
                }
                function rangeContainsSingleElement(rangeNodes) {
                    if (!rangeNodes.length || rangeNodes[0].nodeType != 1) {
                        return false;
                    }
                    for (var i = 1, len = rangeNodes.length; i < len; ++i) {
                        if (!dom.isAncestorOf(rangeNodes[0], rangeNodes[i])) {
                            return false;
                        }
                    }
                    return true;
                }
                function getSingleElementFromRange(range) {
                    var nodes = range.getNodes();
                    if (!rangeContainsSingleElement(nodes)) {
                        throw module.createError("getSingleElementFromRange: range " + range.inspect() + " did not consist of a single element");
                    }
                    return nodes[0];
                }
                function isTextRange(range) {
                    return !!range && typeof range.text != "undefined";
                }
                function updateFromTextRange(sel, range) {
                    var wrappedRange = new WrappedRange(range);
                    sel._ranges = [ wrappedRange ];
                    updateAnchorAndFocusFromRange(sel, wrappedRange, false);
                    sel.rangeCount = 1;
                    sel.isCollapsed = wrappedRange.collapsed;
                }
                function updateControlSelection(sel) {
                    sel._ranges.length = 0;
                    if (sel.docSelection.type == "None") {
                        updateEmptySelection(sel);
                    } else {
                        var controlRange = sel.docSelection.createRange();
                        if (isTextRange(controlRange)) {
                            updateFromTextRange(sel, controlRange);
                        } else {
                            sel.rangeCount = controlRange.length;
                            var range, doc = getDocument(controlRange.item(0));
                            for (var i = 0; i < sel.rangeCount; ++i) {
                                range = api.createRange(doc);
                                range.selectNode(controlRange.item(i));
                                sel._ranges.push(range);
                            }
                            sel.isCollapsed = sel.rangeCount == 1 && sel._ranges[0].collapsed;
                            updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
                        }
                    }
                }
                function addRangeToControlSelection(sel, range) {
                    var controlRange = sel.docSelection.createRange();
                    var rangeElement = getSingleElementFromRange(range);
                    var doc = getDocument(controlRange.item(0));
                    var newControlRange = getBody(doc).createControlRange();
                    for (var i = 0, len = controlRange.length; i < len; ++i) {
                        newControlRange.add(controlRange.item(i));
                    }
                    try {
                        newControlRange.add(rangeElement);
                    } catch (ex) {
                        throw module.createError("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");
                    }
                    newControlRange.select();
                    updateControlSelection(sel);
                }
                var getSelectionRangeAt;
                if (isHostMethod(testSelection, "getRangeAt")) {
                    getSelectionRangeAt = function(sel, index) {
                        try {
                            return sel.getRangeAt(index);
                        } catch (ex) {
                            return null;
                        }
                    };
                } else if (selectionHasAnchorAndFocus) {
                    getSelectionRangeAt = function(sel) {
                        var doc = getDocument(sel.anchorNode);
                        var range = api.createRange(doc);
                        range.setStartAndEnd(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset);
                        if (range.collapsed !== this.isCollapsed) {
                            range.setStartAndEnd(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
                        }
                        return range;
                    };
                }
                function WrappedSelection(selection, docSelection, win) {
                    this.nativeSelection = selection;
                    this.docSelection = docSelection;
                    this._ranges = [];
                    this.win = win;
                    this.refresh();
                }
                WrappedSelection.prototype = api.selectionPrototype;
                function deleteProperties(sel) {
                    sel.win = sel.anchorNode = sel.focusNode = sel._ranges = null;
                    sel.rangeCount = sel.anchorOffset = sel.focusOffset = 0;
                    sel.detached = true;
                }
                var cachedRangySelections = [];
                function actOnCachedSelection(win, action) {
                    var i = cachedRangySelections.length, cached, sel;
                    while (i--) {
                        cached = cachedRangySelections[i];
                        sel = cached.selection;
                        if (action == "deleteAll") {
                            deleteProperties(sel);
                        } else if (cached.win == win) {
                            if (action == "delete") {
                                cachedRangySelections.splice(i, 1);
                                return true;
                            } else {
                                return sel;
                            }
                        }
                    }
                    if (action == "deleteAll") {
                        cachedRangySelections.length = 0;
                    }
                    return null;
                }
                var getSelection = function(win) {
                    if (win && win instanceof WrappedSelection) {
                        win.refresh();
                        return win;
                    }
                    win = getWindow(win, "getNativeSelection");
                    var sel = actOnCachedSelection(win);
                    var nativeSel = getNativeSelection(win), docSel = implementsDocSelection ? getDocSelection(win) : null;
                    if (sel) {
                        sel.nativeSelection = nativeSel;
                        sel.docSelection = docSel;
                        sel.refresh();
                    } else {
                        sel = new WrappedSelection(nativeSel, docSel, win);
                        cachedRangySelections.push({
                            win: win,
                            selection: sel
                        });
                    }
                    return sel;
                };
                api.getSelection = getSelection;
                api.getIframeSelection = function(iframeEl) {
                    module.deprecationNotice("getIframeSelection()", "getSelection(iframeEl)");
                    return api.getSelection(dom.getIframeWindow(iframeEl));
                };
                var selProto = WrappedSelection.prototype;
                function createControlSelection(sel, ranges) {
                    var doc = getDocument(ranges[0].startContainer);
                    var controlRange = getBody(doc).createControlRange();
                    for (var i = 0, el, len = ranges.length; i < len; ++i) {
                        el = getSingleElementFromRange(ranges[i]);
                        try {
                            controlRange.add(el);
                        } catch (ex) {
                            throw module.createError("setRanges(): Element within one of the specified Ranges could not be added to control selection (does it have layout?)");
                        }
                    }
                    controlRange.select();
                    updateControlSelection(sel);
                }
                if (!useDocumentSelection && selectionHasAnchorAndFocus && util.areHostMethods(testSelection, [ "removeAllRanges", "addRange" ])) {
                    selProto.removeAllRanges = function() {
                        this.nativeSelection.removeAllRanges();
                        updateEmptySelection(this);
                    };
                    var addRangeBackward = function(sel, range) {
                        addRangeBackwardToNative(sel.nativeSelection, range);
                        sel.refresh();
                    };
                    if (selectionHasRangeCount) {
                        selProto.addRange = function(range, direction) {
                            if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
                                addRangeToControlSelection(this, range);
                            } else {
                                if (isDirectionBackward(direction) && selectionHasExtend) {
                                    addRangeBackward(this, range);
                                } else {
                                    var previousRangeCount;
                                    if (selectionSupportsMultipleRanges) {
                                        previousRangeCount = this.rangeCount;
                                    } else {
                                        this.removeAllRanges();
                                        previousRangeCount = 0;
                                    }
                                    this.nativeSelection.addRange(getNativeRange(range).cloneRange());
                                    this.rangeCount = this.nativeSelection.rangeCount;
                                    if (this.rangeCount == previousRangeCount + 1) {
                                        if (api.config.checkSelectionRanges) {
                                            var nativeRange = getSelectionRangeAt(this.nativeSelection, this.rangeCount - 1);
                                            if (nativeRange && !rangesEqual(nativeRange, range)) {
                                                range = new WrappedRange(nativeRange);
                                            }
                                        }
                                        this._ranges[this.rangeCount - 1] = range;
                                        updateAnchorAndFocusFromRange(this, range, selectionIsBackward(this.nativeSelection));
                                        this.isCollapsed = selectionIsCollapsed(this);
                                    } else {
                                        this.refresh();
                                    }
                                }
                            }
                        };
                    } else {
                        selProto.addRange = function(range, direction) {
                            if (isDirectionBackward(direction) && selectionHasExtend) {
                                addRangeBackward(this, range);
                            } else {
                                this.nativeSelection.addRange(getNativeRange(range));
                                this.refresh();
                            }
                        };
                    }
                    selProto.setRanges = function(ranges) {
                        if (implementsControlRange && ranges.length > 1) {
                            createControlSelection(this, ranges);
                        } else {
                            this.removeAllRanges();
                            for (var i = 0, len = ranges.length; i < len; ++i) {
                                this.addRange(ranges[i]);
                            }
                        }
                    };
                } else if (isHostMethod(testSelection, "empty") && isHostMethod(testRange, "select") && implementsControlRange && useDocumentSelection) {
                    selProto.removeAllRanges = function() {
                        try {
                            this.docSelection.empty();
                            if (this.docSelection.type != "None") {
                                var doc;
                                if (this.anchorNode) {
                                    doc = getDocument(this.anchorNode);
                                } else if (this.docSelection.type == CONTROL) {
                                    var controlRange = this.docSelection.createRange();
                                    if (controlRange.length) {
                                        doc = getDocument(controlRange.item(0));
                                    }
                                }
                                if (doc) {
                                    var textRange = getBody(doc).createTextRange();
                                    textRange.select();
                                    this.docSelection.empty();
                                }
                            }
                        } catch (ex) {}
                        updateEmptySelection(this);
                    };
                    selProto.addRange = function(range) {
                        if (this.docSelection.type == CONTROL) {
                            addRangeToControlSelection(this, range);
                        } else {
                            api.WrappedTextRange.rangeToTextRange(range).select();
                            this._ranges[0] = range;
                            this.rangeCount = 1;
                            this.isCollapsed = this._ranges[0].collapsed;
                            updateAnchorAndFocusFromRange(this, range, false);
                        }
                    };
                    selProto.setRanges = function(ranges) {
                        this.removeAllRanges();
                        var rangeCount = ranges.length;
                        if (rangeCount > 1) {
                            createControlSelection(this, ranges);
                        } else if (rangeCount) {
                            this.addRange(ranges[0]);
                        }
                    };
                } else {
                    module.fail("No means of selecting a Range or TextRange was found");
                    return false;
                }
                selProto.getRangeAt = function(index) {
                    if (index < 0 || index >= this.rangeCount) {
                        throw new DOMException("INDEX_SIZE_ERR");
                    } else {
                        return this._ranges[index].cloneRange();
                    }
                };
                var refreshSelection;
                if (useDocumentSelection) {
                    refreshSelection = function(sel) {
                        var range;
                        if (api.isSelectionValid(sel.win)) {
                            range = sel.docSelection.createRange();
                        } else {
                            range = getBody(sel.win.document).createTextRange();
                            range.collapse(true);
                        }
                        if (sel.docSelection.type == CONTROL) {
                            updateControlSelection(sel);
                        } else if (isTextRange(range)) {
                            updateFromTextRange(sel, range);
                        } else {
                            updateEmptySelection(sel);
                        }
                    };
                } else if (isHostMethod(testSelection, "getRangeAt") && typeof testSelection.rangeCount == NUMBER) {
                    refreshSelection = function(sel) {
                        if (implementsControlRange && implementsDocSelection && sel.docSelection.type == CONTROL) {
                            updateControlSelection(sel);
                        } else {
                            sel._ranges.length = sel.rangeCount = sel.nativeSelection.rangeCount;
                            if (sel.rangeCount) {
                                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                                    sel._ranges[i] = new api.WrappedRange(sel.nativeSelection.getRangeAt(i));
                                }
                                updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], selectionIsBackward(sel.nativeSelection));
                                sel.isCollapsed = selectionIsCollapsed(sel);
                            } else {
                                updateEmptySelection(sel);
                            }
                        }
                    };
                } else if (selectionHasAnchorAndFocus && typeof testSelection.isCollapsed == BOOLEAN && typeof testRange.collapsed == BOOLEAN && features.implementsDomRange) {
                    refreshSelection = function(sel) {
                        var range, nativeSel = sel.nativeSelection;
                        if (nativeSel.anchorNode) {
                            range = getSelectionRangeAt(nativeSel, 0);
                            sel._ranges = [ range ];
                            sel.rangeCount = 1;
                            updateAnchorAndFocusFromNativeSelection(sel);
                            sel.isCollapsed = selectionIsCollapsed(sel);
                        } else {
                            updateEmptySelection(sel);
                        }
                    };
                } else {
                    module.fail("No means of obtaining a Range or TextRange from the user's selection was found");
                    return false;
                }
                selProto.refresh = function(checkForChanges) {
                    var oldRanges = checkForChanges ? this._ranges.slice(0) : null;
                    var oldAnchorNode = this.anchorNode, oldAnchorOffset = this.anchorOffset;
                    refreshSelection(this);
                    if (checkForChanges) {
                        var i = oldRanges.length;
                        if (i != this._ranges.length) {
                            return true;
                        }
                        if (this.anchorNode != oldAnchorNode || this.anchorOffset != oldAnchorOffset) {
                            return true;
                        }
                        while (i--) {
                            if (!rangesEqual(oldRanges[i], this._ranges[i])) {
                                return true;
                            }
                        }
                        return false;
                    }
                };
                var removeRangeManually = function(sel, range) {
                    var ranges = sel.getAllRanges();
                    sel.removeAllRanges();
                    for (var i = 0, len = ranges.length; i < len; ++i) {
                        if (!rangesEqual(range, ranges[i])) {
                            sel.addRange(ranges[i]);
                        }
                    }
                    if (!sel.rangeCount) {
                        updateEmptySelection(sel);
                    }
                };
                if (implementsControlRange) {
                    selProto.removeRange = function(range) {
                        if (this.docSelection.type == CONTROL) {
                            var controlRange = this.docSelection.createRange();
                            var rangeElement = getSingleElementFromRange(range);
                            var doc = getDocument(controlRange.item(0));
                            var newControlRange = getBody(doc).createControlRange();
                            var el, removed = false;
                            for (var i = 0, len = controlRange.length; i < len; ++i) {
                                el = controlRange.item(i);
                                if (el !== rangeElement || removed) {
                                    newControlRange.add(controlRange.item(i));
                                } else {
                                    removed = true;
                                }
                            }
                            newControlRange.select();
                            updateControlSelection(this);
                        } else {
                            removeRangeManually(this, range);
                        }
                    };
                } else {
                    selProto.removeRange = function(range) {
                        removeRangeManually(this, range);
                    };
                }
                var selectionIsBackward;
                if (!useDocumentSelection && selectionHasAnchorAndFocus && features.implementsDomRange) {
                    selectionIsBackward = winSelectionIsBackward;
                    selProto.isBackward = function() {
                        return selectionIsBackward(this);
                    };
                } else {
                    selectionIsBackward = selProto.isBackward = function() {
                        return false;
                    };
                }
                selProto.isBackwards = selProto.isBackward;
                selProto.toString = function() {
                    var rangeTexts = [];
                    for (var i = 0, len = this.rangeCount; i < len; ++i) {
                        rangeTexts[i] = "" + this._ranges[i];
                    }
                    return rangeTexts.join("");
                };
                function assertNodeInSameDocument(sel, node) {
                    if (sel.win.document != getDocument(node)) {
                        throw new DOMException("WRONG_DOCUMENT_ERR");
                    }
                }
                selProto.collapse = function(node, offset) {
                    assertNodeInSameDocument(this, node);
                    var range = api.createRange(node);
                    range.collapseToPoint(node, offset);
                    this.setSingleRange(range);
                    this.isCollapsed = true;
                };
                selProto.collapseToStart = function() {
                    if (this.rangeCount) {
                        var range = this._ranges[0];
                        this.collapse(range.startContainer, range.startOffset);
                    } else {
                        throw new DOMException("INVALID_STATE_ERR");
                    }
                };
                selProto.collapseToEnd = function() {
                    if (this.rangeCount) {
                        var range = this._ranges[this.rangeCount - 1];
                        this.collapse(range.endContainer, range.endOffset);
                    } else {
                        throw new DOMException("INVALID_STATE_ERR");
                    }
                };
                selProto.selectAllChildren = function(node) {
                    assertNodeInSameDocument(this, node);
                    var range = api.createRange(node);
                    range.selectNodeContents(node);
                    this.setSingleRange(range);
                };
                selProto.deleteFromDocument = function() {
                    if (implementsControlRange && implementsDocSelection && this.docSelection.type == CONTROL) {
                        var controlRange = this.docSelection.createRange();
                        var element;
                        while (controlRange.length) {
                            element = controlRange.item(0);
                            controlRange.remove(element);
                            element.parentNode.removeChild(element);
                        }
                        this.refresh();
                    } else if (this.rangeCount) {
                        var ranges = this.getAllRanges();
                        if (ranges.length) {
                            this.removeAllRanges();
                            for (var i = 0, len = ranges.length; i < len; ++i) {
                                ranges[i].deleteContents();
                            }
                            this.addRange(ranges[len - 1]);
                        }
                    }
                };
                selProto.eachRange = function(func, returnValue) {
                    for (var i = 0, len = this._ranges.length; i < len; ++i) {
                        if (func(this.getRangeAt(i))) {
                            return returnValue;
                        }
                    }
                };
                selProto.getAllRanges = function() {
                    var ranges = [];
                    this.eachRange(function(range) {
                        ranges.push(range);
                    });
                    return ranges;
                };
                selProto.setSingleRange = function(range, direction) {
                    this.removeAllRanges();
                    this.addRange(range, direction);
                };
                selProto.callMethodOnEachRange = function(methodName, params) {
                    var results = [];
                    this.eachRange(function(range) {
                        results.push(range[methodName].apply(range, params));
                    });
                    return results;
                };
                function createStartOrEndSetter(isStart) {
                    return function(node, offset) {
                        var range;
                        if (this.rangeCount) {
                            range = this.getRangeAt(0);
                            range["set" + (isStart ? "Start" : "End")](node, offset);
                        } else {
                            range = api.createRange(this.win.document);
                            range.setStartAndEnd(node, offset);
                        }
                        this.setSingleRange(range, this.isBackward());
                    };
                }
                selProto.setStart = createStartOrEndSetter(true);
                selProto.setEnd = createStartOrEndSetter(false);
                api.rangePrototype.select = function(direction) {
                    getSelection(this.getDocument()).setSingleRange(this, direction);
                };
                selProto.changeEachRange = function(func) {
                    var ranges = [];
                    var backward = this.isBackward();
                    this.eachRange(function(range) {
                        func(range);
                        ranges.push(range);
                    });
                    this.removeAllRanges();
                    if (backward && ranges.length == 1) {
                        this.addRange(ranges[0], "backward");
                    } else {
                        this.setRanges(ranges);
                    }
                };
                selProto.containsNode = function(node, allowPartial) {
                    return this.eachRange(function(range) {
                        return range.containsNode(node, allowPartial);
                    }, true);
                };
                selProto.getBookmark = function(containerNode) {
                    return {
                        backward: this.isBackward(),
                        rangeBookmarks: this.callMethodOnEachRange("getBookmark", [ containerNode ])
                    };
                };
                selProto.moveToBookmark = function(bookmark) {
                    var selRanges = [];
                    for (var i = 0, rangeBookmark, range; rangeBookmark = bookmark.rangeBookmarks[i++]; ) {
                        range = api.createRange(this.win);
                        range.moveToBookmark(rangeBookmark);
                        selRanges.push(range);
                    }
                    if (bookmark.backward) {
                        this.setSingleRange(selRanges[0], "backward");
                    } else {
                        this.setRanges(selRanges);
                    }
                };
                selProto.toHtml = function() {
                    return this.callMethodOnEachRange("toHtml").join("");
                };
                function inspect(sel) {
                    var rangeInspects = [];
                    var anchor = new DomPosition(sel.anchorNode, sel.anchorOffset);
                    var focus = new DomPosition(sel.focusNode, sel.focusOffset);
                    var name = typeof sel.getName == "function" ? sel.getName() : "Selection";
                    if (typeof sel.rangeCount != "undefined") {
                        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                            rangeInspects[i] = DomRange.inspect(sel.getRangeAt(i));
                        }
                    }
                    return "[" + name + "(Ranges: " + rangeInspects.join(", ") + ")(anchor: " + anchor.inspect() + ", focus: " + focus.inspect() + "]";
                }
                selProto.getName = function() {
                    return "WrappedSelection";
                };
                selProto.inspect = function() {
                    return inspect(this);
                };
                selProto.detach = function() {
                    actOnCachedSelection(this.win, "delete");
                    deleteProperties(this);
                };
                WrappedSelection.detachAll = function() {
                    actOnCachedSelection(null, "deleteAll");
                };
                WrappedSelection.inspect = inspect;
                WrappedSelection.isDirectionBackward = isDirectionBackward;
                api.Selection = WrappedSelection;
                api.selectionPrototype = selProto;
                api.addCreateMissingNativeApiListener(function(win) {
                    if (typeof win.getSelection == "undefined") {
                        win.getSelection = function() {
                            return getSelection(win);
                        };
                    }
                    win = null;
                });
            });
        }, {
            "./core": 11
        } ]
    }, {}, [ 10 ])(10);
});