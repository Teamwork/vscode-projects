"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const util_1 = require("util");
class TaskItemNode {
    constructor(label, description, icon, id, priority, hasDesk, isComplete, hasChildren, assignedTo, parentNode, contextValue, provider, twp, subTasks) {
        this.label = label;
        this.description = description;
        this.icon = icon;
        this.id = id;
        this.priority = priority;
        this.hasDesk = hasDesk;
        this.isComplete = isComplete;
        this.hasChildren = hasChildren;
        this.assignedTo = assignedTo;
        this.parentNode = parentNode;
        this.contextValue = contextValue;
        this.provider = provider;
        this.twp = twp;
        this.subTasks = subTasks;
    }
    getTreeItem() {
        return {
            label: this.label,
            description: this.description,
            iconPath: this.getIcon(this.priority, this.hasDesk, this.isComplete),
            collapsibleState: this.hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue,
            command: {
                command: "taskOutline.showElement",
                title: "",
                arguments: [this],
            }
        };
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (util_1.isNullOrUndefined(this.subTasks)) {
                    return [];
                }
                else {
                    let nodeList = [];
                    var config = vscode.workspace.getConfiguration('twp');
                    var onlySelf = config.get("OnlySelfAssigned");
                    let userData = this.twp._context.globalState.get("twp.data.activeAccount");
                    let userId = userData.userId;
                    var showUnassigned = config.get("showUnAssigned");
                    for (let i = 0; i < this.subTasks.length; i++) {
                        let element = this.subTasks[i];
                        if (!util_1.isNullOrUndefined(element["responsible-party-ids"]) && element["responsible-party-ids"].indexOf(userId.toString()) < 0 && onlySelf) {
                            continue;
                        }
                        if (util_1.isNullOrUndefined(element["responsible-party-ids"]) && !showUnassigned) {
                            continue;
                        }
                        nodeList.push(new TaskItemNode(element.content, util_1.isNullOrUndefined(element["responsible-party-summary"]) ? "Anyone" : element["responsible-party-summary"], "", element.id, element.priority, element.hasTickets, element.completed, !util_1.isNullOrUndefined(element.subTasks) && element.subTasks.length > 0, element["responsible-party-ids"], this, "taskItem", this.provider, this.twp));
                    }
                    return nodeList;
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(error);
                return [];
            }
        });
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