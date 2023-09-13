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
    shownOptions: Array<{
        kind: "value" | "category";
        value: string;
    }> | undefined;
    optionEls: Record<string, HTMLLIElement>;
    fuse: Fuse.default<Option>;
    selectedIndex: number | undefined;
    initialOption: string;
    focused: boolean;
    constructor();
    static get observedAttributes(): string[];
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
    connectedCallback(): void;
    selectOption(value: string): void;
    focus(): void;
    select(): void;
    populateOptions(): void;
}
export {};
