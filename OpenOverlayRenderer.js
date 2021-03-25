import { makeProperty } from "./utilities.js";
import { renderOverlayArray } from "./jsonRenderer.js";
import "./OpenOverlayOverlay.js";

class OpenOverlayRenderer extends HTMLElement {

    _overlayContainer;

    constructor() {
        super();
        this._overlays = [];

        // uses a shadow root
        this.attachShadow({ mode: "open" });

        // set default styles for overlays & layers
        const style = document.createElement("style");
        this.shadowRoot.append(style);
        const styleSheet = this.shadowRoot.styleSheets[0];

        // host styles
        styleSheet.addRule(":host", "width:100%;height:100%;display: block;");
        styleSheet.addRule(":host([hidden])", "display: none;");

        styleSheet.addRule("overlay-container", "width:100%;height:100%;");

        // default styles for overlays, which will always be the immediate children of the overlay-container
        styleSheet.addRule("overlay-container > openoverlay-overlay", "display: block; width: 100%; height: 100%;");

        // default styles for layers, which will always be the direct children of overlays
        styleSheet.addRule("openoverlay-overlay > *", "display: block; position: absolute; box-sizing: border-box; object-fit: contain; object-position: center center;");

        // add the overlay container
        this._overlayContainer = document.createElement("overlay-container");
        this.shadowRoot.append(this._overlayContainer);
    }

    // #region HTMLElement
    static get observedAttributes() {
        return [];
    }

    connectedCallback() {
        makeProperty(this, "overlays", [],
            () => this._overlays,
            (value) => {
                this._overlays = value;
                // binds the overlays to the DOM
                renderOverlayArray(this._overlayContainer, value);
            });
    }

    disconnectedCallback() {
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }
    // #endregion
}

if (window.customElements)
    window.customElements.define("openoverlay-renderer", OpenOverlayRenderer);

export default OpenOverlayRenderer;