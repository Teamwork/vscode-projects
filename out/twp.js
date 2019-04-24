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
const path = require("path");
const vscode = require("vscode");
const templateEngine_1 = require("./adaptiveCards/templateEngine");
const expressionParser_1 = require("./adaptiveCards/expressionParser");
class TeamworkProjects {
    constructor(context, extensionPath) {
        this.context = context;
        this._disposables = [];
        this._extensionPath = extensionPath;
    }
    dispose() {
        // Clean up our resources
        this.panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    openResource(taskItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
            if (this.panel) {
                this.panel.title = taskItem.label;
                this.panel.webview.html = yield this.GetWebViewPanelData(taskItem);
            }
            else {
                this.panel = vscode.window.createWebviewPanel("twp.TaskPreview", "Task: " + taskItem.label, vscode.ViewColumn.Beside, {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(this._extensionPath, 'media'))
                    ]
                });
                this.panel.iconPath = {
                    light: vscode.Uri.file(path.join(this._extensionPath, 'media', 'projects-white.svg')),
                    dark: vscode.Uri.file(path.join(this._extensionPath, 'media', 'projects-white.svg'))
                };
                this.panel.webview.html = yield this.GetWebViewPanelData(taskItem);
            }
        });
    }
    GetWebViewPanelData(taskItem) {
        return __awaiter(this, void 0, void 0, function* () {
            var request = require('request');
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            const url = root + '/tasks/' + taskItem.id + '.json';
            const axios = require('axios');
            let json = yield axios({
                method: 'get',
                url,
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
                .catch(function (error) {
                console.log(error);
            });
            var todo = json.data["todo-item"];
            todo.datetime = Date.parse(todo.datetime).toLocaleString("ddd mm dd yyyy HH.MM UTC");
            if (json.data["todo-item"]["comments-count"] > 0) {
                const commenturl = root + '/tasks/' + taskItem.id + '/comments.json';
                let comments = yield axios({
                    method: 'get',
                    url: commenturl,
                    auth: {
                        username: token,
                        password: 'xxxxxxxxxxxxx'
                    }
                })
                    .catch(function (error) {
                    console.log(error);
                });
                var TurndownService = require('turndown');
                var turndownService = new TurndownService();
                comments.data.comments.forEach(element => {
                    var newBody = turndownService.turndown(element['html-body']);
                    newBody =
                        element.body = newBody;
                });
                json.data["todo-item"]["comments"] = comments.data.comments;
            }
            const templateFile = require(path.join(this._extensionPath, 'media/cards', 'taskCard.json'));
            var _templatePayload = templateFile;
            let template = new templateEngine_1.Template(_templatePayload);
            let context = new expressionParser_1.EvaluationContext();
            context.$root = json.data["todo-item"];
            let expandedTemplatePayload = template.expand(context);
            // Local path to main script run in the webview
            const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'media', 'main.js'));
            // And the uri we use to load this script in the webview
            const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
            // jquery
            const jqueryPath = vscode.Uri.file(path.join(this._extensionPath, 'media', 'jquery.min.js'));
            const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });
            // AdaptiveCards
            const ACPath = vscode.Uri.file(path.join(this._extensionPath, 'media', 'adaptivecards.min.js'));
            const ACUri = ACPath.with({ scheme: 'vscode-resource' });
            const MarkdownPath = vscode.Uri.file(path.join(this._extensionPath, 'media', 'markdown-it.min.js'));
            const MarkdownUri = MarkdownPath.with({ scheme: 'vscode-resource' });
            const mainstyle = vscode.Uri.file(path.join(this._extensionPath, 'media', 'msteamsstyle.css'));
            const mainstyleUri = mainstyle.with({ scheme: 'vscode-resource' });
            const ACstyle = vscode.Uri.file(path.join(this._extensionPath, 'media', 'editormain.css'));
            const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });
            const nonce = this.getNonce();
            return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cat Coding</title>
                    <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                    <script nonce="${nonce}" src="${jqueryUri}"></script>
                    <script nonce="${nonce}" src="${ACUri}"></script>
                    <script nonce="${nonce}" src="${MarkdownUri}"></script>
                    <script nonce="${nonce}" src="${scriptUri}"></script>
                    <link rel="stylesheet" href="${mainstyleUri}"  nonce="${nonce}"  type="text/css" />
                    <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                </head>
                <body>
                     <input type='hidden' id='cardData' value='${JSON.stringify(expandedTemplatePayload)}'>
                     <div id="exampleDiv"></div>
                     <div id="out"></div>
                </body>
                </html>`;
        });
    }
    getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.TeamworkProjects = TeamworkProjects;
//# sourceMappingURL=twp.js.map