import saveAs from 'file-saver';
import makeDom from 'wsk-utils/dom/element/make';
import prependDom from 'wsk-utils/dom/element/prepend';
import renderReceipt from './render';
import 'scss-spinners/components/_loader.scss';
import css from './style.scss';
import receiptTemplate from './template.html';
import renderActions from './actions';

const loaderElement = makeDom('loader');
prependDom(loaderElement, document.body);

const init = (name, data, config) => {
  const fileName = `receipts--${name}`;

  config = config.split('\n').reduce((o, row) => {
    let [key, value] = row.split('\t');
    key = key.trim();
    value = (value && value.trim()) || '';
    if (key) {
      o[key] = value;
    }
    return o;
  }, {});

  const html = renderReceipt(data, receiptTemplate({ config }));

  const actions = {
    save: {
      label: 'Save',
      fn() {
        const blob = new Blob(
          [
            `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${fileName}</title><style>${css}</style></head><body>${html}</body></html>`
          ],
          { type: 'text/html;charset=utf-8' }
        );
        saveAs(blob, `${fileName}.html`);
      }
    },
    print: {
      label: 'Print',
      fn() {
        window.print();
      }
    }
  };
  const $instance = {
    renderPreview: () => renderActions(actions) + html,
    actionsHandler: (e) => {
      e.preventDefault();
      let action = e.target.getAttribute('action');
      action = actions[action];
      if (action && action.fn) {
        action.fn();
      }
    },
    run: () => {
      document.body.innerHTML = $instance.renderPreview();
      document.body.addEventListener('click', $instance.actionsHandler);
    }
  };
  return $instance;
};

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-undef
  google.script.run
    .withSuccessHandler((csv) => {
      init(csv.name, csv.data, csv.config).run();
    })
    .exportTable();
} else {
  const storageId = 'dev.data';
  const storageIdConfig = 'dev.config';

  const textarea = makeDom(
    {
      'print-cloak': '',
      style: 'width:97%',
      rows: 5,
      placeholder: 'input data (just copy rows from sheet)'
    },
    'textarea',
    localStorage.getItem(storageId) || ''
  );

  const textareaConfig = makeDom(
    {
      'print-cloak': '',
      style: 'width:97%',
      rows: 5,
      placeholder: 'config (just copy rows from sheet)'
    },
    'textarea',
    localStorage.getItem(storageIdConfig) || ''
  );

  const run = () => {
    localStorage.setItem(storageId, textarea.value);
    localStorage.setItem(storageIdConfig, textareaConfig.value);
    init('dev', textarea.value, textareaConfig.value).run();
    prependDom(textareaConfig, document.body);
    prependDom(textarea, document.body);
  };

  let timer;
  const debounceRun = () => {
    if (!loaderElement.parentElement) {
      prependDom(loaderElement, document.body);
    }
    clearTimeout(timer);
    timer = setTimeout(run, 1000);
  };

  textarea.addEventListener('input', debounceRun);
  textareaConfig.addEventListener('input', debounceRun);
  run();
}
