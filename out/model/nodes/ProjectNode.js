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
class ProjectNode {
    constructor(label, id, twp) {
        this.label = label;
        this.id = id;
        this.twp = twp;
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
                return yield this.twp.getTaskLists(context, this.id);
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