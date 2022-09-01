export namespace Utils {
    export var findHost = function (el, constructor?: any) {
        while (el) {
            if (el.$host && (!constructor || el.$host.constructor === constructor)) return el.$host;
            el = el.parentElement;
        }
    };

    export var findNode = function (node, className) {
        while (node && node.classList) {
            if (node.classList.contains(className)) return node;
            node = node.parentNode;
        }
        return null;
    };

    export var setBox = function (el, x, y, w, h) {
        if (w) {
            w = Math.max(w, 0);
        }
        if (h) {
            h = Math.max(h, 0);
        }

        var s = el.style;

        s.left = x + "px";
        s.top = y + "px";
        s.width = w + "px";
        s.height = h + "px";
    };


    export function getEdge(style, dir) {
        return parseInt(style["padding" + dir], 10) +
            parseInt(style["margin" + dir], 10) +
            parseInt(style["border" + dir], 10);
    }

    export function getElementEdges(element) {
        var style = getComputedStyle(element);
        return {
            "top": getEdge(style, "Top"),
            "bottom": getEdge(style, "Bottom"),
            "left": getEdge(style, "Left"),
            "right": getEdge(style, "Right")
        };
    }
}

