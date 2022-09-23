import event = require("ace-code/src/lib/event");
import keyUtil = require("ace-code/src/lib/keys");
import {HashHandler} from "ace-code/src/keyboard/hash_handler";
import {Ace} from "ace-code";

export class CommandManager {

    static registerCommands(commands: Ace.Command[], context?: Object) {
        var menuKb = new HashHandler(commands);

        var _this = context;
        event.addCommandKeyListener(window, function (e, hashId, keyCode) {
            var keyString = keyUtil.keyCodeToString(keyCode);
            var command = menuKb.findKeyCommand(hashId, keyString);
            if (command) {
                event.stopEvent(e);
                command.exec(_this);
            }
        });
    }
}