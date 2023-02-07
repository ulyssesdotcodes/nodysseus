import Fuse from "fuse.js";

type Option = {
  value: string;
}


export default class AutocompleteList extends HTMLElement {
  listEl: HTMLUListElement;
  inputEl: HTMLInputElement;
  options: Record<string, Option>;
  shownOptions: Array<string> | undefined;
  optionEls: Record<string, HTMLLIElement>;
  fuse: Fuse<Option>;

  constructor() {
    super()

    this.attachShadow({mode: "open"})

    const wrapper = document.createElement('div');
    wrapper.classList.add("autocomplete-list")

    const style = document.createElement('style')
    style.textContent = `
      .hidden {
        display: none;
      }

      .autocomplete-list ul {
        list-style-type: none;
        position: absolute;
        z-index: 999;
        overflow-y: scroll;
        overflow-x: hidden;
        background: #000;
        max-height: 16em;
      }

      .autocomplete-item {
        line-height: 1.2em;
        padding: .2em;
        padding-left: .4em;
      }

      .autocomplete-item.selected {
        background: #333;
      }

      .autocomplete-group {
        line-height: 1.4em;
        padding: .2em;
        font-weight: bold;
        padding-top: .4em;
        border-top: 1px solid #111;
      }
    `

    this.inputEl = document.createElement('input')
    this.inputEl.onkeydown = (evt: KeyboardEvent) => {
      if(evt.key === "Tab") {
        evt.stopPropagation();
        this.dispatchEvent(new CustomEvent('select', {detail: this.inputEl.value}))
      }
    }
    this.inputEl.onkeyup = (evt: KeyboardEvent) => {
      if(this.inputEl.value) {
        this.shownOptions = this.fuse.search(this.inputEl.value).map(result => result.item.value);
      } else {
        this.shownOptions = undefined;
      }

      this.populateOptions();
    }

    wrapper.addEventListener('focusin', (evt: FocusEvent) => {
      if(this.listEl.classList.contains("hidden")) {
        this.listEl.classList.remove("hidden")
        this.populateOptions()
      }
    })

    wrapper.addEventListener('focusout', (evt: FocusEvent) => {
      if(!wrapper.contains(evt.relatedTarget as HTMLElement)) {
        this.listEl.classList.add("hidden")
      }
    })

    this.listEl = document.createElement('ul');
    this.listEl.classList.add("hidden")

    this.shadowRoot.append(style, wrapper)
    wrapper.appendChild(this.inputEl)
    wrapper.appendChild(this.listEl);
  }

  static get observedAttributes() {
    return ['value']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if(name === "value") {
      this.inputEl.value = newValue;
    }
  }

  connectedCallback() {
    this.inputEl.value = this.getAttribute("value");

    this.optionEls = {};

    this.populateOptions();
  }

  populateOptions() {
    this.options = Object.fromEntries([...this.querySelectorAll('option')].map(el => [el.textContent, {value: el.textContent}]));
    this.fuse = new Fuse<Option>(Object.values(this.options), {keys: ["value"], distance: 40, threshold: 0.4})

    const handleClick = evt => {
      this.dispatchEvent(new CustomEvent('select', {detail: evt.target.getAttribute('value')}))
    }

    while(this.listEl.firstChild) {
      this.listEl.removeChild(this.listEl.firstChild);
    }

    (this.shownOptions?.map(so => this.options[so]) ?? Object.values(this.options)).forEach(option => {
      const itemEl = document.createElement('li');
      itemEl.classList.add("autocomplete-item")
      itemEl.textContent = option.value;
      itemEl.setAttribute("value", option.value);
      itemEl.setAttribute("tabIndex", "-1")
      this.listEl.appendChild(itemEl)
      itemEl.onclick = handleClick;

      this.optionEls[option.value] = itemEl;
    })
  }
}
