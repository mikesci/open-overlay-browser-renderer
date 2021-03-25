function makeProperty(component, propName, defaultValue, getOverride, setOverride) {
    let existingValue;
    if (component.hasOwnProperty(propName)) {
        existingValue = component[propName];
        delete component[propName];
    }

    // define the getters and setters
    const internalPropName = "_" + propName;
    Object.defineProperty(component, propName, {
        get() {
            return (getOverride ? getOverride() : component[internalPropName]);
        },
        set(value) {
            if (setOverride)
                setOverride(value);
            else
                component[internalPropName] = value;
        }
    });

    const initialValue = (existingValue != undefined ? existingValue : defaultValue);
    if (initialValue != undefined)
        component[propName] = initialValue;
}

async function loadFont(url) {
    await new Promise((resolve, reject) => {
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.addEventListener("load", resolve);
        link.addEventListener("abort", reject);
        link.addEventListener("error", reject);
        document.head.appendChild(link);
    });
}


export {
    makeProperty,
    loadFont
};