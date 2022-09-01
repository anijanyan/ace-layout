import dom = require("ace-code/src/lib/dom");
import {Box} from "./widgets/box";
import {PanelBar} from "./widgets/tab";
import {SettingsSearchBox} from "./widgets/search";
import {Switcher} from "./widgets/switcher";
import {Button} from "./widgets/button";
import {Dropdown} from "./widgets/dropdown";

dom.importCssString(require("text-loader!./styles/layout.css"), "layout.css");
dom.importCssString(require("text-loader!./styles/preferences.css"), "preferences.css");

let navigation;
let app;
var preferences = new Box({
    classNames: "bar-preferences",
    toolBars: {
        top: new PanelBar({size: 31}),
    },
    0: navigation = new Box({
        size: "200px",
    }),
    1: app = new Box({
    }),
});
document.body.appendChild(preferences.render());



var resultPreferences = {}

function addState(state, prefModel) {
    // First Level
    for (var name in state) {
        if (!prefModel[name]) {
            prefModel[name] = {groupName: name}
        }
        if (state[name]["position"]) {
            prefModel[name]["position"] = state[name]["position"]
            delete state[name]["position"]
        }
        if (state[name]["type"]) {
            prefModel[name]["groupData"] = state[name]
        } else if (typeof state[name] === "object") {
            if (!prefModel[name]["subGroups"]) {
                prefModel[name]["subGroups"] = {}
            }
            addState(state[name], prefModel[name]["subGroups"])
        } else {
            prefModel[name] = state[name]
        }
    }
}
$prefs.forEach(function(state) {
    addState(state, resultPreferences)
})

console.log(resultPreferences)

function sortPreferences(preferences) {
    preferences = Object.values(preferences).map((preference) => {
        if (preference.subGroups) {
            preference.subGroups = sortPreferences(preference.subGroups)
        }
        return preference
    }).sort(function(item1, item2) {
        return item1.position - item2.position;
    });

    return preferences
}

resultPreferences = sortPreferences(resultPreferences)
console.log(resultPreferences)

var navigationHtml = []
var appHtml = []

function render() {
    renderGroup(resultPreferences)

    dom.buildDom(["div", {style: "overflow-y: scroll; height: 100%"}, navigationHtml], navigation.element)
    let preferencesNode = dom.buildDom(["div", {style: "overflow-y: scroll; height: 100%"}, appHtml], app.element)
    let searchBox = new SettingsSearchBox(preferencesNode);
    searchBox.build();
    dom.buildDom([searchBox.element], preferences.toolBars.top.element)
}

function renderGroup(preferences) {
    preferences.forEach(function(item) {
        if (item["groupData"]) {
            appHtml.push(renderItem(item["groupName"], item["groupData"]))
        }
        if (item["subGroups"]) {
            if (item["subGroups"].length > 0 && item["subGroups"][0]["groupData"])
                appHtml.push(renderItem(item["groupName"]))
            navigationHtml.push(["div", {}, item["groupName"]])
            renderGroup(item["subGroups"])
        }
    })

}

function renderItem(title, item) {
    if (item) {
        switch (item["type"]) {
            case "checkbox":
                return ["div", {class: "preferenceItem"}, ["span", {}, title], new Switcher({}).render()];
            case "textbox":
                return ["div", {class: "preferenceItem"}, ["span", {}, title], ["input", {class: "tbsimple"}]];
            case "spinner":
                return ["div", {class: "preferenceItem"}, ["span", {}, title], ["div", {class: "spinner"}, ["input", {
                    type: "number",
                    min: item["min"],
                    max: item["max"]
                }]]];
            case "checked-spinner":
                return ["div", {class: "preferenceItem"}, ["div", {class: "label"}, new Switcher({className: "checkbox"}).render(), ["span", {}, title]], ["div", {class: "spinner"}, ["input", {
                    type: "number",
                    min: item["min"],
                    max: item["max"]
                }]]];
            case "button":
                //TODO:
                return ["div", {class: "preferenceItem"}, new Button({}).render()];
            case "dropdown":
                //TODO:
                return ["div", {class: "preferenceItem"}, ["span", {}, title], new Dropdown({
                    items: item["items"],
                    width: item["width"]
                }).render()];
            case "custom":
                return ["div", {class: "preferenceItem"}, item["node"][2]];
            default:
                return [];
        }
    } else {
        return ["div", {class: "preferenceItem header"}, ["div", {}, title]]
    }
}

render();

var onResize = function () {
    preferences.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;
onResize();