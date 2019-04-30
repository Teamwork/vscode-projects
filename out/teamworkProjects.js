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
const utilities_1 = require("./utilities");
class TeamworkProjects {
    constructor(context, extensionPath) {
        this.context = context;
        this._disposables = [];
        this._context = context;
        this._extensionPath = extensionPath;
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
                    light: vscode.Uri.file(path.join(this._extensionPath, 'media', 'projects-white.svg')),
                    dark: vscode.Uri.file(path.join(this._extensionPath, 'media', 'projects-white.svg'))
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
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            let assignedTo = node.assignedTo.split(",");
            let people = yield this.GetPeopleInProject(true, node.parentNode.parentNode.id.toString());
            const selectedPeople = yield vscode.window.showQuickPick(this.GetPeopleQuickTips(people, assignedTo), { placeHolder: "Select Person", ignoreFocusOut: true, canPickMany: true });
            if (selectedPeople) {
                vscode.window.showInformationMessage("et voila");
            }
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
                    <body style='background:white;height:800px;width:400px;'>
                            <div id="app-loader" class="app-loader" >
                            <svg class="app-loader__-logo" xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 160 128">
                                <defs>
                                    <style>
                                        .cls-1 {
                                            fill: #ff22b1;
                                        }
                        
                                        .cls-2 {
                                            fill: #1d1c39;
                                        }
                                    </style>
                                </defs>
                                <circle class="cls-1" cx="118" cy="86" r="12"></circle>
                                <path class="cls-2" d="M160,48a32,32,0,0,0-32-32H63.59A20.07,20.07,0,0,0,44,0H20A20.06,20.06,0,0,0,0,20V96a32,32,0,0,0,32,32h96a32,32,0,0,0,32-32Zm-32,64H32A16,16,0,0,1,16,96V32H128a16,16,0,0,1,16,16V96A16,16,0,0,1,128,112Z"></path>
                            </svg>
                            <p class="w-app-preloading__installation-name">
                                please wait...
                            </p>
                            <div class="app-loader__loading-bar"></div>
                        </div>
                    </body>
                    </html>`;
    }
    GetWebViewContentAdaptiveCard(taskItem, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var todo = yield this.getTodoItem(this._context, taskItem, force);
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
            var todo = yield this.getTodoItem(this._context, taskItem);
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
    RefreshData() {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBarItem.text = "Teamwork: Updating Projects";
            let project = yield this.GetProjectForRepository();
            project.Projects.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                this.statusBarItem.text = "Teamwork: Refreshing TaskLists";
                var taskLists = yield this.getTaskLists(this._context, null, element.Id, true);
                this.statusBarItem.text = "Teamwork: Refreshing TodoItems";
                taskLists.forEach((subelement) => __awaiter(this, void 0, void 0, function* () {
                    var taskItems = yield this.getTaskItems(this._context, null, null, subelement.id, true);
                }));
                this.statusBarItem.text = "Teamwork: " + project.ActiveProjectName;
            }));
        });
    }
    toProjectListResponse(json) {
        return JSON.parse(json);
    }
    GetProjects(force = false, includePeople = false, getAll = false, getList = "") {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            let result;
            // Load from cache if duration less than 30 minutes
            let cachedProjects = this._context.globalState.get("twp.data.projects", null);
            let lastUpdated = this._context.globalState.get("twp.data.projects.lastUpdated", new Date());
            if (cachedProjects && cachedProjects.length > 0 && lastUpdated && !force) {
                if (utilities_1.Utilities.DateCompare(lastUpdated, 30)) {
                    result = cachedProjects;
                }
            }
            if (!result) {
                const url = root + '/tasks/projects.json?type=canAddItem&pageSize=200';
                result = yield axios({
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
            }
            if (includePeople) {
                result.data.projects.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    element.people = yield this.GetPeopleInProject(force, element.id);
                }));
            }
            this.Projects = result.data.projects;
            this._context.globalState.update("twp.data.projects", result.data.projects);
            this._context.globalState.update("twp.data.projects.lastUpdated", new Date());
            return result.projects;
        });
    }
    GetProjectQuickTips(force = false, selected, includePeople = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeList = [];
            let projects = yield this.GetProjects(force, includePeople);
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
    GetPeopleInProject(force = false, id) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            var url = root + '/projects/' + id + "/people.json";
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
            return json.people;
        });
    }
    GetProjectForRepository() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var path = vscode.workspace.rootPath + "/twp.json";
                if (fs.existsSync(path)) {
                    let config = JSON.parse(fs.readFileSync(path, 'utf8'));
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
    getTaskLists(context, node, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var statusBarText = this.statusBarItem.text;
            this.statusBarItem.text = "Loading Tasklists......";
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            var idToUse = id !== 0 ? id : node.id;
            // Lets check our cache first
            let nodeList = [];
            // Load from cache if duration less than 30 minutes
            let cachedNodes = context.globalState.get("twp.data." + idToUse + ".tasklists", []);
            let lastUpdated = context.globalState.get("twp.data.tasklists." + idToUse + ".lastUpdated", new Date());
            if (cachedNodes.length > 0 && lastUpdated && !force) {
                if (utilities_1.Utilities.DateCompare(lastUpdated, 30)) {
                    return cachedNodes;
                }
            }
            const url = root + '/projects/' + idToUse + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=true';
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
            json.data["todo-lists"].forEach(element => {
                nodeList.push(new TaskListNode_1.TaskListNode(element.name, element.id, node, node.provider, this));
            });
            context.globalState.update("twp.data." + idToUse + ".tasklists", nodeList);
            context.globalState.update("twp.data.tasklists." + idToUse + ".lastUpdated", Date.now());
            this.statusBarItem.text = statusBarText;
            return nodeList;
        });
    }
    getTaskItems(context, node, provider, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var statusBarText = this.statusBarItem.text;
            this.statusBarItem.text = "Loading tasks......";
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            var idToUse = id !== 0 ? id : node.id;
            let nodeList = [];
            // Load from cache if duration less than 30 minutes
            let cachedNodes = context.globalState.get("twp.data." + idToUse + ".todoitems", []);
            let lastUpdated = context.globalState.get("twp.data.tasklists." + idToUse + ".todoitems", new Date());
            if (cachedNodes.length > 0 && lastUpdated && !force) {
                if (utilities_1.Utilities.DateCompare(lastUpdated, 30)) {
                    return cachedNodes;
                }
            }
            const url = root + '/tasklists/' + idToUse + '/tasks.json';
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
            json.data["todo-items"].forEach(element => {
                nodeList.push(new TaskItemNode_1.TaskItemNode(element.content, element["responsible-party-summary"], "", element.id, element.priority, element.hasTickets, element.isComplete, element["responsible-party-ids"], node, "taskItem", provider, this));
            });
            context.globalState.update("twp.data." + idToUse + ".todoitems", nodeList);
            context.globalState.update("twp.data.tasklists." + idToUse + ".todoitems", Date.now());
            this.statusBarItem.text = statusBarText;
            return nodeList;
        });
    }
    getTodoItem(context, id, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var statusBarText = this.statusBarItem.text;
            this.statusBarItem.text = "Fetching task details";
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            var item = this._context.globalState.get("twp.data.task." + id, "");
            var lastUpdated = this._context.globalState.get("twp.data.task." + id + ".lastUpdated", new Date());
            var todo;
            if (item && !force) {
                if (utilities_1.Utilities.DateCompare(lastUpdated, 30)) {
                    todo = item;
                }
            }
            else {
                const url = root + '/tasks/' + id + '.json';
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
                todo = json.data["todo-item"];
                this._context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
                this._context.globalState.update("twp.data.task." + id, todo);
            }
            var dateFormat = require('dateformat');
            todo['created-on'] = dateFormat(Date.parse(todo['created-on']), "ddd-mm-yyyy");
            todo['description'] = todo['description'].replace('\'', '´');
            todo['content'] = todo['content'].replace('\'', '´');
            // If task has comments -> Load them
            if (todo["comments-count"] > 0) {
                const commenturl = root + '/tasks/' + id + '/comments.json';
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
                    newBody = newBody.replace('\'', '´');
                    element.body = newBody;
                    element["datetime"] = dateFormat(Date.parse(todo.datetime), "ddd-mm-yyyy hh:MM");
                });
                todo["comments"] = comments.data.comments;
            }
            if (todo["attachments-count"] > 0) {
                const attachment = root + '/v/2/tasks/' + id + '/files.json?getCategoryPath=true&getLikes=true&getVersions=true&page=1&pageSize=50';
                let comments = yield axios({
                    method: 'get',
                    url: attachment,
                    auth: {
                        username: token,
                        password: 'xxxxxxxxxxxxx'
                    }
                })
                    .catch(function (error) {
                    console.log(error);
                });
                todo["attachments"] = comments.data.files;
            }
            todo["rooturl"] = root;
            todo.rooturl = root;
            this._context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
            this._context.globalState.update("twp.data.task." + id, todo);
            this.statusBarItem.text = statusBarText;
            return todo;
        });
    }
}
exports.TeamworkProjects = TeamworkProjects;
//# sourceMappingURL=teamworkProjects.js.map