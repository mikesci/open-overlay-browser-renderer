import OpenOverlayIframe from "./elements/OpenOverlayIframe.js";
import OpenOverlayImage from "./elements/OpenOverlayImage.js";
import OpenOverlayRectangle from "./elements/OpenOverlayRectangle.js";
import OpenOverlayText from "./elements/OpenOverlayText.js";
import { OpenOverlayVideo } from "./elements/OpenOverlayVideo.js";

const styleCategories = {
    POSITIONABLE: [
        "rect"
    ],
    STANDARD: [
        "border",
        "backgroundColor",
        "opacity",
        "padding",
        "shadow",
        "filters",
        "cornerClip",
        "3dtransform"
    ],
    TEXT: [
        "font",
        "letterSpacing",
        "textStroke",
        "textShadow",
        "lineHeight"
    ],
    FITTABLE: [
        "autoFit"
    ]
};

export default {
    image: {
        domElementName: "openoverlay-image",
        name: "Image",
        icon: "media",
        primative: true,
        preserveAspect: true,
        parameters: [
            { name: "url", displayName: "Url/Asset", type: "assetUrl", accept: "image/*", inline: true }
        ],
        allowedStyles: [
            ...styleCategories.POSITIONABLE,
            ...styleCategories.FITTABLE,
            ...styleCategories.STANDARD
        ],
        defaultStyle: { top: 0, left: 0, width: 400, height: 400 }
    },
    iframe: {
        domElementName: "openoverlay-iframe",
        name: "Iframe",
        icon: "globe-network",
        primative: true,
        preserveAspect: false,
        parameters: [
            { name: "url", type: "assetUrl", displayName: "Url/Asset", accept: "text/html" }
        ],
        allowedStyles: [
            ...styleCategories.POSITIONABLE,
            ...styleCategories.FITTABLE,
            ...styleCategories.STANDARD
        ],
    },
    rectangle: {
        domElementName: "openoverlay-rectangle",
        name: "Rectangle",
        icon: "square",
        preserveAspect: false,
        primative: true,
        parameters: [ ],
        allowedStyles: [
            ...styleCategories.POSITIONABLE,
            ...styleCategories.STANDARD
        ],
        defaultStyle: { top: 0, left: 0, width: 640, height: 360, backgroundColor: "#FF0000" }
    },
    text: {
        domElementName: "openoverlay-text",
        name: "Text",
        icon: "new-text-box",
        preserveAspect: false,
        primative: true,
        parameters: [
            { "name": "text", "displayName": "Content", "type": "textarea", "defaultValue": "text", "immediate": true }
        ],
        allowedStyles: [
            ...styleCategories.POSITIONABLE,
            ...styleCategories.TEXT,
            ...styleCategories.STANDARD
        ],
        defaultStyle: { top: 0, left: 0, width: 400, height: 400, fontFamily: "Arial", fontSize: "60px", color: "rgba(255,255,255,1)", whiteSpace: "pre" }
    },
    video: {
        domElementName: "openoverlay-video",
        name: "Video",
        icon: "video",
        primative: true,
        preserveAspect: true,
        parameters: [
            { "name": "url", "displayName": "Url/Asset", "type": "assetUrl", "accept": "video/*", inline: true },
            { "name": "volume", "type": "slider", "displayName": "Volume", "defaultValue": 100, inline: true },
            { "name": "playing", "type": "checkbox", "displayName": "Playing", "defaultValue": true, inline: true, width: 50 },
            { "name": "loop", "type": "checkbox", "displayName": "Loop", "defaultValue": false, inline: true, width: 50 },
        ],
        allowedStyles: [
            ...styleCategories.POSITIONABLE,
            ...styleCategories.FITTABLE,
            ...styleCategories.STANDARD
        ],
        defaultStyle: { top: 0, left: 0, width: 1280, height: 720 }
    }
};