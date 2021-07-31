const DataColorScheme = "data-color-scheme";

type ColorSchemeUnion = "dark" | "light";

const ColorScheme: { [K in ColorSchemeUnion]: ColorSchemeUnion } = {
  dark: "dark",
  light: "light",
};

const getCurrentColorScheme = (name: string): ColorSchemeUnion =>
  ColorScheme[name as ColorSchemeUnion] || ColorScheme.dark;

const getNextColorScheme = (isDark: boolean): ColorSchemeUnion =>
  isDark ? ColorScheme.light : ColorScheme.dark;

const toggleColorScheme = (event: Event) => {
  const target = event.target as ColorSchemeButton | null;
  if (!target) {
    return;
  }

  const isChecked = target.checked === true;
  target.checked = !isChecked;

  const html = document.documentElement;
  const currentColor = getCurrentColorScheme(
    html.getAttribute(DataColorScheme) || ""
  );
  html.setAttribute(
    DataColorScheme,
    getNextColorScheme(currentColor === ColorScheme.dark)
  );
};

class ColorSchemeButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", toggleColorScheme);

    this.attachShadow({ mode: "open" });

    this.render();
  }

  connectedCallback(): void {
    const isLight = window.matchMedia(
      `(prefers-color-scheme: ${ColorScheme.light})`
    ).matches;
    this.checked = !isLight;

    if (!this.disabled) {
      throw new Error(
        "<color-scheme-button> should has `aria-disabled` attribute at initial rendering"
      );
    }
    this.disabled = false;
  }

  set disabled(disabled: boolean) {
    this.setAttribute("aria-disabled", `${disabled}`);
  }

  get disabled(): boolean {
    return this.getAttribute("aria-disabled") === "true";
  }

  set checked(checked: boolean) {
    this.setAttribute("aria-checked", `${checked}`);
  }

  get checked(): boolean {
    return this.getAttribute("aria-checked") === "true";
  }

  set colorScheme(colorScheme: ColorSchemeUnion) {
    this.setAttribute(DataColorScheme, colorScheme);
  }

  get colorScheme(): ColorSchemeUnion {
    return getCurrentColorScheme(this.getAttribute(DataColorScheme) || "");
  }

  get label(): string {
    return this.getAttribute("label") || "";
  }

  get iconSize(): string {
    return this.getAttribute("icon-size") || "100%";
  }

  darkIcon = (label: string): string =>
    `<svg aira-label="${label}" fill="currentColor" height="${this.iconSize}" viewBox="0 0 20 20" width="${this.iconSize}" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;

  lightIcon = (label: string): string =>
    `<svg aira-label="${label}" fill="currentColor" height="${this.iconSize}" viewBox="0 0 20 20" width="${this.iconSize}" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>`;

  getStyle(): string {
    return `
      :host {
        display: inline-block;
      }

      button {
        display: flex;
        justify-content: space-between;
        border-radius: var(--color-scheme-button-icon-size);
        padding: 3px;
        position: relative;
        box-sizing: content-box;
        background: var(--color-scheme-button-color--on);
        width: calc(var(--color-scheme-button-icon-size) * 2 + 10px);
        height: var(--color-scheme-button-icon-size);
        transition: background ease-in 0.1s;
        outline: none;
        border: none;
      }

      button:focus {
        box-shadow: 0 0 0 3px var(--color-scheme-button-outline-color);
      }

      button:focus:not(:focus-visible) {
        box-shadow: none;
      }

      button::before {
        content: "";
        display: inline-block;
        border-radius: var(--color-scheme-button-icon-size);
        width: calc(var(--color-scheme-button-icon-size) + 5px);
        height: var(--color-scheme-button-icon-size);
        background: var(--color-scheme-button-color--off);
        position: absolute;
        top: 3px;
        transform: translateX(100%);
        transition: transform ease-in 0.1s, background ease-in 0.1s;
      }

      :host(color-scheme-button[aria-checked="false"]) > label > button {
        background: var(--color-scheme-button-color--off);
      }

      :host(color-scheme-button[aria-checked="false"]) > label > button::before {
        transform: translateX(0);
        background: var(--color-scheme-button-color--on);
      }

      label {
        display: inline-block;
      }

      img {
        width: calc(var(--color-scheme-button-icon-size));
        height: var(--color-scheme-button-icon-size);
        padding: 0 3px;
      }

      .dark-icon {
        color: var(--color-scheme-button-icon-color--dark);
      }

      .light-icon {
        color: var(--color-scheme-button-icon-color--light);
      }
    `;
  }

  render(): void {
    const shadow = this.shadowRoot;
    if (!shadow) {
      return;
    }

    shadow.innerHTML = `
      <style>${this.getStyle()}</style>
      <label for="switch" aria-label="${this.label}">
        <button type="button" id="switch" role="switch" aria-checked="${
          this.checked
        }">
        <span class="dark-icon">${this.darkIcon("ダークテーマ")}</span>
        <span class="light-icon">${this.lightIcon("ライトテーマ")}</span>
        </button>
      </label>
    `;
  }
}

customElements.define("color-scheme-button", ColorSchemeButton);

declare global {
  interface Window {
    ColorSchemeButton: typeof ColorSchemeButton;
  }

  interface HTMLElementTagNameMap {
    "color-scheme-button": ColorSchemeButton;
  }
}

export default ColorSchemeButton;
