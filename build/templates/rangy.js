(function() {  // Rangy module wrapper
var _module = {};
(function() {

{% include ".grunt/tmp/rangy/core.js" %}
}).call(_module);

var rangy = _module.rangy;
_module = undefined;

{% include ".grunt/tmp/rangy/dom.js" %}
{% include ".grunt/tmp/rangy/domrange.js" %}
{% include ".grunt/tmp/rangy/wrappedrange.js" %}
{% include ".grunt/tmp/rangy/wrappedselection.js" %}
{% include ".grunt/tmp/rangy/selectionsaverestore.js" %}

return rangy;
})();
