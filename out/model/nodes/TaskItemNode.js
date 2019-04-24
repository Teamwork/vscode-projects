"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class TaskItemNode {
    constructor(label, description, icon, id, twp) {
        this.label = label;
        this.description = description;
        this.icon = icon;
        this.id = id;
        this.twp = twp;
    }
    getTreeItem() {
        return {
            label: this.label,
            description: this.description,
            iconPath: vscode.Uri.file(path.join(this.twp._context.extensionPath, 'media', 'projects-white.svg')),
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
//# sourceMappingURL=TaskItemNode.js.map