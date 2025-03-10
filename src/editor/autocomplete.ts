import Fuse from "fuse.js";

type Option = {
  value: string;
  category: string;
};

export default class AutocompleteList extends HTMLElement {
  listEl: HTMLUListElement;
  inputEl: HTMLInputElement;
  options: Record<string, Option>;
  fuseOptions: Array<Option>;
  shownOptions:
    | Array<{ kind: "value" | "category"; value: string }>
    | undefined;
  optionEls: Record<string, HTMLLIElement>;
  // @ts-expect-error fuze issues
  fuse: Fuse.Fuse<Option>;
  selectedIndex: number | undefined;
  initialOption: string;
  focused: boolean;

  constructor() {
    super();

    this.attachShadow({ mode: "open", delegatesFocus: true });

    const wrapper = document.createElement("div");
    wrapper.classList.add("autocomplete-list");

    const style = document.createElement("style");
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

      input:disabled {
        color: #666;
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
        width: 256px;
      }

      .autocomplete-item {
        line-height: 1.2em;
        padding: .2em;
        padding-left: 0.4em;
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
    `;

    this.inputEl = document.createElement("input");
    this.inputEl.setAttribute("autocapitalize", "off");
    this.inputEl.setAttribute("autocomplete", "off");
    this.inputEl.onkeydown = (evt: KeyboardEvent) => {
      if (evt.ctrlKey) {
        // if ctrl key is pressed, let the event propagate
        if (evt.key === "Enter") {
          // but set the option if it's ctrl + enter
          this.selectOption(this.inputEl.value);
        }
        return;
      }
      if (evt.key === "Tab") {
        evt.stopPropagation();
        this.selectOption(this.inputEl.value);
      } else if (evt.key === "ArrowDown") {
        evt.stopPropagation();
        this.selectedIndex =
          this.selectedIndex === undefined ? 0 : this.selectedIndex + 1;
      } else if (evt.key === "ArrowUp") {
        evt.stopPropagation();
        this.selectedIndex =
          this.selectedIndex === undefined ? -1 : this.selectedIndex - 1;
      } else if (evt.key === "Enter") {
        evt.stopPropagation();

        if (this.selectedIndex !== undefined && this.fuseOptions.length > 0) {
          const count = this.fuseOptions.length;
          this.inputEl.value = this.shownOptions.filter(
            (o) => o.kind === "value"
          )[((this.selectedIndex % count) + count) % count].value;
        }

        this.selectOption(this.inputEl.value);
      } else if (evt.key === "Escape") {
        this.blur();
      }
    };

    this.inputEl.onkeyup = (_evt: KeyboardEvent) => {
      this.populateOptions();
    };

    wrapper.addEventListener("focusin", (_evt: FocusEvent) => {
      if (!this.focused) {
        this.initialOption = this.inputEl.value;
      }
      this.focused = true;
      if (this.listEl.classList.contains("hidden")) {
        this.listEl.classList.remove("hidden");
        this.populateOptions();
      }
    });

    wrapper.addEventListener("focusout", (evt: FocusEvent) => {
      if (!wrapper.contains(evt.relatedTarget as HTMLElement)) {
        this.selectOption(this.inputEl.value);
      } else {
        this.focused = true;
      }
    });

    this.listEl = document.createElement("ul");
    this.listEl.classList.add("hidden");

    this.shadowRoot.append(style, wrapper);
    wrapper.appendChild(this.inputEl);
    wrapper.appendChild(this.listEl);
  }

  static get observedAttributes() {
    return ["value", "disabled"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "value" && !this.focused) {
      this.inputEl.value = newValue;
      this.optionEls = {};
      this.populateOptions();
    }
    if (name === "disabled") {
      this.inputEl.disabled = newValue;
    }
  }

  connectedCallback() {
    this.inputEl.value = this.getAttribute("value");
    this.optionEls = {};
    this.populateOptions();
  }

  selectOption(value: string) {
    this.selectedIndex = undefined;
    this.inputEl.value = value;
    this.blur();
  }

  focus() {
    this.focused = true;
    this.initialOption = this.inputEl.value;
    this.inputEl.focus();
  }

  blur() {
    if (this.initialOption !== this.inputEl.value) {
      this.dispatchEvent(
        new CustomEvent("select", { detail: this.inputEl.value })
      );
      this.initialOption = this.inputEl.value;
    }
    this.focused = false;
    this.listEl.classList.add("hidden");
    this.inputEl.blur();
  }

  select() {
    this.inputEl.select();
    this.populateOptions();
  }

  populateOptions() {
    this.options = Object.fromEntries(
      [...this.querySelectorAll("option")].map((el) => [
        el.textContent,
        { value: el.textContent, category: el.dataset.category },
      ])
    );
    //@ts-expect-error fuze issues
    this.fuse = new Fuse<Option>(Object.values(this.options), {
      keys: ["value"],
      ignoreLocation: true,
      minMatchCharLength: 2,
      threshold: 0.3,
    });

    const optionsByCategory = (options: Array<Option>) =>
      [
        ...options
          .reduce(
            (acc, option) =>
              acc.set(
                option.category ?? "custom",
                (acc.get(option.category ?? "custom") ?? []).concat([
                  option.category && !acc.has(option.category)
                    ? { kind: "category", value: option.category }
                    : undefined,
                  { kind: "value", value: option.value },
                ])
              ),
            new Map()
          )
          .values(),
      ]
        .flat()
        .filter((o) => o);

    if (
      this.focused &&
      this.inputEl.value &&
      this.inputEl.selectionEnd - this.inputEl.selectionStart <
        this.inputEl.value.length
    ) {
      this.fuseOptions = this.fuse
        .search(this.inputEl.value)
        .map((searchResult) => searchResult.item);
      this.shownOptions = optionsByCategory(this.fuseOptions);
    } else {
      this.shownOptions = optionsByCategory(Object.values(this.options));
    }

    while (this.listEl.firstChild) {
      this.listEl.removeChild(this.listEl.firstChild);
    }

    let itemIdx = -1;
    const count = this.shownOptions.filter((o) => o.kind === "value").length;
    const countSelectedIndex = ((this.selectedIndex % count) + count) % count;
    this.shownOptions?.forEach((option) => {
      const itemEl = document.createElement("li");
      itemEl.classList.add(
        option.kind === "value" ? "autocomplete-item" : "autocomplete-group"
      );
      itemEl.textContent = option.value;
      itemEl.setAttribute("value", option.value);
      itemEl.setAttribute("tabIndex", "-1");
      this.listEl.appendChild(itemEl);
      if (option.kind === "value") {
        itemEl.onclick = (evt) =>
          this.selectOption((evt.target as HTMLElement).getAttribute("value"));

        itemIdx++;
        if (itemIdx === countSelectedIndex) {
          itemEl.classList.add("selected");
        }
      }

      this.optionEls[option.value] = itemEl;
    });
  }
}
