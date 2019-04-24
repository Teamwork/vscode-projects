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
class Api {
    getNodes(context, id, elementName, url) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            var encodedToken = new Buffer(token + ":xxx").toString("base64");
            let nodeList = [];
        });
    }
}
exports.Api = Api;
async;
getTaskLists(context, vscode.ExtensionContext, id, number);
Promise < INode[] > {
    const: url = root + '/projects/' + this.id + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=true',
    let, json = yield axios({
        method: 'get',
        url,
        auth: {
            username: token,
            password: 'xxxxxxxxxxxxx'
        }
    })
        .catch(function (error) {
        console.log(error);
    }),
    json, : .data["todo-lists"].forEach(element => {
        nodeList.push(new TaskListNode(element.name, element.id));
    }),
    return: nodeList
};
//# sourceMappingURL=api.js.map