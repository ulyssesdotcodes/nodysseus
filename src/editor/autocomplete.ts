export default class AutocompleteList extends HTMLElement {
  listEl: HTMLUListElement;
  inputEl: HTMLInputElement;

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
        display: none;
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
        this.dispatchEvent(new CustomEvent('select', {detail: this.inputEl.value}))
      }
    }

    wrapper.addEventListener('focusin', (evt: FocusEvent) => {
      this.listEl.classList.remove("hidden")
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

    const options = Array.from(this.querySelectorAll('option'))

    const handleClick = evt => {
      this.dispatchEvent(new CustomEvent('select', {detail: evt.target.getAttribute('value')}))
    }

    options.forEach(option => {
      const itemEl = document.createElement('li');
      itemEl.textContent = option.textContent;
      itemEl.setAttribute("value", option.value);
      itemEl.setAttribute("tabIndex", "-1")
      this.listEl.appendChild(itemEl)
      itemEl.onclick = handleClick;
    })
  }
}
