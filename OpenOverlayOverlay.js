import { makeProperty } from "./utilities.js";
import ScriptingContext from "./ScriptingContext.js";

// sends events:
// assets-changed - fires whenever the assets array is changed, including when the overlay is first loaded
// load - fires when initial loading is complete, meaning all any elements have preloaded and initial assets have loaded

class OpenOverlayOverlay extends HTMLElement {

    _assets;
    _assetLoadPromise;
    _loadedAssets;
    _settings;
    _preloadPromises;
    _slot;
    _scriptingContext;

    constructor() {
        super();
        this._preloadPromises = [];
        this.onElementPreloading = this.onElementPreloading.bind(this);
        this.loadAssetsAsync = this.loadAssetsAsync.bind(this);
        this.assetsAvailable = this.assetsAvailable.bind(this);
        this.executeScripts = this.executeScripts.bind(this);
        this.resetScripts = this.resetScripts.bind(this);

        // watch for child layers to emit preloading events
        this.addEventListener("preloading", this.onElementPreloading);
    }

    connectedCallback() {
        this.style.visibility = "hidden";

        makeProperty(this, "settings", null, 
            () => this._settings,
            (value) => {
                this._settings = value;
                if (this._scriptingContext) {  this._scriptingContext.updateSettings(value); }
            });

        makeProperty(this, "executeScriptsOnLoad", true,
            () => this._executeScriptsOnLoad,
            (value) => {
                if (this._executeScriptsOnLoad == value)
                    return;

                this._executeScriptsOnLoad = value;
            });

        makeProperty(this, "assets", null,
            () => this._assets,
            (value) => {
                // if setting assets to the same source object we had before, do nothing
                if (this._assets == value)
                    return;

                this._assets = value;
                this._assetLoadPromise = this.loadAssetsAsync(value);
            });

        makeProperty(this, "scripts", null,
            () => this._scripts,
            (value) => {
                if (this._scripts == value)
                    return;

                this._scripts = value;
            });

        requestAnimationFrame(async () => {
            // wait for all preloads to complete before displaying the overlay's contents
            if (this._preloadPromises)
                await Promise.all(this._preloadPromises);

            // wait for all assets to load as well
            if (this._assetLoadPromise)
                await this._assetLoadPromise;

            this.style.visibility = "visible";

            if (this._executeScriptsOnLoad)
                this.executeScripts();

            // and emit a load event
            this.dispatchEvent(new Event("load"));
        });
    }

    disconnectedCallback() {
        // clean up assetUrls
        for(const assetUrl of this._assetUrls)
            URL.revokeObjectURL(assetUrl);
    }

    onElementPreloading(evt) {
        if (evt.detail.promise)
            this._preloadPromises.push(evt.detail.promise);
    }

    findAsset(id) {
        if (!this._loadedAssets)
            return null;

        return this._loadedAssets.find(r => r.id == id);
    }

    assetsAvailable() {
        return (this._loadedAssets != null);
    }

    loadAssetsAsync(assets) {
        // if our current asset list has any objectUrls, we need to revoke them to clean up
        if (this._loadedAssets)
            for(const asset of this._loadedAssets)
                URL.revokeObjectURL(asset.objectUrl);

        this._loadedAssets = null;

        // whenever assets are set, immediately generate the assetUrls (asynchronously)
        // then fire off an assets-changed event when it's done

        // if there's an assetLoadPromise that hasn't resolved, we're going to cancel it
        if (this._assetLoadPromise)
            this._assetLoadPromise.cancelled = true;

        // load each asset and collect the promises
        const pendingPromises = Object.entries(assets).map(([assetKey, assetValue]) => {
        const asset = {
            ...assetValue,
            // to make string comparison easier, we'll prepend a # to the id
            id: "#" + assetKey
        };

        return fetch(asset.src)
            .then(res => {
                return res.blob().then(blob => {
                    asset.objectUrl = URL.createObjectURL(blob);
                    return asset;
                })
            }, error => {
                console.error("Failed to load asset: " + error);
                asset.error = error;
                return asset;
            });
        });

        // when all assets have loaded, resolve a promise
        const assetLoadPromise = Promise.all(pendingPromises)
            .then(assets => {
                // if we've cancelled this by setting assets again quickly, bail out
                if (assetLoadPromise.cancelled)
                    return;

                // clean up the load promise since it's fulfilled
                this._assetLoadPromise = null;

                // set locally
                this._loadedAssets = assets;

                // and tell everyone assets have changed
                this.dispatchEvent(new CustomEvent("assets-changed"));
            });
        
        return assetLoadPromise;
    }

    executeScripts() {
        if (this._scriptingContext) {
            console.error("You must call resetScripts() before executing scripts again.");
            return;
        }

        const scriptingContext = new ScriptingContext(this, this._scripts, this._assets, this._settings);
        this._scriptingContext = scriptingContext;
        return scriptingContext;
    }

    resetScripts() {
        if (!this._scriptingContext) {
            console.error("No current scripting context to reset.");
            return;
        }

        this._scriptingContext.destroy();
        this._scriptingContextId = null;
    }
}

if (window.customElements)
    customElements.define("openoverlay-overlay", OpenOverlayOverlay);

export default OpenOverlayOverlay;

