import elements from "./elements.js";

// merges array of json objects into the DOM
// each item must have an "id" property
function mergeDOM(parentDOM, items, onCreateUpdate) {
    // grab our DOM child elements
    let children = parentDOM.children;

    // check for array length matching up front
    // pruning up front will make adding/updating faster and the check is cheap.
    // note that when replacing items, this check will fail and pruning will happen AFTER adding/updating
    if (children.length > items.length)
        pruneChildren(children, items);

    // add or update each item
    items.forEach((item, arrayIndex) => {
        const domIndex = findChildIndexById(children, item.id);
        let itemDOM = (domIndex == -1 ? null : children[domIndex]);
        
        // if itemDOM's srcObject matches this item, it doesn't need an update
        // inversely, we need to update if itemDOM is null or the srcObject is different than item
        if (!itemDOM || itemDOM.srcObject != item) {
            itemDOM = onCreateUpdate(item, itemDOM);

            // if itemDOM is null after calling onCreateUpdate, there's an error.  bail out.
            if (!itemDOM)
                return;

            // otherwise, update srcObject
            itemDOM.srcObject = item;

            // ensure zIndex is set (reverse order - first on top!)
            /*
            const zIndex = 10000 - arrayIndex;
            if (itemDOM.style.zIndex != zIndex)
                itemDOM.style.zIndex = zIndex;
            */
        }

        if (domIndex == -1) {
            // if we're adding, ensure itemDOM has an ID specified
            itemDOM.id = item.id;
            // insert the new DOM element
            if (arrayIndex < children.length)
                parentDOM.insertBefore(itemDOM, children[arrayIndex]);
            else
                parentDOM.appendChild(itemDOM);
        } else if (domIndex != arrayIndex) {
            // we need to move the itemDOM to a new location
            // this one call will simultaneously remove and re-insert
            parentDOM.insertBefore(itemDOM, children[arrayIndex]);
        } else {
            // do nothing - itemDOM has been updated and doesn't need to be moved
        }
    });

    // check for array length again - if they don't match because we REPLACED an element, then we'll prune
    if (children.length > items.length)
        pruneChildren(children, items);
}

function pruneChildren(children, items) {
    // first, remove any items that are missing if necessary
    const idsToKeep = items.map(r => r.id);

    // collect the children to remove in an array (can't modify the array in this loop)
    let childrenToRemove = [];
    for(const child of children) {
        if (!idsToKeep.includes(child.id)) {
            childrenToRemove.push(child);
        }
    }

    // and finally remove them from the DOM
    for(const child of childrenToRemove)
        child.remove();
}

function findChildIndexById(nodeList, id) {
    for(let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].id == id)
            return i;
    }
    return -1;
}

function renderOverlayArray(containerDOM, overlayArray) {
    mergeDOM(containerDOM, overlayArray, renderOverlay);
}

function renderOverlay(overlay, overlayDOM) {
   
    if (!overlayDOM)
        overlayDOM = document.createElement("openoverlay-overlay");

    // if overlayDOM's srcObject matches this overlay, skip it - no need to update
    if (overlayDOM.srcObject == overlay)
        return overlayDOM;

    overlayDOM.assets = overlay.assets;
    overlayDOM.scripts = overlay.scripts;
    overlayDOM.settings = overlay.settings;
    overlayDOM.executeScriptsOnLoad = overlay.executeScriptsOnLoad;

    // merge the dom with the object model for layers
    mergeDOM(overlayDOM, overlay.layers, renderLayer);

    // update the srcObject property for later
    overlayDOM.srcObject = overlay;

    return overlayDOM;
}

function renderLayer(layer, layerDOM) {

    if (!layer.elementName) {
        console.error("Layer has no elementName specified.");
        return;
    }

    const element = elements[layer.elementName];
    if (!element) {
        console.error("Could not resolve element " + layer.elementName);
        return;
    }

    if (!layerDOM) {
        layerDOM = document.createElement(element.domElementName);
        layerDOM.element = element;
    } 

    // if layerDOM's srcObject matches this layer, skip it
    if (layerDOM.srcObject == layer)
        return layerDOM;

    // apply all properties, regardless if they changed
    for(const [propName, propValue] of Object.entries(layer)) {
        switch (propName) {
            case "id":
            case "elementName":
            case "label":
                // ignored properties
                break;
            default:
                layerDOM[propName] = propValue;
                break;
        }
    }


    
    return layerDOM;
}

export {
    renderOverlayArray,
    renderOverlay,
    renderLayer
};