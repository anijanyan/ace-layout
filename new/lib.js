    exports.findHost = function(el, constructor) {
        while (el) {
            if (el.$host && (!constructor || el.$host.constructor === constructor)) return el.$host;
            el = el.parentElement;
        }
    };

    exports.findNode = function(node, className) {
        while (node && node.classList) {
            if (node.classList.contains(className)) return node;
            node = node.parentNode;
        }
        return null;
    };

    exports.setBox = function(el, x, y, w, h) {
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
