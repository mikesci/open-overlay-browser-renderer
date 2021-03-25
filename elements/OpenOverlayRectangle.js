import _elementBase from "./_elementBase.js";

class OpenOverlayRectangle extends _elementBase {
    
    constructor() {
        super();
    }
}

if (window.customElements)
    customElements.define("openoverlay-rectangle", OpenOverlayRectangle);

export default OpenOverlayRectangle;