"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class TaskListProvider {
    constructor(context) {
        this.context = context;
    }
    getChildren(task) {
    }
    getTreeItem(task) {
    }
}
exports.TaskListProvider = TaskListProvider;
class TreeTask extends vscode.TreeItem {
    constructor(type, label, collapsibleState, command) {
        super(label, collapsibleState);
        this.type = type;
        this.command = command;
    }
}
//# sourceMappingURL=testTree.js.map