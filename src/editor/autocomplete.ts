import Fuse from "fuse.js";

type Option = {
  value: string;
  category: string;
}


export default class AutocompleteList extends HTMLElement {
  listEl: HTMLUListElement;
  inputEl: HTMLInputElement;
  options: Record<string, Option>;
  fuseOptions: Array<Option>;
  shownOptions: Array<{kind: "value" | "category", value: string}> | undefined;
  optionEls: Record<string, HTMLLIElement>;
  fuse: Fuse<Option>;
  selectedIndex: number | undefined;

  constructor() {
    super()

    this.attachShadow({mode: "open", delegatesFocus: true})

    const wrapper = document.createElement('div');
    wrapper.classList.add("autocomplete-list")

    const style = document.createElement('style')
    style.textContent = `
      .hidden {
        display: none;
      }

      input {
        color: white;
        font-family: consolas;
        margin: 0;
        border: none;
        background-color: #000;
      }

      .autocomplete-list ul {
        position: absolute;
        margin: 0;
        padding: 0;
        z-index: 999;
        list-style-type: none;
        overflow-y: auto;
        overflow-x: hidden;
        background: #000;
        max-height: 16em;
        width: 100%;
      }

      .autocomplete-item {
        line-height: 1.2em;
        padding: .2em;
        padding-left: 0.4em;
        width: 100%;
      }

      .autocomplete-item.selected, .autocomplete-item:hover {
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
        this.selectOption(this.inputEl.value)
      } else if (evt.key === "ArrowDown") {
        evt.stopPropagation();
        this.selectedIndex = this.selectedIndex === undefined ? 0 : (this.selectedIndex + 1);
      } else if (evt.key === "ArrowUp") {
        evt.stopPropagation();
        this.selectedIndex = this.selectedIndex === undefined ? -1 : (this.selectedIndex - 1);
      } else if (evt.key === "Enter") {
        evt.stopPropagation();

        if(this.selectedIndex !== undefined && this.fuseOptions.length > 0) {
          const count = this.fuseOptions.length;
          this.inputEl.value = this.fuseOptions[((this.selectedIndex % count) + count) % count].value;
        }

        this.selectOption(this.inputEl.value)
      }
    }
    this.inputEl.onkeyup = (evt: KeyboardEvent) => {

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
        this.selectOption(this.inputEl.value)
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
      this.optionEls = {};
      this.populateOptions();
    }
  }

  connectedCallback() {
    this.inputEl.value = this.getAttribute("value");

    this.optionEls = {};

    this.populateOptions();
  }

  selectOption(value: string) {
    this.selectedIndex = undefined;
    this.dispatchEvent(new CustomEvent('select', {detail: value}))
  }

  focus() {
    this.inputEl.focus();
  }

  select() {
    this.inputEl.select();
    this.populateOptions();
  }

  populateOptions() {
    this.options = Object.fromEntries([...this.querySelectorAll('option')].map(el => [el.textContent, {value: el.textContent, category: el.dataset.category}]));
    this.fuse = new Fuse<Option>(Object.values(this.options), {keys: ["value"], distance: 40, threshold: 0.4})

    const optionsByCategory = (options: Array<Option>) => 
        [...options.reduce((acc, option) => acc.set(
          option.category ?? "custom", 
          (acc.get(option.category ?? "custom") ?? [])
            .concat([option.category && !acc.has(option.category) ? {kind: "category", value: option.category} : undefined, {kind: "value", value: option.value}])
        ), new Map()).values()].flat().filter(o => o);

    if(this.inputEl.value && this.inputEl.selectionEnd - this.inputEl.selectionStart < this.inputEl.value.length) {
      this.fuseOptions = this.fuse.search(this.inputEl.value).map(searchResult => searchResult.item);
      this.shownOptions = optionsByCategory(this.fuseOptions)
    } else {
      this.shownOptions = optionsByCategory(Object.values(this.options));
    }

    while(this.listEl.firstChild) {
      this.listEl.removeChild(this.listEl.firstChild);
    }

    let itemIdx = -1;
    const count = this.shownOptions.filter(o => o.kind === "value").length;
    const countSelectedIndex = ((this.selectedIndex % count) + count) % count;
    this.shownOptions?.forEach(option => {
      const itemEl = document.createElement('li');
      itemEl.classList.add(option.kind === "value" ? "autocomplete-item" : "autocomplete-group")
      itemEl.textContent = option.value;
      itemEl.setAttribute("value", option.value);
      itemEl.setAttribute("tabIndex", "-1")
      this.listEl.appendChild(itemEl)
      if(option.kind === "value") {
        itemEl.onclick = evt => this.selectOption((evt.target as HTMLElement).getAttribute('value'))

        itemIdx++;
        if(itemIdx === countSelectedIndex) {
          itemEl.classList.add("selected")
        }
      }

      this.optionEls[option.value] = itemEl;
    })
  }
}
