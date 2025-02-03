import event = require("ace-code/src/lib/event");
import keyUtil = require("ace-code/src/lib/keys");
import {HashHandler} from "ace-code/src/keyboard/hash_handler";
import {Ace} from "ace-code";

export class CommandManager {

    static registerCommands(commands: Ace.Command[], context?: Object) {
        let menuKb = new HashHandler(commands);

        let _this = context;
        event.addCommandKeyListener(window, function (e, hashId, keyCode) {
            //@ts-expect-error fix, when types would be exposed
            let keyString = keyUtil.keyCodeToString(keyCode);
            let command = menuKb.findKeyCommand(hashId, keyString);
            if (command && command.exec) {
                event.stopEvent(e);
                command.exec(_this);
            }
        });
    }
}