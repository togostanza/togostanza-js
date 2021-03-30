import { grouping, unwrapValueFromBinding } from '../utils.mjs';

export default class Stanza {
  constructor(host, metadata, templates, url) {
    this.host        = host;
    this.root        = host.shadowRoot;
    this.metadata    = metadata;
    this.url         = url;

    const bbox = document.createElement('div');
    bbox.style.position = 'relative';

    const main = document.createElement('main');
    main.style.overflow = 'auto';
    bbox.appendChild(main);

    this.menu = document.createElement('togostanza--menu');
    this.menu.setAttribute('href', url.replace(/\.js$/, '.html'));
    this.setMenuPlacement(host.getAttribute('togostanza-menu-placement'));

    bbox.appendChild(this.menu);

    this.root.appendChild(bbox);

    // TODO migrate
    this.grouping               = grouping;
    this.unwrapValueFromBinding = unwrapValueFromBinding;
  }

  setMenuPlacement(placement) {
    if (placement) {
      this.menu.setAttribute('placement', placement);
    } else {
      this.menu.removeAttribute('placement');
    }
  }

  select(selector) {
    return this.root.querySelector(selector);
  }

  selectAll(selector) {
    return this.root.querySelectorAll(selector);
  }

  async query({template, parameters, endpoint, method}) {
    const sparql  = this.templates[template](parameters);
    const payload = new URLSearchParams();

    payload.set('query', sparql);

    // NOTE specifying Content-Type explicitly because some browsers sends `application/x-www-form-urlencoded;charset=UTF-8` without this, and some endpoints may not support this form.
    return await fetch(endpoint, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept':       'application/sparql-results+json'
      },
      body: payload
    }).then((res) => res.json());
  }
}
