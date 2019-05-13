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
const fs = require("fs");
const templateEngine_1 = require("./adaptiveCards/templateEngine");
const expressionParser_1 = require("./adaptiveCards/expressionParser");
const TaskListNode_1 = require("./model/nodes/TaskListNode");
const TaskItemNode_1 = require("./model/nodes/TaskItemNode");
const ProjectQuickTip_1 = require("./model/nodes/ProjectQuickTip");
const projectConfig_1 = require("./model/projectConfig");
const teamworkProjectsApi_1 = require("./teamworkProjectsApi");
class TeamworkProjects {
    constructor(context, extensionPath) {
        this.context = context;
        this.IsLoading = false;
        this._disposables = [];
        this._context = context;
        this._extensionPath = extensionPath;
        this.API = new teamworkProjectsApi_1.TeamworkProjectsApi();
    }
    dispose() {
        // Clean up our resources
        this.panel.dispose();
        this.panel = null;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    openResource(taskItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const column = vscode.ViewColumn.Beside;
            if (this.panel) {
                this.panel.reveal(column);
                this.panel.title = taskItem.label;
                this.panel.webview.html = this.GetWebViewContentLoader();
                this.panel.webview.html = yield this.GetWebViewContent(taskItem.id);
            }
            else {
                this.panel = vscode.window.createWebviewPanel("twp.TaskPreview", "Task: " + taskItem.label, vscode.ViewColumn.Beside, {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(this._extensionPath, 'media'))
                    ]
                });
                this.panel.iconPath = {
                    light: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg')),
                    dark: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg'))
                };
                this.panel.webview.html = this.GetWebViewContentLoader();
                this.panel.webview.html = yield this.GetWebViewContent(taskItem.id);
                this.panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                    var data = JSON.parse(message.text);
                    switch (data.type) {
                        case 'comment':
                            this.panel.webview.html = this.GetWebViewContentLoader();
                            this.CreateComment(data.taskId, data.comment);
                            return;
                        case 'complete':
                            this.panel.webview.html = this.GetWebViewContentLoader();
                            this.CompleteTask(data.taskId);
                            return;
                    }
                }));
                this.panel.onDidDispose(task => {
                    this.dispose();
                });
            }
        });
    }
    CreateComment(taskItem, content) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            const url = root + '/tasks/' + taskItem + '/comments.json';
            var comment = {
                "comment": {
                    "body": "" + content + "",
                    "notify": "false",
                    "isPrivate": false,
                    "content-type": "text",
                    "ParseMentions": true,
                }
            };
            let json = yield axios({
                method: 'post',
                url: url,
                data: comment,
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
                .catch(function (error) {
                console.log(comment);
                console.log(error);
            });
            this.panel.webview.html = yield this.GetWebViewContent(taskItem, true);
        });
    }
    CompleteTask(taskItem) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            const url = root + '/tasks/' + taskItem + '/complete.json';
            let json = yield axios({
                method: 'put',
                url: url,
                data: "",
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
                .catch(function (error) {
                console.log(error);
            });
            this.panel.webview.html = yield this.GetWebViewContent(taskItem, true);
        });
    }
    GetPeopleQuickTips(people, assignedTo) {
        return __awaiter(this, void 0, void 0, function* () {
            let personTips = [];
            people.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                var IsPicked = false;
                if (assignedTo.includes(element.id)) {
                    IsPicked = true;
                }
                personTips.push(new ProjectQuickTip_1.PersonQuickTip(element["first-name"] + " " + element["last-name"], element.id, IsPicked));
            }));
            return personTips;
        });
    }
    AssignTask(node) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    GetWebViewContent(taskItem, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var config = vscode.workspace.getConfiguration('twp');
            var showTeamworkPanel = config.get("ShowTeamworkPanel");
            if (showTeamworkPanel) {
                return yield this.GetWebViewContentTeamwork(taskItem, force);
            }
            else {
                return yield this.GetWebViewContentAdaptiveCard(taskItem, force);
            }
        });
    }
    GetWebViewContentLoader() {
        // jquery
        const jqueryPath = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
        const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });
        const nonce = this.getNonce();
        const ACstyle = vscode.Uri.file(path.join(this._extensionPath, 'media/css', 'loader.css'));
        const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });
        return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                    </head>
                    <body style='background:#2D2B2C;height:800px;width:400px;'>
                            <div id="app-loader" class="app-loader" >
                            <svg class="app-loader__-logo" xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 160 128">
                                <defs>
                                    <style>
                                        .cls-1 {
                                            fill: #ffffff;
                                        }
                        
                                        .cls-2 {
                                            fill: #ffffff;
                                        }
                                    </style>
                                </defs>
                                <circle class="cls-1" cx="118" cy="86" r="12"></circle>
                                <path class="cls-2" d="M160,48a32,32,0,0,0-32-32H63.59A20.07,20.07,0,0,0,44,0H20A20.06,20.06,0,0,0,0,20V96a32,32,0,0,0,32,32h96a32,32,0,0,0,32-32Zm-32,64H32A16,16,0,0,1,16,96V32H128a16,16,0,0,1,16,16V96A16,16,0,0,1,128,112Z"></path>
                            </svg>
                            <p class="w-app-preloading__installation-name" style='color:#ffffff'>
                                please wait...
                            </p>
                            <div class="app-loader__loading-bar"></div>
                        </div>
                    </body>
                    </html>`;
    }
    GetWebViewContentAdaptiveCard(taskItem, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var todo = yield this.API.getTodoItem(this._context, taskItem, force);
            if (todo) {
                const templateFile = require(path.join(this._extensionPath, 'media/cards', 'taskCard.json'));
                var _templatePayload = templateFile;
                let template = new templateEngine_1.Template(_templatePayload);
                let context = new expressionParser_1.EvaluationContext();
                context.$root = todo;
                let expandedTemplatePayload = template.expand(context);
                // Local path to main script run in the webview
                const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'mainAdaptive.js'));
                // And the uri we use to load this script in the webview
                const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
                // jquery
                const jqueryPath = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
                const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });
                // AdaptiveCards
                const ACPath = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'adaptivecards.min.js'));
                const ACUri = ACPath.with({ scheme: 'vscode-resource' });
                const MarkdownPath = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'markdown-it.min.js'));
                const MarkdownUri = MarkdownPath.with({ scheme: 'vscode-resource' });
                const mainstyle = vscode.Uri.file(path.join(this._extensionPath, 'media/css', 'msteamsstyle.css'));
                const mainstyleUri = mainstyle.with({ scheme: 'vscode-resource' });
                const ACstyle = vscode.Uri.file(path.join(this._extensionPath, 'media/css', 'editormain.css'));
                const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });
                const nonce = this.getNonce();
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">

                        <link rel="stylesheet" href="${mainstyleUri}"  nonce="${nonce}"  type="text/css" />
                        <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                    </head>
                    <body>
                        <div id="exampleDiv"></div>
                        <div id="out"></div>
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${ACUri}"></script>
                        <script nonce="${nonce}" src="${MarkdownUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <div id="divData" style='display:none;'>
                            ${JSON.stringify(expandedTemplatePayload)}
                        </div>
                    </body>
                    </html>`;
            }
        });
    }
    GetWebViewContentTeamwork(taskItem, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var config = vscode.workspace.getConfiguration('twp');
            var root = config.get("APIRoot");
            var auth = "Basic " + Buffer.from(config.get("APIKey") + ":xxxxxx").toString("base64");
            var todo = yield this.API.getTodoItem(this._context, taskItem);
            if (todo) {
                const nonce = this.getNonce();
                const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'mainTeamwork.js'));
                // And the uri we use to load this script in the webview
                const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
                // jquery
                const jqueryPath = vscode.Uri.file(path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
                const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <script type="text/javascript" nonce="${nonce}">
                            $(document).ready(function () {
        
                                $.ajax({
                                    url: '${root}' + 'me.json',
                                    headers: {
                                        'Authorization': '${auth}',
                                    },
                                    dataType: 'json',
                                    method: 'GET',
                                    crossDomain: true,
                                    success: function(data) {

                                    },
                                    error: function() {
                                        var frameUrl = '${root}' + '?embeddedView=1#embed?view=viewTask&params=' + encodeURIComponent(JSON.stringify({ taskId: parseInt("${taskItem}") }))
                                        $('#frmTasks').attr('src', frameUrl);
                                    },
                                    xhrFields: {
                                        withCredentials: true
                                    }
                                });
                            });
    
                        </script>
                    </head>
                    <body>
                        <iframe id="frmTasks" allowtransparency="true" frameborder="0" style="display:none;overflow:hidden;height:97%;width:100%" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-scripts allow-same-origin"></iframe>
                    </body>
                    </html>`;
            }
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
    QuickAddTask() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.IsLoading) {
                return;
            }
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("You need to have code selected to use this.");
            }
            var workspaceRoot = vscode.workspace.rootPath;
            var fileName = editor.document.fileName.replace(workspaceRoot, "");
            var selection = editor.selection;
            var line = selection.start.line;
            var text = editor.document.getText(selection);
            var list = yield this.GetTaskListQuickTip(true);
            if (list !== null && list.length > 0) {
                const taskList = yield vscode.window.showQuickPick(list, { placeHolder: "Select Tasklist", ignoreFocusOut: true, canPickMany: false });
                if (taskList !== null) {
                    const result = yield vscode.window.showInputBox({
                        placeHolder: 'Task Title @person [today|tomorrow]',
                    });
                    var taskDescription = "Task added from VSCode: \n";
                    taskDescription += "File: " + fileName + "\n";
                    taskDescription += "Line: " + line + "\n";
                    taskDescription += "Error Notes: " + "\n";
                    taskDescription += text;
                    var newTask = yield this.API.postTodoItem(this._context, parseInt(this.Config.ActiveProjectId), parseInt(taskList.id), result, taskDescription);
                    var config = vscode.workspace.getConfiguration('twp');
                    var root = config.get("APIRoot");
                    var id = newTask["data"]["taskIds"];
                    var taskText = "#Task: " + root + "/tasks/" + id + "\n";
                    editor.edit(edit => {
                        edit.insert(new vscode.Position(line - 1, 0), taskText);
                    });
                    vscode.window.showInformationMessage("Task was added");
                }
            }
        });
    }
    RefreshData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.IsLoading) {
                return;
            }
            this.IsLoading = true;
            this.statusBarItem.text = "Teamwork: Updating Projects";
            if (this.Config === null) {
                this.Config = yield this.GetProjectForRepository();
            }
            this.Config.Projects.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                this.statusBarItem.text = "Teamwork: Refreshing TaskLists";
                element.Project.TodoLists = yield this.API.getTaskLists(this._context, element.Id, true);
                this.statusBarItem.text = "Teamwork: Refreshing TodoItems";
                element.Project.TodoLists.forEach((subelement) => __awaiter(this, void 0, void 0, function* () {
                    subelement.TodoItems = yield this.API.getTaskItems(this._context, parseInt(subelement.id), true);
                }));
                this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
            }));
            this.IsLoading = false;
        });
    }
    toProjectListResponse(json) {
        return JSON.parse(json);
    }
    GetProjectQuickTips(force = false, selected, includePeople = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeList = [];
            let projects = yield this.API.GetProjects(this._context, force, includePeople);
            this.Projects.forEach(element => {
                var isPicked = false;
                if (selected && selected.length > 0 && selected.find(p => p.Id.toString() === element.id)) {
                    isPicked = true;
                }
                var item = new ProjectQuickTip_1.ProjectQuickTip(element.name, element.id, isPicked);
                nodeList.push(item);
            });
            this._context.globalState.update("twp.data.projects", projects);
            this._context.globalState.update("twp.data.projects.lastUpdated", Date.now());
            return nodeList;
        });
    }
    GetTaskListQuickTip(force = false, includePeople = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeList = [];
            this.Config.Projects.forEach(element => {
                if (element.Id.toString() === this.Config.ActiveProjectId) {
                    if (element.Project.TodoLists && element.Project.TodoLists.length > 0) {
                        element.Project.TodoLists.forEach(subelement => {
                            var item = new ProjectQuickTip_1.ProjectQuickTip(subelement.name, subelement.id, false);
                            nodeList.push(item);
                        });
                    }
                    else {
                        vscode.window.showInformationMessage("Please wait for Project data to be loaded");
                        this.RefreshData();
                        return null;
                    }
                }
            });
            return nodeList;
        });
    }
    GetProjectForRepository() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var path = vscode.workspace.rootPath + "/twp.json";
                let config;
                if (fs.existsSync(path)) {
                    config = JSON.parse(fs.readFileSync(path, 'utf8'));
                    if (config) {
                        return config;
                    }
                }
                else {
                    return new projectConfig_1.ProjectConfig(null);
                }
            }
            catch (error) {
                console.error(error);
                return new projectConfig_1.ProjectConfig(null);
            }
        });
    }
    SelectProject() {
        return __awaiter(this, void 0, void 0, function* () {
            let savedConfig = yield this.GetProjectForRepository();
            const projectItem = yield vscode.window.showQuickPick(this.GetProjectQuickTips(true, savedConfig.Projects), { placeHolder: "Select Projects", ignoreFocusOut: true, canPickMany: true });
            if (projectItem) {
                var items = [];
                projectItem.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    items.push(new projectConfig_1.ProjectConfigEntry(element.label, element.id, element));
                }));
                var config = new projectConfig_1.ProjectConfig(items);
                var path = vscode.workspace.rootPath + "/twp.json";
                let data = JSON.stringify(config);
                fs.writeFileSync(path, data);
                this.RefreshData();
                vscode.commands.executeCommand("taskOutline.refresh");
                return config;
            }
        });
    }
    SelectActiveProject() {
        return __awaiter(this, void 0, void 0, function* () {
            let savedConfig = yield this.GetProjectForRepository();
            let nodeList = [];
            savedConfig.Projects.forEach(element => {
                var isPicked = false;
                if (parseInt(savedConfig.ActiveProjectId) === element.Id) {
                    isPicked = true;
                }
                var item = new ProjectQuickTip_1.ProjectQuickTip(element.Name, element.Id.toString(), isPicked);
                nodeList.push(item);
            });
            const projectItem = yield vscode.window.showQuickPick(nodeList, { placeHolder: "Select Active Project", ignoreFocusOut: true, canPickMany: false });
            if (projectItem) {
                savedConfig.ActiveProjectId = projectItem.id;
                savedConfig.ActiveProjectName = projectItem.name;
                this.statusBarItem.text = "Active Project: " + projectItem;
                var path = vscode.workspace.rootPath + "/twp.json";
                let data = JSON.stringify(savedConfig);
                fs.writeFileSync(path, data);
                this.RefreshData();
                vscode.commands.executeCommand("taskOutline.refresh");
                return savedConfig;
            }
        });
    }
    getTaskLists(context, parentNode, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var statusBarText = this.statusBarItem.text;
            this.statusBarItem.text = "Loading Tasklists......";
            // Load task lists
            var taskLists = yield this.API.getTaskLists(context, parentNode.id, force);
            let nodeList = [];
            taskLists.forEach(element => {
                nodeList.push(new TaskListNode_1.TaskListNode(element.name, parseInt(element.id), parentNode, null, this));
            });
            this.statusBarItem.text = statusBarText;
            return nodeList;
        });
    }
    getTaskItems(context, node, provider, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var statusBarText = this.statusBarItem.text;
            this.statusBarItem.text = "Loading tasks......";
            let todoItems = yield this.API.getTaskItems(context, id, force);
            let nodeList = [];
            todoItems.forEach(element => {
                nodeList.push(new TaskItemNode_1.TaskItemNode(element.content, element["responsible-party-summary"], "", element.id, element.priority, element.hasTickets, element.completed, element["responsible-party-ids"], node, "taskItem", provider, this));
            });
            this.statusBarItem.text = statusBarText;
            return nodeList;
        });
    }
}
exports.TeamworkProjects = TeamworkProjects;
//# sourceMappingURL=teamworkProjects.js.map