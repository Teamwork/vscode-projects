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
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "taskItem-label",
        };
    }
    getChildren() {
        return [];
    }
}
exports.TaskListNode = TaskListNode;
//# sourceMappingURL=TaskItemNode.js.map