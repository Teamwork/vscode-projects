"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ProjectErrorNode {
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
                command: "twp.SetProject",
                title: "",
                arguments: [],
            }
        };
    }
    getChildren() {
        return [];
    }
}
exports.ProjectErrorNode = ProjectErrorNode;
//# sourceMappingURL=ProjectErrorNode.js.map