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
const TaskListResponse_1 = require("./TaskListResponse");
const TaskListNode_1 = require("./TaskListNode");
class ProjectNode {
    constructor(label, id) {
        this.label = label;
        this.id = id;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        };
    }
    getChildren(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var request = require('request');
                var config = vscode.workspace.getConfiguration('twp');
                var token = config.get("APIKey");
                var root = config.get("APIRoot");
                if (!token || !root) {
                    vscode.window.showErrorMessage("Please Configure the extension first!");
                    return;
                }
                var encodedToken = new Buffer(token + ":xxx").toString("base64");
                request(root + '/projects/' + this.id + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=true', {
                    method: "GET",
                    headers: {
                        "Authorization": "BASIC " + encodedToken,
                        "Content-Type": "application/json"
                    }
                }, (err, res, body) => {
                    if (err) {
                        vscode.window.showErrorMessage(err);
                    }
                    var response = TaskListResponse_1.TaskListConverter.toTaskListResponse(body);
                    let nodeList = [];
                    response["todo-lists"].forEach(element => {
                        nodeList.push(new TaskListNode_1.TaskListNode(element.name));
                    });
                    return nodeList;
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(error);
                return [];
            }
        });
    }
}
exports.ProjectNode = ProjectNode;
//# sourceMappingURL=ProjectNode.js.map