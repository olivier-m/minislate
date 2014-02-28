(function(name, definition) {
    if (typeof module !== 'undefined') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        this[name] = definition();
    }
}('Foxypen', function(undefined) {

//<<-- RANGY
var rangy = {% include ".grunt/tmp/rangy-core.js" %}
rangy.config = {
    alertOnFail: false,
    alertOnWarn: false,
    checkSelectionRanges: true,
    preferTextRange: false
};

(function() {
'use strict';
{% include "src/lib/rangy-extensions.js" %}
})();
// RANGY -->>

//<<-- EDITOR
var editor = {% include "src/main.js" %}
// EDITOR -->>

//<<-- BUTTONS
(function(Editor) {
'use strict';
{% include "src/lib/editor-buttons.js" %}
})(editor);
// BUTTONS -->>

editor.prototype.rangy = rangy;
rangy = undefined;

return editor;
}));
