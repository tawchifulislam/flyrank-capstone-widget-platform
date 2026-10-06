(function () {
  var script = document.currentScript;
  if (!script) {
    return;
  }
  var widgetId = script.getAttribute('data-widget-id');
  var api = script.getAttribute('data-api');
  var container = document.getElementById(
    script.getAttribute('data-container'),
  );
  if (!widgetId || !api || !container) {
    return;
  }

  function make(tag, styles, text) {
    var node = document.createElement(tag);
    if (styles) {
      node.style.cssText = styles;
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }

  function showMessage(box, text, ok) {
    box.textContent = text;
    box.style.color = ok ? '#0a7a3d' : '#b00020';
  }

  function render(config) {
    container.textContent = '';
    var wrap = make(
      'div',
      'font-family:system-ui,sans-serif;max-width:420px;border:1px solid #ddd;border-radius:8px;padding:16px;position:relative;',
    );
    wrap.appendChild(make('h3', 'margin:0 0 8px;', config.title));
    if (config.description) {
      wrap.appendChild(
        make('p', 'margin:0 0 12px;color:#555;', config.description),
      );
    }
    var form = document.createElement('form');
    var inputs = {};
    config.fields.forEach(function (field) {
      var label = make(
        'label',
        'display:block;margin-bottom:10px;font-size:14px;',
        field.label + (field.required ? ' *' : ''),
      );
      var input =
        field.type === 'textarea'
          ? make(
              'textarea',
              'display:block;width:100%;box-sizing:border-box;padding:6px;margin-top:4px;',
            )
          : make(
              'input',
              'display:block;width:100%;box-sizing:border-box;padding:6px;margin-top:4px;',
            );
      if (field.type !== 'textarea') {
        input.type =
          field.type === 'number' || field.type === 'email'
            ? field.type
            : 'text';
      }
      input.name = field.name;
      input.required = !!field.required;
      label.appendChild(input);
      form.appendChild(label);
      inputs[field.name] = { field: field, input: input };
    });
    var trap = make(
      'input',
      'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;',
    );
    trap.type = 'text';
    trap.name = 'hp_url';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    form.appendChild(trap);
    var button = make(
      'button',
      'padding:8px 14px;cursor:pointer;',
      config.buttonText,
    );
    button.type = 'submit';
    form.appendChild(button);
    var message = make('p', 'margin:10px 0 0;font-size:14px;');
    form.appendChild(message);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = {};
      Object.keys(inputs).forEach(function (name) {
        var entry = inputs[name];
        var value = entry.input.value;
        if (value === '') {
          return;
        }
        data[name] = entry.field.type === 'number' ? Number(value) : value;
      });
      button.disabled = true;
      fetch(api + '/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: widgetId,
          data: data,
          honeypot: trap.value,
        }),
      })
        .then(function (res) {
          if (res.status === 201) {
            form.reset();
            showMessage(
              message,
              'Thank you, your message has been received.',
              true,
            );
          } else if (res.status === 429) {
            showMessage(
              message,
              'Too many attempts. Please wait a moment and try again.',
              false,
            );
          } else {
            showMessage(message, 'Please check the form and try again.', false);
          }
        })
        .catch(function () {
          showMessage(message, 'Network error. Please try again.', false);
        })
        .then(function () {
          button.disabled = false;
        });
    });
    wrap.appendChild(form);
    container.appendChild(wrap);
  }

  fetch(api + '/widgets/' + encodeURIComponent(widgetId) + '/config')
    .then(function (res) {
      if (!res.ok) {
        throw new Error('config request failed');
      }
      return res.json();
    })
    .then(render)
    .catch(function () {
      container.textContent = '';
    });
})();
