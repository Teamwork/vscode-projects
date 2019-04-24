"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class TaskListNode {
    constructor(label) {
        this.label = label;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: "twp-TaskList",
        };
    }
    getChildren() {
        return Promise.resolve([]);
    }
}
exports.TaskListNode = TaskListNode;
//# sourceMappingURL=TaskListNode.js.map