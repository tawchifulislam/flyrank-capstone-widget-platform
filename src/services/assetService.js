const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const bundlePath = path.join(__dirname, '..', 'public', 'widget-bundle.js');
const bundleSource = fs.readFileSync(bundlePath, 'utf8');
const bundleHash = crypto
  .createHash('sha256')
  .update(bundleSource)
  .digest('hex')
  .slice(0, 10);

const loaderSource = `(function () {
  var script = document.currentScript;
  if (!script) {
    return;
  }
  var url = new URL(script.src);
  var id = url.searchParams.get('id');
  if (!id) {
    return;
  }
  var box = document.createElement('div');
  box.id = 'lead-widget-' + id;
  script.parentNode.insertBefore(box, script.nextSibling);
  var bundle = document.createElement('script');
  bundle.async = true;
  bundle.src = url.origin + '/assets/widget.${bundleHash}.js';
  bundle.setAttribute('data-widget-id', id);
  bundle.setAttribute('data-api', url.origin);
  bundle.setAttribute('data-container', box.id);
  document.head.appendChild(bundle);
})();
`;

module.exports = { bundleSource, bundleHash, loaderSource };
