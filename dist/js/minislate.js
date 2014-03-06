/*!
 * Minislate JavaScript WYSIWYG Editor
 * Version: 0.1.0
 *
 * Includes Rangy
 * https://code.google.com/p/rangy/
 *
 * Copyright 2014, Olivier Meunier and contributors
 * Released under the MIT license
 *
 * Date: Thu, 06 Mar 2014 18:42:58 GMT
 */
(function(name, definition) {
    if (typeof module !== "undefined") {
        module.exports = definition();
    } else if (typeof define === "function" && typeof define.amd === "object") {
        define(definition);
    } else {
        this[name] = definition();
    }
})("Minislate", function(undefined) {
    var rangy = function() {
        var _module = {};
        (function() {
            (function(global) {
                var amdSupported = typeof global.define == "function" && global.define.amd;
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
                var docReady = false;
                var loadHandler = function(e) {
                    if (!docReady) {
                        docReady = true;
                        if (!api.initialized) {
                            init();
                        }
                    }
                };
                if (typeof window == UNDEFINED) {
                    fail("No window found");
                    return;
                }
                if (typeof document == UNDEFINED) {
                    fail("No document found");
                    return;
                }
                if (isHostMethod(document, "addEventListener")) {
                    document.addEventListener("DOMContentLoaded", loadHandler, false);
                }
                addListener(window, "load", loadHandler);
                if (amdSupported) {
                    global.define(function() {
                        api.amd = true;
                        return api;
                    });
                }
                global.rangy = api;
            })(this);
        }).call(_module);
        var rangy = _module.rangy;
        _module = undefined;
        rangy.createCoreModule("DomUtil", [], function(api, module) {
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
        rangy.createCoreModule("DomRange", [ "DomUtil" ], function(api, module) {
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
        rangy.createCoreModule("WrappedRange", [ "DomRange" ], function(api, module) {
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
        rangy.createCoreModule("WrappedSelection", [ "DomRange", "WrappedRange" ], function(api, module) {
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
        rangy.createModule("SaveRestore", [ "WrappedRange" ], function(api, module) {
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
        return rangy;
    }();
    rangy.config = {
        alertOnFail: false,
        alertOnWarn: false,
        checkSelectionRanges: true,
        preferTextRange: false
    };
    (function() {
        "use strict";
        rangy.createCoreModule("RangyExtensions", [], function(api) {
            api.rangePrototype.getTopNodes = function() {
                var nodes = this.getNodes(null);
                if (nodes.length === 0) {
                    return nodes;
                }
                var node, prev = null, result = [];
                for (var i = 0; i < nodes.length; i++) {
                    node = nodes[i];
                    if (node.textContent !== this.toString()) {
                        continue;
                    }
                    if (result.indexOf(node.parentNode) === -1 && node.parentNode !== prev) {
                        result.push(node);
                    }
                    prev = node;
                }
                return result;
            };
            api.rangePrototype.getSurroundingNode = function() {
                var nodes = this.getTopNodes(), text = this.toString(), node = null;
                var invalidNodes = nodes.length !== 1 || nodes[0].nodeType === 3 && this.toString() !== nodes[0].textContent;
                if (invalidNodes) {
                    var _node = this.commonAncestorContainer;
                    if (_node && _node.textContent === text) {
                        node = _node;
                    }
                } else {
                    node = nodes[0];
                }
                if (node === null) {
                    return node;
                }
                while (text === node.parentNode.textContent) {
                    node = node.parentNode;
                }
                return node;
            };
            api.rangePrototype.getContainer = function() {
                var node = this.getSurroundingNode();
                if (node && node !== this.commonAncestorContainer && node.parentNode.nodeType === 1) {
                    return node.parentNode;
                }
                if (node === this.commonAncestorContainer) {
                    node = node.parentNode;
                } else {
                    node = this.commonAncestorContainer;
                }
                while (node.nodeType !== 1) {
                    node = node.parentNode;
                }
                return node;
            };
            api.rangePrototype.replaceNodeByContents = function(node) {
                var content = this.getDocument().createDocumentFragment();
                for (var i = 0; i < node.childNodes.length; i++) {
                    content.appendChild(node.childNodes[i].cloneNode(true));
                }
                node.parentNode.replaceChild(content, node);
            };
            api.selectionPrototype.getStart = function() {
                var node = this.anchorNode;
                return node && node.nodeType === 3 ? node.parentNode : node;
            };
            api.dom.getTopContainer = function(node) {
                while (node.parentNode.childNodes.length === 1) {
                    node = node.parentNode;
                }
                return node;
            };
            api.dom.hasParents = function(node, parents) {
                while ([ document, document.body ].indexOf(node) === -1) {
                    if (parents.indexOf(node) !== -1) {
                        return true;
                    }
                    node = node.parentNode;
                }
                return false;
            };
        });
    })();
    var editor = function() {
        "use strict";
        var Base = Object.freeze(Object.create(Object.prototype, {
            "new": {
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
                    Array.prototype.forEach.call(arguments, function(properties) {
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
        var Editor = function(elements, options) {
            if (!window.getSelection) {
                throw new Error("Browser features missing.");
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
                this.elements = typeof elements === "string" ? document.querySelectorAll(elements) : elements;
                if (this.elements.length === 0) {
                    return;
                }
                this.isActive = true;
                this.id = this.elements.length + 1;
                this.options = Base.extend(this.defaults, options);
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
                this.initElements().initToolbar().bindSelect().bindTyping();
            },
            iter: function(callback) {
                var i;
                for (i = 0; i < this.elements.length; i++) {
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
                    node.setAttribute("contentEditable", true);
                    node.setAttribute("data-editor-element", true);
                });
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
                this.on("keyup", function() {
                    if (self.getSelection().getStart() === self._currentEditor) {
                        self.exec("formatBlock", "p");
                    }
                });
            },
            initToolbar: function() {
                this.toolbar = Toolbar["new"]({
                    fontAwesomeEnabled: this.options.fontAwesomeEnabled
                });
                this.toolbar.editor = this;
                this.addDefaultItems();
                return this;
            },
            addDefaultItems: function() {
                var i, item;
                for (i = 0; i < Editor.defaultItems.length; i++) {
                    item = Editor.defaultItems[i];
                    if (item.type === "menu") {
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
            hideDialog: function() {
                this.toolbar.hideDialog();
                this.setToolbarPosition();
                return this;
            },
            setToolbarPosition: function() {
                var info = this.getRangeInfo(), container = info.container, surrounding = info.surrounding, boundary = container.getBoundingClientRect(), height = this.toolbar.element.offsetHeight, width = this.toolbar.element.offsetWidth;
                if (surrounding && surrounding.nodeType === 1) {
                    boundary = surrounding.getBoundingClientRect();
                }
                if (!info.range.collapsed && info.range.nativeRange.getBoundingClientRect) {
                    boundary = info.range.nativeRange.getBoundingClientRect();
                }
                var top = 0;
                if (boundary.top < height) {
                    top = boundary.bottom - this.options.diffTop + window.pageYOffset;
                } else {
                    top = boundary.top + this.options.diffTop + window.pageYOffset - height;
                }
                var left = boundary.left;
                if (this._currentEditor.offsetWidth < width + boundary.left) {
                    left = this._currentEditor.offsetWidth - width - this.options.diffLeft;
                }
                this.toolbar.move(top, left);
            },
            _onFocus: function() {
                this._currentEditor = this._getSelectionElement();
            },
            _onSelect: function(evt) {
                var elements = [].slice.call(this.elements);
                elements.push(this.toolbar.element);
                if (!this.rangy.dom.hasParents(evt.target, elements)) {
                    this.hideToolbar();
                    this._currentEditor = false;
                    return;
                }
                this._currentEditor = this._getSelectionElement();
                if (!this.rangy.dom.hasParents(evt.target, [ this.toolbar.element ])) {
                    this.showToolbar();
                }
            },
            getSelection: function() {
                return this.rangy.getSelection();
            },
            getRange: function(index) {
                index = typeof index === "undefined" ? 0 : index;
                return this.getSelection().getRangeAt(0);
            },
            setRange: function(node) {
                var range = this.rangy.createRange();
                range.selectNode(node);
                this.getSelection().setSingleRange(range);
            },
            getRangeInfo: function() {
                var range = this.getRange(), surrounding = range.getSurroundingNode(), container = range.getContainer(), topSurrounding, topContainer;
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
                var info = this.getRangeInfo(), node, res = [];
                filter = filter || function(type, name, node) {
                    return node;
                };
                if (info.surrounding && info.surrounding.nodeType === 1) {
                    node = info.surrounding;
                } else {
                    node = info.container;
                }
                while (node && node.childNodes.length === 1 && node.firstChild.nodeType === 1) {
                    node = node.firstChild;
                }
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
                var range = this.getRange(), current = range.commonAncestorContainer, parent = current.parentNode, result;
                var getEditor = function(e) {
                    var parent = e;
                    try {
                        while (!parent.getAttribute("data-editor-element")) {
                            parent = parent.parentNode;
                        }
                    } catch (errb) {
                        return false;
                    }
                    return parent;
                };
                try {
                    if (current.getAttribute("data-editor-element")) {
                        result = current;
                    } else {
                        result = getEditor(parent);
                    }
                } catch (err) {
                    result = getEditor(parent);
                }
                return result;
            }
        };
        Editor.defaultItems = [];
        Editor.addDefaultButton = function(id, options) {
            Editor.defaultItems.push({
                id: id,
                options: options,
                type: "button"
            });
        };
        Editor.addDefaultMenu = function(id, options) {
            Editor.defaultItems.push({
                id: id,
                options: options,
                type: "menu"
            });
        };
        var Toolbar = Base.extend({
            defaults: {
                id: "toolbar",
                toolbarClass: "editor-toolbar",
                dialogClass: "editor-dialog",
                buttonClass: "editor-button",
                menuClass: "editor-menu",
                fontAwesomeEnabled: false
            },
            initialize: function(options) {
                this.options = Base.extend(this.defaults, options || {});
                this.element = document.createElement("div");
                this.controls = document.createElement("ul");
                this.dialog = document.createElement("div");
                this.element.id = this.options.id;
                this.element.classList.add(this.options.toolbarClass);
                document.body.appendChild(this.element);
                this.dialog.classList.add(this.options.dialogClass);
                this.dialog.style.display = "none";
                this.element.appendChild(this.controls);
                this.element.appendChild(this.dialog);
                this.element.style.visibility = "hidden";
                this.items = {};
                this.drawItems();
                this._showEvt = document.createEvent("Event");
                this._showEvt.initEvent("toolbar.show", false, true);
                this._hideEvt = document.createEvent("Event");
                this._hideEvt.initEvent("toolbar.hide", false, true);
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
                this.element.style.visibility = "visible";
                this.element.dispatchEvent(this._showEvt);
            },
            showDialog: function() {
                this.emptyDialog();
                this.dialog.style.display = "block";
                this.controls.style.display = "none";
            },
            hideDialog: function() {
                this.dialog.style.display = "none";
                this.controls.style.display = "block";
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
            addItem: function(Klass, id, options, redraw) {
                redraw = typeof redraw === "undefined" ? true : redraw;
                var item = Klass["new"](this, id, options);
                var el = document.createElement("li");
                el.appendChild(item.element);
                this.items[item.id] = {
                    element: el,
                    instance: item
                };
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
                delete this.items[id];
            },
            drawItems: function() {
                var i, item, parent, sibling, reposition = [];
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
                for (i = 0; i < reposition.length; i++) {
                    item = this.items[reposition[i]];
                    if (item.instance.options.menu && !Menu.isPrototypeOf(item.instance)) {
                        parent = this.items[item.instance.options.menu];
                        if (parent && Menu.isPrototypeOf(parent.instance)) {
                            parent.instance.container.appendChild(item.element);
                            item.instance.menu = parent.instance;
                            item.instance.setLabel();
                        }
                    }
                    if (item.instance.options.after) {
                        sibling = this.items[item.instance.options.after];
                        if (sibling) {
                            sibling.element.parentNode.insertBefore(item.element, sibling.element.nextSibling);
                        }
                    }
                }
                return this;
            },
            addDialogButton: function(label, options) {
                var defaults = {
                    click: null,
                    fontAwesomeID: null
                };
                options = Base.extend(defaults, options || {});
                var button = document.createElement("button");
                button.appendChild(document.createTextNode(label));
                this.dialog.appendChild(document.createTextNode(" "));
                this.dialog.appendChild(button);
                this.dialog.appendChild(document.createTextNode(" "));
                if (options.click && typeof options.click === "function") {
                    button.addEventListener("click", options.click);
                }
                if (options.fontAwesomeID && this.options.fontAwesomeEnabled) {
                    button.removeChild(button.firstChild);
                    button.setAttribute("title", label);
                    var el = Item.getFaElement.call(null, options.fontAwesomeID);
                    button.appendChild(el);
                }
                return button;
            }
        });
        var Item = Base.extend({
            defaults: {
                label: null,
                title: "",
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
                this.className = this.options.className || this.id.toLowerCase().replace(/\s+/, "-");
                this.element = this._initElement();
                this.setLabel();
                this.element.setAttribute("title", this.options.title);
                if (typeof this.options.init === "function") {
                    this.options.init.call(this);
                }
                if (typeof this.options.isVisible === "function") {
                    this.toolbar.element.addEventListener("toolbar.show", function(evt) {
                        self.setVisibility(self.options.isVisible.call(self, evt));
                    });
                }
                if (typeof this.options.isHighlighted === "function") {
                    this.toolbar.element.addEventListener("toolbar.show", function(evt) {
                        self.setHighlight(self.options.isHighlighted.call(self, evt));
                    });
                }
            },
            _initElement: function() {
                throw new Error("_initElement not implemented");
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
            setVisibility: function(state) {
                if (state) {
                    this.element.parentNode.style.display = "block";
                } else {
                    this.element.parentNode.style.display = "none";
                }
            },
            setHighlight: function(state) {
                if (state) {
                    if (!this.element.classList.contains("editor-highlight")) {
                        this.element.classList.add("editor-highlight");
                    }
                } else {
                    this.element.classList.remove("editor-highlight");
                }
            },
            getFaElement: function(id) {
                var el = document.createElement("i");
                el.classList.add("fa", "fa-" + id);
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
                this.element.classList.add(this.toolbar.options.buttonClass, this.toolbar.options.buttonClass + "-" + this.className);
                if (typeof this.options.click === "function") {
                    this.element.addEventListener("click", function(evt) {
                        self.options.click.call(self, evt);
                    });
                }
            },
            _initElement: function() {
                return document.createElement("button");
            },
            setLabel: function(label, fontAwesomeID) {
                Item.setLabel.call(this, label, fontAwesomeID);
                if (this.menu && this.options.title) {
                    var el = document.createElement("em");
                    var text = document.createTextNode(" - " + this.options.title);
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
                this.element.classList.add(this.toolbar.options.menuClass, this.toolbar.options.menuClass + "-" + this.className);
                this.container = document.createElement("ul");
                this.container.style.display = "none";
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
            _initElement: function() {
                return document.createElement("button");
            },
            setLabel: function(label, fontAwesomeID) {
                Item.setLabel.call(this, label, fontAwesomeID);
                var fa = this.getFaElement("chevron-down");
                this.element.appendChild(document.createTextNode(" "));
                this.element.appendChild(fa);
            },
            _open: function() {
                var item, i;
                for (i in this.toolbar.items) {
                    item = this.toolbar.items[i];
                    if (Menu.isPrototypeOf(item.instance)) {
                        item.instance._canceltimer();
                        item.instance._close();
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
                }, this.options.closeDelay);
            },
            _canceltimer: function() {
                if (this.closeTimeout) {
                    clearTimeout(this.closeTimeout);
                    this.closeTimeout = null;
                }
            }
        });
        return Editor;
    }();
    editor.VERSION = "0.1.0";
    (function(Editor) {
        "use strict";
        Editor.getInlineButtonSpec = function(command, tagList, options) {
            options.isHighlighted = function() {
                return this.toolbar.editor.filterSelectionNodeName.apply(this.toolbar.editor, tagList).length > 0;
            };
            options.isVisible = function() {
                return !this.toolbar.editor.getRange().collapsed || this.options.isHighlighted.call(this);
            };
            options.click = function() {
                var editor = this.toolbar.editor, info = editor.getRangeInfo();
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
            var command = "formatblock";
            if (typeof options.command !== "undefined") {
                command = options.command;
                delete options.command;
            }
            options.click = function() {
                this.toolbar.editor.exec(command, "<" + tag + ">");
                this.toolbar.editor.showToolbar();
            };
            return options;
        };
        Editor.addDefaultMenu("blocks", {
            label: "¶",
            title: "Blocks",
            isHighlighted: function() {
                return false;
            }
        });
        Editor.addDefaultButton("p", Editor.getBlockButtonSpec("p", [ "p" ], {
            label: "¶",
            title: "Paragraph",
            className: "p",
            menu: "blocks"
        }));
        var levels = [ 1, 2, 3, 4 ];
        for (var i = 0; i < levels.length; i++) {
            Editor.addDefaultButton("h" + levels[i], Editor.getBlockButtonSpec("h" + levels[i], [ "h" + levels[i] ], {
                label: "H" + levels[i],
                title: "Title level " + levels[i],
                className: "h" + levels[i],
                menu: "blocks"
            }));
        }
        Editor.addDefaultButton("pre", Editor.getBlockButtonSpec("pre", [ "pre" ], {
            label: "<>",
            title: "Code",
            fontAwesomeID: "code",
            menu: "blocks",
            init: function() {
                var editor = this.toolbar.editor;
                editor.on("keydown", function(evt) {
                    if (evt.which === 9 && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                        var filter = editor.filterSelectionNodeName("pre");
                        if (filter.length > 0) {
                            evt.preventDefault();
                            editor.exec("insertHtml", "    ");
                        }
                    }
                });
            }
        }));
        Editor.addDefaultMenu("lists", {
            label: "Lists",
            title: "Lists",
            fontAwesomeID: "list-ul",
            isHighlighted: function() {
                return false;
            }
        });
        Editor.addDefaultButton("ul", Editor.getBlockButtonSpec("ul", [ "ul" ], {
            label: "UL",
            title: "Unordered list",
            fontAwesomeID: "list-ul",
            command: "insertunorderedlist",
            menu: "lists"
        }));
        Editor.addDefaultButton("ol", Editor.getBlockButtonSpec("ol", [ "ol" ], {
            label: "OL",
            title: "Ordered list",
            fontAwesomeID: "list-ol",
            command: "insertorderedlist",
            menu: "lists"
        }));
        Editor.addDefaultButton("bold", Editor.getInlineButtonSpec("bold", [ "b", "strong" ], {
            label: "B",
            title: "Bold",
            fontAwesomeID: "bold",
            init: function() {
                var self = this, editor = this.toolbar.editor;
                editor.on("keydown", function(evt) {
                    if (evt.which === 66 && (evt.ctrlKey || evt.metaKey)) {
                        evt.preventDefault();
                        self.options.click.call(self);
                    }
                });
            }
        }));
        Editor.addDefaultButton("italic", Editor.getInlineButtonSpec("italic", [ "i", "em" ], {
            label: "I",
            title: "Italic",
            fontAwesomeID: "italic",
            init: function() {
                var self = this, editor = this.toolbar.editor;
                editor.on("keydown", function(evt) {
                    if (evt.which === 73 && (evt.ctrlKey || evt.metaKey)) {
                        evt.preventDefault();
                        self.options.click.call(self);
                    }
                });
            }
        }));
        Editor.addDefaultButton("underline", Editor.getInlineButtonSpec("underline", [ "u", "ins" ], {
            label: "U",
            title: "Underline",
            fontAwesomeID: "underline"
        }));
        Editor.addDefaultButton("strike", Editor.getInlineButtonSpec("strikeThrough", [ "strike", "del" ], {
            label: "S",
            title: "Strike",
            fontAwesomeID: "strikethrough"
        }));
        Editor.addDefaultButton("link", {
            label: "#",
            base_title: "Link",
            title: "",
            fontAwesomeID: "link",
            isHighlighted: function() {
                var title = this.options.base_title;
                var nodes = this.toolbar.editor.filterSelectionNodeName("a");
                if (nodes.length > 0) {
                    title += ": " + nodes[0].href;
                }
                this.element.setAttribute("title", title);
                return nodes.length > 0;
            },
            isVisible: function() {
                return !this.toolbar.editor.getRange().collapsed || this.options.isHighlighted.call(this);
            },
            init: function() {
                var self = this, editor = this.toolbar.editor;
                editor.on("keydown", function(evt) {
                    if (evt.which === 75 && evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                        evt.preventDefault();
                        self.options.click.call(self);
                    }
                });
            },
            click: function() {
                var self = this, editor = this.toolbar.editor, info = editor.getRangeInfo();
                var node = editor.filterSelectionNodeName("a");
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
                var dialog = this.toolbar.dialog;
                var input = document.createElement("input");
                var label = document.createElement("label");
                label.appendChild(document.createTextNode("URL: "));
                input.setAttribute("size", 30);
                input.setAttribute("type", "text");
                label.appendChild(input);
                dialog.appendChild(label);
                this.toolbar.addDialogButton("Save", {
                    fontAwesomeID: "check",
                    click: function(evt) {
                        evt.stopImmediatePropagation();
                        self.options.restoreSelection.call(self, selection);
                        self.options.saveLink.call(self, node, input.value);
                    }
                });
                if (node) {
                    input.value = node.getAttribute("href");
                    this.toolbar.addDialogButton("Remove", {
                        fontAwesomeID: "trash-o",
                        click: function(evt) {
                            evt.stopImmediatePropagation();
                            self.options.restoreSelection.call(self, selection);
                            self.options.saveLink.call(self, node, null);
                        }
                    });
                }
                input.addEventListener("keyup", function(evt) {
                    evt.stopImmediatePropagation();
                    var ENTER = 13, ESC = 27;
                    if ([ ENTER, ESC ].indexOf(evt.which) === -1) {
                        return;
                    }
                    self.options.restoreSelection.call(self, selection);
                    if (evt.which === ESC) {
                        return;
                    }
                    self.options.saveLink.call(self, node, evt.target.value);
                });
            },
            restoreSelection: function(selection) {
                var r = this.toolbar.editor.rangy;
                r.restoreSelection(selection);
                r.removeMarkers(selection);
                this.toolbar.editor._getSelectionElement().focus();
                this.toolbar.editor.showToolbar();
            },
            saveLink: function(node, url) {
                var editor = this.toolbar.editor, info = editor.getRangeInfo();
                if (node) {
                    if (!url) {
                        var selection = editor.rangy.saveSelection();
                        info.range.replaceNodeByContents(node, true);
                        editor.rangy.restoreSelection(selection);
                        editor.rangy.removeMarkers(selection);
                    } else {
                        node.setAttribute("href", url);
                        editor.setRange(node);
                    }
                } else if (url) {
                    node = document.createElement("a");
                    node.setAttribute("href", url);
                    var contents = info.range.cloneContents();
                    for (var i = 0; i < contents.childNodes.length; i++) {
                        node.appendChild(contents.childNodes[i].cloneNode(true));
                    }
                    info.range.deleteContents();
                    info.range.insertNode(node);
                    editor.setRange(node);
                }
                editor.showToolbar();
            }
        });
        Editor.addDefaultButton("image", {
            label: "IMG",
            title: "Image",
            className: "image",
            fontAwesomeID: "picture-o",
            click: function() {
                window.alert("No implemented yet :)");
            }
        });
        Editor.addDefaultButton("embed", {
            label: "Embeded",
            title: "Embeded content",
            className: "oembed",
            fontAwesomeID: "youtube-play",
            click: function() {
                window.alert("No implemented yet :)");
            }
        });
    })(editor);
    editor.prototype.rangy = rangy;
    rangy = undefined;
    return editor;
});