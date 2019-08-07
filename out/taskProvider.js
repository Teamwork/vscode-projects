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
const ProjectNode_1 = require("./model/nodes/ProjectNode");
const ProjectErrorNode_1 = require("./model/nodes/ProjectErrorNode");
const util_1 = require("util");
class TaskProvider {
    constructor(context, twp) {
        this.context = context;
        this.twp = twp;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.ProjectNodes = [];
    }
    refresh(node) {
        if (node) {
            this._onDidChangeTreeData.fire(node);
        }
        this._onDidChangeTreeData.fire();
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!element) {
                    const items = [];
                    var config = yield this.twp.GetProjectForRepository();
                    if (config) {
                        config.Projects.forEach(element => {
                            var node = new ProjectNode_1.ProjectNode("Project: " + element.Name, element.Id, element.Project, this, this.twp);
                            this.ProjectNodes.push(node);
                            items.push(node);
                        });
                        return items;
                    }
                    if (!config) {
                        let userData = this.twp._context.globalState.get("twp.data.activeAccount");
                        let tempUserData = this.twp.ActiveAccount;
                        if (util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData)) {
                            userData = tempUserData;
                        }
                        if (util_1.isNullOrUndefined(userData)) {
                            items.push(new ProjectErrorNode_1.ProjectErrorNode("-> Please login first.", "", "", 0));
                            return items;
                        }
                        else {
                            let token = userData.token;
                            let root = userData.rootUrl;
                            if (util_1.isNullOrUndefined(token) || util_1.isNullOrUndefined(root) || token === "" || root === "") {
                                items.push(new ProjectErrorNode_1.ProjectErrorNode("-> Please login first.", "", "", 0));
                                return items;
                            }
                            else {
                                items.push(new ProjectErrorNode_1.ProjectErrorNode("-> Select Project for Repository", "", "", 0));
                                return items;
                            }
                        }
                    }
                }
                return element.getChildren(this.context);
            }
            catch (_a) {
                const items = [];
                items.push(new ProjectErrorNode_1.ProjectErrorNode("-> Select Project for Repository", "", "", 0));
                return items;
            }
        });
    }
    getTreeItem(element) {
        return element.getTreeItem();
    }
}
exports.TaskProvider = TaskProvider;
//# sourceMappingURL=taskProvider.js.map