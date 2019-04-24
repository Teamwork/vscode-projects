"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const CommandNode_1 = require("./CommandNode");
class InfoNode {
    constructor(label) {
        this.label = label;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: "modules-label",
        };
    }
    getChildren() {
        const items = [];
        var i = 0;
        for (i = 0; i < 10; i++) {
            items.push(new CommandNode_1.CommandNode("Hellas Friends!", "taskOutline.showElement", [i]));
        }
        return items;
    }
}
exports.InfoNode = InfoNode;
//# sourceMappingURL=InfoNode.js.map