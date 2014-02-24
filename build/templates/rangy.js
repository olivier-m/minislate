(function() {  // Rangy module wrapper
var _module = {};
(function() {

{% include "tmp/rangy/core.js" %}
}).call(_module);

var rangy = _module.rangy;
_module = undefined;

{% include "tmp/rangy/dom.js" %}
{% include "tmp/rangy/domrange.js" %}
{% include "tmp/rangy/wrappedrange.js" %}
{% include "tmp/rangy/wrappedselection.js" %}
{% include "tmp/rangy/selectionsaverestore.js" %}

return rangy;
})();
