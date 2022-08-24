define(function(require, exports, module) {
var {Tab} = require("layout/widgets/tab");

/**
 *
 * @param {Tab|TabManager} element
 * @returns {{tabs: Tab[], activeTab: Tab}}}
 */
function getCurrentPaneTabs(element) {
    if (element instanceof Tab) {
        return {
            tabs: [...element.parent.tabList],
            activeTab: element
        };
    }
    else {
        return {
            tabs: [...element.activePane.tabBar.tabList],
            activeTab: element.activeTab
        };
    }
}

/**
 *
 * @param {Tab|TabManager} el
 * @param {number} tabNum
 */
function goToTab(el, tabNum) {
    var currentPaneTabs = getCurrentPaneTabs(el);
    var tabs = currentPaneTabs.tabs;
    var activeTab = currentPaneTabs.activeTab;
    if (tabs.length > tabNum) activeTab.parent.activateTab(tabs[tabNum]);
}

exports.tabCommands = [
    {
        name: "clonetab",
        mac: "",
        win: "",
        desc: "Create a new tab with a view on the same file"
    }, {
        name: "Close Tab",
        mac: "Option-W",
        win: "Alt-W",
        desc: "close the tab that is currently active",
        position: 300,
        exec: (el) => {
            if (el instanceof Tab) {
                el.remove();
            } else {
                el.activeTab.remove();
            }
        }
    }, {
        name: "Close All Tabs",
        mac: "Option-Shift-W",
        win: "Alt-Shift-W",
        desc: "Close all opened tabs",
        position: 310,
        exec: (el) => {
            var tabs;
            if (el instanceof Tab) {
                tabs = [...el.parent.tabList];
            }
            else {
                tabs = [...el.activePane.tabBar.tabList];
            }
            for (var tab of tabs) {
                tab.remove();
            }
        }
    }, {
        name: "Close other tabs",
        mac: "Option-Ctrl-W",
        win: "Ctrl-Alt-W",
        desc: "close all opened tabs, except the tab that is currently active",
        position: 320,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;

            for (var tab of tabs) {
                if (tab != activeTab) tab.remove();
            }
        }
    }, {
        name: "Go to tab right",
        mac: "Command-}",
        win: "Ctrl-}", //TODO: doesn't work with current ace
        desc: "navigate to the next tab, right to the tab that is currently active",
        position: 330,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;

            var index = tabs.indexOf(activeTab);
            if (index < tabs.length - 1) activeTab.parent.activateTab(tabs[index + 1]);
            //TODO: seems we need better `activate` method for Tab
        }
    }, {
        name: "Go to tab left",
        mac: "Command-{",
        win: "Ctrl-{",
        desc: "navigate to the next tab, left to the tab that is currently active",
        position: 340,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;

            var index = tabs.indexOf(activeTab);
            if (index > 0) activeTab.parent.activateTab(tabs[index - 1]);
            //TODO: seems we need better `activate` method for Tab
        }
    }, {
        name: "movetabright",
        mac: "Command-Option-Shift-Right",
        win: "Ctrl-Meta-Right",
        desc: "move the tab that is currently"
            + " active to the right. Will create a split tab to the right if it's the right most tab."
    }, {
        name: "movetableft",
        mac: "Command-Option-Shift-Left",
        win: "Ctrl-Meta-Left",
        desc: "move the tab that is currently active"
            + " to the left. Will create a split tab to the left if it's the left most tab."
    }, {
        name: "movetabup",
        mac: "Command-Option-Shift-Up",
        win: "Ctrl-Meta-Up",
        desc: "move the tab that is currently active to the"
            + " up. Will create a split tab to the top if it's the top most tab."
    }, {
        name: "movetabdown",
        mac: "Command-Option-Shift-Down",
        win: "Ctrl-Meta-Down",
        desc: "move the tab that is currently active"
            + " to the down. Will create a split tab to the bottom if it's the bottom most tab."
    }, {
        name: "Go to first tab",
        mac: "Command-1",
        win: "Ctrl-1",
        desc: "navigate to the first tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 0);
        }
    }, {
        name: "Go to second tab",
        mac: "Command-2",
        win: "Ctrl-2",
        desc: "navigate to the second tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 1);
        }
    }, {
        name: "tab3",
        mac: "Command-3",
        win: "Ctrl-3",
        desc: "navigate to the third tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 2);
        }
    }, {
        name: "tab4",
        mac: "Command-4",
        win: "Ctrl-4",
        desc: "navigate to the fourth tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 3);
        }
    }, {
        name: "tab5",
        mac: "Command-5",
        win: "Ctrl-5",
        desc: "navigate to the fifth tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 4);
        }
    }, {
        name: "tab6",
        mac: "Command-6",
        win: "Ctrl-6",
        desc: "navigate to the sixth tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 5);
        }
    }, {
        name: "tab7",
        mac: "Command-7",
        win: "Ctrl-7",
        desc: "navigate to the seventh tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 6);
        }
    }, {
        name: "tab8",
        mac: "Command-8",
        win: "Ctrl-8",
        desc: "navigate to the eighth tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 7);
        }
    }, {
        name: "tab9",
        mac: "Command-9",
        win: "Ctrl-9",
        desc: "navigate to the ninth tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 8);
        }
    }, {
        name: "tab0",
        mac: "Command-0",
        win: "Ctrl-0",
        desc: "navigate to the tenth tab",
        position: 340,
        exec: (el) => {
            goToTab(el, 9);
        }
    }, {
        name: "revealtab",
        mac: "Command-Shift-L",
        win: "Ctrl-Shift-L",
        desc: "reveal current tab in the file tree"
    }, {
        name: "Go to next tab",
        mac: "Option-Tab",
        win: "Ctrl-Tab|Alt-`",
        desc: "navigate to the next tab in the stack of accessed tabs",
        position: 340,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;

            var index = tabs.indexOf(activeTab);
            if (index < tabs.length - 1) {
                activeTab.parent.activateTab(tabs[index + 1]);
            }
            else {
                activeTab.parent.activateTab(tabs[0]);
            }
        }
    }, {
        name: "Go to previous tab",
        mac: "Option-Shift-Tab",
        win: "Ctrl-Shift-Tab|Alt-Shift-`",
        desc: "navigate to the previous tab in the stack of accessed tabs",
        position: 340,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;

            var index = tabs.indexOf(activeTab);
            if (index > 0) {
                activeTab.parent.activateTab(tabs[index - 1]);
            }
            else {
                activeTab.parent.activateTab(tabs[tabs.length - 1]);
            }
        }
    }, {
        name: "nextpane",
        mac: "Option-ESC",
        win: "Ctrl-`",
        desc: "navigate to the next tab in the stack of panes"
    }, {
        name: "previouspane",
        mac: "Option-Shift-ESC",
        win: "Ctrl-Shift-`",
        desc: "navigate to the previous tab in the stack of panes"
    }, {
        name: "gotopaneright",
        mac: "Ctrl-Meta-Right",
        win: "Ctrl-Meta-Right",
        desc: "navigate to the pane on the right"
    }, {
        name: "gotopaneleft",
        mac: "Ctrl-Meta-Left",
        win: "Ctrl-Meta-Left",
        desc: "navigate to the pane on the left"
    }, {
        name: "gotopaneup",
        mac: "Ctrl-Meta-Up",
        win: "Ctrl-Meta-Up",
        desc: "navigate to the pane on the top"
    }, {
        name: "gotopanedown",
        mac: "Ctrl-Meta-Down",
        win: "Ctrl-Meta-Down",
        desc: "navigate to the pane on the bottom"
    }, {
        name: "reopenLastTab",
        mac: "Option-Shift-T",
        win: "Alt-Shift-T",
        /*exec: function () {
            return menuClosedItems.length;
        },*/
        desc: "reopen last closed tab"
    }, {
        name: "closealltotheright",
        mac: "",
        win: "",
        /*exec: function () {
            var tab = mnuContext.$tab || mnuContext.$pane && mnuContext.$pane.getTab();
            if (tab) {
                var pages = tab.pane.getTabs();
                return pages.pop() != tab;
            }
        },*/
        desc: "close all tabs to the right of the focussed tab"
    }, {
        name: "closealltotheleft",
        mac: "",
        win: "",
        /*exec: function () {
            var tab = mnuContext.$tab || mnuContext.$pane && mnuContext.$pane.getTab();
            if (tab) {
                var pages = tab.pane.getTabs();
                return pages.length > 1 && pages[0] != tab;
            }
        },*/
        desc: "close all tabs to the left of the focussed tab"
    }, {
        name: "closepane",
        mac: "Command-Ctrl-W",
        win: "Ctrl-W",
        /*exec: function () {
            return mnuContext.$tab || mnuContext.$pane || tabs.getTabs().length;
        },*/
        desc: "close this pane"
    }, {
        name: "nosplit",
        mac: "",
        win: "",
        desc: "no split"
    }, {
        name: "hsplit",
        mac: "",
        win: "",
        desc: "split the current pane in two columns and move the active tab to it"
    }, {
        name: "vsplit",
        mac: "",
        win: "",
        desc: "split the current pane in two rows and move the active tab to it"
    }, {
        name: "twovsplit",
        mac: "",
        win: "",
        desc: "create a two pane row layout"
    }, {
        name: "twohsplit",
        mac: "",
        win: "",
        desc: "create a two pane column layout"
    }, {
        name: "foursplit",
        mac: "",
        win: "",
        desc: "create a four pane layout"
    }, {
        name: "threeleft",
        mac: "",
        win: "",
        desc: "create a three pane layout with the stack on the left side"
    }, {
        name: "threeright",
        mac: "",
        win: "",
        desc: "create a three pane layout with the stack on the right side"
    }
];
});