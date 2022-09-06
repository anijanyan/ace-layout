import {Tab} from "../widgets/tab";
import {TabManager} from "../widgets/tabManager";

function getCurrentPaneTabs(element: Tab | TabManager): { tabs: Tab[], activeTab: Tab } {
    if (element instanceof Tab) {
        return {
            tabs: [...element.parent.tabList],
            activeTab: element
        };
    } else {
        return {
            tabs: [...element.activePane.tabBar.tabList],
            activeTab: element.activeTab
        };
    }
}

function goToTab(el: Tab | TabManager, tabNum: number) {
    var currentPaneTabs = getCurrentPaneTabs(el);
    var tabs = currentPaneTabs.tabs;
    var activeTab = currentPaneTabs.activeTab;
    var index = tabNum || tabs.indexOf(activeTab);
    TabManager.getInstance().navigateToTab(index, activeTab, tabs);
}

export var tabCommands = [
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
        exec: () => {
            var tabs = TabManager.getInstance().tabs;
            for (var i in tabs) {
                tabs[i].remove();
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
        win: "Ctrl-}", //TODO: used by ace
        desc: "navigate to the next tab, right to the tab that is currently active",
        position: 330,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;
            var index = tabs.indexOf(activeTab);
            TabManager.getInstance().navigateToTab(index + 1, activeTab, tabs);
        }
    }, {
        name: "Go to tab left",
        mac: "Command-{",
        win: "Ctrl-{", //TODO: used by ace
        desc: "navigate to the next tab, left to the tab that is currently active",
        position: 340,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;
            var index = tabs.indexOf(activeTab);
            TabManager.getInstance().navigateToTab(index - 1, activeTab, tabs);
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
        name: "Go to third tab",
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
        name: "Reveal tab",
        mac: "Command-Shift-L",
        win: "Ctrl-Shift-L", //TODO: used by ace
        desc: "reveal current tab in the file tree",
        position: 340,
        exec: (el) => {
            var path;
            if (el instanceof Tab) {
                path = el.path;
            } else {
                path = el.activeTab.path;
            }
            var fileTree = window.fileTree;
            fileTree.popup.data.some((item, i) => {
                if (item.path === path) {
                    var scrollTo = fileTree.popup.session.documentToScreenRow(i, 0);
                    fileTree.popup.session.setScrollTop(scrollTo)
                    fileTree.popup.setRow(i);
                }
            });
        }
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
                TabManager.getInstance().navigateToTab(index + 1, activeTab, tabs);
            } else {
                TabManager.getInstance().navigateToTab(0, activeTab, tabs);
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
                TabManager.getInstance().navigateToTab(index - 1, activeTab, tabs);
            } else {
                TabManager.getInstance().navigateToTab(tabs.length - 1, activeTab, tabs);
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
        name: "Close all to the right",
        mac: "",
        win: "",
        desc: "close all tabs to the right of the focussed tab",
        position: 340,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;
            var index = tabs.indexOf(activeTab);
            if (index < tabs.length - 1) {
                for (var i = index + 1; i < tabs.length; i++) {
                    tabs[i].remove();
                }
            }
        }
    }, {
        name: "Close all to the left",
        mac: "",
        win: "",
        desc: "close all tabs to the left of the focussed tab",
        position: 340,
        exec: (el) => {
            var currentPaneTabs = getCurrentPaneTabs(el);
            var tabs = currentPaneTabs.tabs;
            var activeTab = currentPaneTabs.activeTab;
            var index = tabs.indexOf(activeTab);
            if (index > 0) {
                for (var i = 0; i < index; i++) {
                    tabs[i].remove();
                }
            }
        }
    }, {
        name: "Close pane",
        mac: "Command-Ctrl-W",
        win: "Ctrl-W",
        desc: "close this pane",
        position: 340,
        exec: (el) => {
            var tabs;
            if (el instanceof Tab) {
                tabs = [...el.parent.tabList];
            } else {
                tabs = [...el.activePane.tabBar.tabList];
            }
            for (var tab of tabs) {
                tab.remove();
            }
        }
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