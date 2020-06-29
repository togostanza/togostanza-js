import Stanza from './stanza.mjs';

export function defineStanzaElement(main, {metadata, templates, outer}) {
  const id = metadata["@id"];

  class StanzaElement extends HTMLElement {
    constructor() {
      super(...arguments);

      ensureOuterInserted(id, outer);

      const root   = this.attachShadow({mode: "open"});
      const stanza = new Stanza(root, metadata, templates);
      const params = Object.fromEntries(Array.from(this.attributes).map(({name, value}) => [name, value]));

      main(stanza, params);
    }
  }

  customElements.define(`togostanza-${id}`, StanzaElement);
}

function ensureOuterInserted(id, outer) {
  if (!outer) { return; }
  if (document.querySelector(`[data-togostanza-outer="${id}"]`)) { return; }

  const outerEl = document.createElement('div');

  outerEl.setAttribute('data-togostanza-outer', id);
  outerEl.innerHTML = outer;

  document.body.append(outerEl);

  outerEl.querySelectorAll('script').forEach((orig) => {
    const el = document.createElement('script');

    el.textContent = orig.textContent;

    Array.from(orig.attributes).forEach((attr) => {
      el.setAttribute(attr.nodeName, attr.textContent);
    });

    orig.replaceWith(el);
  });
}

// TODO check attribute updates