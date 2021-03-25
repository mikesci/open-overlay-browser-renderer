import _elementBase from "./_elementBase.js";
import { makeProperty } from "../utilities.js";

const YOUTUBE_URL_REGEX = /.*(?:www\.youtube\.com\/(?:(?:watch\?v=)|(?:embed\/))|(?:youtu\.be\/))([a-z0-9]+)(?:\?(?:(?:t)|(?:start))=(\d+))?/i;

function getYoutubeVideoId(url) {
    const match = url.match(YOUTUBE_URL_REGEX);
    return (match ? match[1] : null);
}

class OpenOverlayVideo extends _elementBase {

    _subelement;

    constructor() {
        super();
        this.ensureSubelement = this.ensureSubelement.bind(this);
        this.getNaturalDimensions = this.getNaturalDimensions.bind(this);
        this.onAssetsChanged = this.onAssetsChanged.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();

        makeProperty(this, "autoplay", false,
            () => this._autoplay,
            (value) => {
                this._autoplay = value;
                if (this._subelement)
                    this._subelement.autoplay = value;
            });

        makeProperty(this, "src", null,
            () => this._src,
            (value) => {
                // unreference prior asset if needed
                if (this._src && this._src.startsWith("#"))
                    this.unreferenceAsset("src");

                // check if this is a youtube video URL
                const youtubeVideoId = getYoutubeVideoId(value);

                this.ensureSubelement(youtubeVideoId != null);

                this._subelement.style.objectFit = this._objectFit;
                this._subelement.style.objectPosition = this._objectPosition;
                this._subelement.autoplay = this._autoplay;
                this._subelement.videoId = youtubeVideoId;

                if (!youtubeVideoId) {
                    if (value.startsWith("#")) {
                        if (this._overlay.assetsAvailable()) {
                            const asset = this._overlay.findAsset(value);
                            if (asset) {
                                this.referenceAsset("src", value);
                                this._subelement.src = (asset ? asset.objectUrl : null);
                            } else {
                                console.error("Could not find asset " + value);
                                this._subelement.src = null;
                            }
                        }
                    }
                    else {
                        this._subelement.src = value;
                    }
                } 

                this._src = value;
            });

        makeProperty(this, "objectFit", null,
            () => this._objectFit,
            (value) => { this._objectFit = value; this._img.style.objectFit = value; });

        makeProperty(this, "objectPosition", null,
            () => this._objectPosition,
            (value) => { this._objectPosition = value; this._img.style.bjectPosition = value; });

        // trigger a set to src whenever assets change and we have an active asset reference
        this._overlay.addEventListener("assets-changed", this.onAssetsChanged);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._overlay.removeAssetListener("assets-changed", this.onAssetsChanged);
    }

    onAssetsChanged() {
        this.src = this._src;
    }

    ensureSubelement(isYoutube) {
        if (isYoutube && !(this._subelement instanceof OpenOverlayVideoYouTube)) {
            if (this._subelement)
                this.removeChild(this._subelement);
            
            this._subelement = document.createElement("openoverlay-video-youtube");
            this.appendChild(this._subelement);
        } else if (!isYoutube && !(this._subelement instanceof HTMLVideoElement)) {
            if (this._subelement)
                this.removeChild(this._subelement);
            
            this._subelement = document.createElement("video");
            this._subelement.style = "width:100%;height:100%;";
            this.appendChild(this._subelement);
        }
    }

    getNaturalDimensions() {
        // youtube doesn't provide an API to get video sizes (or even aspect ratios), so we'll fix this to a good default
        // 1280x720 should look good in most cases
        if (this._subelement instanceof OpenOverlayVideoYouTube)
            return { width: 1280, height: 720 };

        if (this._subelement instanceof HTMLVideoElement)
            return { width: this._subelement.videoWidth, height: this._subelement.videoHeight };

        return null;
    }
}

class OpenOverlayVideoYouTube extends HTMLElement {

    _target;
    _apiReadyPromise;
    _playerReadyPromise;
    
    get videoId() { return this._videoId; }
    set videoId(value) {
        this._videoId = value;
        // update the youtube player when video changes
        if (this._playerReadyPromise) {
            this._playerReadyPromise.then(player => {
                player.loadVideoById(this._videoId);
            });
        }
    }

    get autoplay() { return this._autoplay; }
    set autoplay(value) { this._autoplay = value; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._getVideoUrl = this._getVideoUrl.bind(this);
        this._ensureYoutubeAPILoaded = this._ensureYoutubeAPILoaded.bind(this);
        
        const wrapper = document.createElement("div");
        wrapper.style = "overflow:hidden;height:100%;width:100%;";
        this.shadowRoot.append(wrapper);

        const interactionBlocker = document.createElement("div")
        interactionBlocker.style = "position:absolute;top:0;left:0;width:100%;height:100%;";
        wrapper.append(interactionBlocker);

        const target = document.createElement("div");
        wrapper.append(target);
        this._target = target;

        this._ensureYoutubeAPILoaded();
    }

    _getVideoUrl() {
        return `http://www.youtube.com/v/${this._videoId}?version=3`;
    }

    _ensureYoutubeAPILoaded() {
        this._apiReadyPromise = new Promise((resolve) => {
            // if window.YT is defined, we're already loaded
            if (window.YT) {
                resolve();
                return;
            }

            // look through the header for the API script to determine if some other code is currently loading the youtube API script
            // otherwise, we need to load the iframe API
            let youtubeApiScriptElement = document.querySelector("script[src='https://www.youtube.com/iframe_api']");

            if (!youtubeApiScriptElement) {
                youtubeApiScriptElement = document.createElement("script");
                youtubeApiScriptElement.src = "https://www.youtube.com/iframe_api";
                document.head.append(youtubeApiScriptElement);
            }

            if (window.onYouTubeIframeAPIReady) {
                const existingApiReadyFunction = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = () => {
                    existingApiReadyFunction();
                    resolve();
                };
            } else {
                window.onYouTubeIframeAPIReady = resolve;
            }
        });

        // dispatch a preloading event so the overlay won't show until we've got something to render
        this.dispatchEvent(new CustomEvent("preloading", { detail: { promise: this._apiReadyPromise }, bubbles: true }));
    }

    connectedCallback() {
        makeProperty(this, "videoId", null,
            () => this._videoId,
            (value) => {
                this._videoId = value;
                // update the youtube player when video changes
                if (this._playerReadyPromise) {
                    this._playerReadyPromise.then(player => {
                        if (this._videoId) {
                            if (this._autoplay)
                                player.loadVideoById(this._videoId);
                            else
                                player.cueVideoById(this._videoId);
                        } else {
                            player.stopVideo();
                        }
                    });
                }
            });

        makeProperty(this, "autoplay", null,
            () => this._autoplay,
            (value) => { this._autoplay = value; });

        this._playerReadyPromise = new Promise((resolve) => {
            this._apiReadyPromise.then(() => {
                const player = new YT.Player(this._target, {
                    width: "100%",
                    height: "100%",
                    playerVars: { 'controls': 0, 'modestbranding': 1 },
                    events: {
                        onReady: () => {
                            resolve(player);
                        }
                    }
                });
            });
        });

        this.dispatchEvent(new CustomEvent("preloading", { detail: { promise: this._playerReadyPromise }, bubbles: true }));
    }

    disconnectedCallback() {
    }
}

if (window.customElements) {
    customElements.define("openoverlay-video", OpenOverlayVideo);
    customElements.define("openoverlay-video-youtube", OpenOverlayVideoYouTube);
}

export { OpenOverlayVideo, OpenOverlayVideoYouTube };