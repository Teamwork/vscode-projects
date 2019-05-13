"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class TaskItemNode {
    constructor(label, description, icon, id, priority, hasDesk, isComplete, assignedTo, parentNode, contextValue, provider, twp) {
        this.label = label;
        this.description = description;
        this.icon = icon;
        this.id = id;
        this.priority = priority;
        this.hasDesk = hasDesk;
        this.isComplete = isComplete;
        this.assignedTo = assignedTo;
        this.parentNode = parentNode;
        this.contextValue = contextValue;
        this.provider = provider;
        this.twp = twp;
    }
    getTreeItem() {
        return {
            label: this.label,
            description: this.description,
            iconPath: this.getIcon(this.priority, this.hasDesk, this.isComplete),
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue,
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
    getIcon(priority, hasDesk = false, isComplete = false) {
        if (isComplete) {
            return vscode.Uri.file(path.join(this.twp._context.extensionPath, 'resources', 'task.svg'));
        }
        if (hasDesk) {
            return {
                light: path.join(this.twp._context.extensionPath, 'resources/light', 'twdesk_light.svg'),
                dark: path.join(this.twp._context.extensionPath, 'resources/dark', 'twdesk_dark.svg'),
            };
        }
        if (priority === "") {
            return ""; //return vscode.Uri.file(path.join(this.twp._context.extensionPath, 'media', 'task.svg'));
        }
        return {
            light: path.join(this.twp._context.extensionPath, 'resources/light', `task_priority_${priority}.svg`),
            dark: path.join(this.twp._context.extensionPath, 'resources/dark', `task_priority_${priority}.svg`),
        };
    }
}
exports.TaskItemNode = TaskItemNode;
//# sourceMappingURL=TaskItemNode.js.map