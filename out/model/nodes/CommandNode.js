"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class TaskItemNode {
    constructor(label, description, icon, id) {
        this.label = label;
        this.description = description;
        this.icon = icon;
        this.id = id;
    }
    getTreeItem() {
        return {
            label: this.label,
            description: this.description,
            iconPath: this.icon,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "taskItem-label",
            command: {
                command: "taskOutline.showElement",
                title: "",
                arguments: [this],
            }
        };
    }
    getChildren() {
        return [];
    }
}
exports.TaskItemNode = TaskItemNode;
//# sourceMappingURL=CommandNode.js.map