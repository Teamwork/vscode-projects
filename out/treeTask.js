"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class TreeTask extends vscode.TreeItem {
    constructor(type, label, collapsibleState, command) {
        super(label, collapsibleState);
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dep.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dep.svg')
        };
        this.contextValue = 'todoItem';
        this.type = type;
        this.command = command;
    }
    get tooltip() {
        return `${this.label}-${this.label}`;
    }
    get description() {
        return `${this.label}-${this.label}`;
    }
}
exports.TreeTask = TreeTask;
//# sourceMappingURL=treeTask.js.map