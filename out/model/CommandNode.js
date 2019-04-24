"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class CommandNode {
    constructor(label, command, args) {
        this.label = label;
        this.command = command;
        this.args = args;
    }
    getTreeItem() {
        return this.createCommandItem(this.label, this.command, this.args);
    }
    getChildren() {
        return [];
    }
    createCommandItem(label, command, args) {
        const commandItem = new vscode.TreeItem(label);
        commandItem.command = {
            command,
            title: "",
            arguments: args,
        };
        return commandItem;
    }
}
exports.CommandNode = CommandNode;
//# sourceMappingURL=CommandNode.js.map