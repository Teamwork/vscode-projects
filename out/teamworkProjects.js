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
const TaskListNode_1 = require("./model/nodes/TaskListNode");
const TaskItemNode_1 = require("./model/nodes/TaskItemNode");
const ProjectQuickTip_1 = require("./model/nodes/ProjectQuickTip");
const projectConfig_1 = require("./model/projectConfig");
const utilities_1 = require("./utilities");
const teamworkProjectsApi_1 = require("./teamworkProjectsApi");
const EmptyNode_1 = require("./model/nodes/EmptyNode");
const webviews_1 = require("./webviews");
class TeamworkProjects {
    constructor(context, extensionPath) {
        this.context = context;
        this.IsLoading = false;
        this._disposables = [];
        this._context = context;
        this._extensionPath = extensionPath;
        this.API = new teamworkProjectsApi_1.TeamworkProjectsApi();
        this.WebViews = new webviews_1.WebViews(this._context, this._extensionPath);
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
                this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
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
                this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
                this.panel.webview.html = yield this.GetWebViewContent(taskItem.id);
                this.panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                    var data = JSON.parse(message.text);
                    switch (data.type) {
                        case 'comment':
                            this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
                            this.CreateComment(data.taskId, data.comment);
                            return;
                        case 'complete':
                            this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
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
                return yield this.WebViews.GetWebViewContentTeamwork(taskItem, force);
            }
            else {
                return yield this.WebViews.GetWebViewContentAdaptiveCard(taskItem, force);
            }
        });
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
            var cursor = selection.start.character;
            var text = editor.document.getText(selection);
            var list = yield this.GetTaskListQuickTip(true);
            if (list !== null && list.length > 0) {
                const taskList = yield vscode.window.showQuickPick(list, { placeHolder: "Select Tasklist", ignoreFocusOut: true, canPickMany: false });
                if (taskList !== null) {
                    const result = yield vscode.window.showInputBox({
                        placeHolder: 'Task Title @person [today|tomorrow]',
                    });
                    const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
                    var gitLink = "";
                    var gitBranch = "";
                    if (gitExtension) {
                        const api = gitExtension.getAPI(1);
                        if (api && api.repositories.length > 0) {
                            var repo = api.repositories[0];
                            var remote = repo.state.remotes[0];
                            gitBranch = repo.state.HEAD.name;
                            gitLink = remote.fetchUrl.replace(".git", "") + "/blob/" + gitBranch + fileName + "#L" + line;
                        }
                    }
                    var taskDescription = "Task added from VSCode: \n";
                    taskDescription += "File: " + fileName + "\n";
                    taskDescription += "Line: " + line + "\n";
                    if (gitBranch.length > 0) {
                        taskDescription += "Branch:" + gitBranch + "\n";
                    }
                    if (gitLink.length > 0) {
                        taskDescription += "Link:" + gitLink + "\n";
                    }
                    taskDescription += "Selection: " + "\n";
                    taskDescription += text;
                    var newTask = yield this.API.postTodoItem(this._context, parseInt(this.Config.ActiveProjectId), parseInt(taskList.id), result, taskDescription);
                    var config = vscode.workspace.getConfiguration('twp');
                    var root = config.get("APIRoot");
                    var id = newTask["data"]["taskIds"];
                    var taskDetails = yield this.API.getTodoItem(this._context, parseInt(id), true);
                    var langConfig = utilities_1.Utilities.GetActiveLanguageConfig();
                    var commentWrapper = langConfig.comments.lineComment;
                    var content = taskDetails.content;
                    var responsible = taskDetails["responsible-party-names"];
                    editor.edit(edit => {
                        edit.setEndOfLine(vscode.EndOfLine.CRLF);
                        edit.insert(new vscode.Position(line, cursor), commentWrapper + "Task: " + content + "\r\n");
                        edit.insert(new vscode.Position(line, cursor), commentWrapper + "Link: " + root + "/tasks/" + id + "\r\n");
                        edit.insert(new vscode.Position(line, cursor), commentWrapper + "Assigned To: " + responsible + "\r\n" + "\r\n");
                    });
                    vscode.window.showInformationMessage("Task was added");
                }
            }
        });
    }
    RefreshData() {
        return __awaiter(this, void 0, void 0, function* () {
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                return;
            }
            if (this.IsLoading) {
                return;
            }
            this.IsLoading = true;
            this.statusBarItem.text = "Teamwork: Updating Projects";
            if (this.Config === null) {
                this.Config = yield this.GetProjectForRepository();
            }
            if (this.Config.Projects !== null) {
                this.Config.Projects.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    this.statusBarItem.text = "Teamwork: Refreshing TaskLists";
                    element.Project.TodoLists = yield this.API.getTaskLists(this._context, element.Id, true);
                    this.statusBarItem.text = "Teamwork: Refreshing TodoItems";
                    element.Project.TodoLists.forEach((subelement) => __awaiter(this, void 0, void 0, function* () {
                        subelement.TodoItems = yield this.API.getTaskItems(this._context, parseInt(subelement.id), true);
                    }));
                    this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
                }));
            }
            this.IsLoading = false;
        });
    }
    toProjectListResponse(json) {
        return JSON.parse(json);
    }
    GetProjectQuickTips(force = false, selected, includePeople = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeList = [];
            this.Projects = yield this.API.GetProjects(this._context, force, includePeople);
            this.Projects.forEach(element => {
                var isPicked = false;
                if (selected && selected.length > 0 && selected.find(p => p.Id.toString() === element.id)) {
                    isPicked = true;
                }
                var item = new ProjectQuickTip_1.ProjectQuickTip(element.name, element.id, isPicked);
                nodeList.push(item);
            });
            this._context.globalState.update("twp.data.projects", this.Projects);
            this._context.globalState.update("twp.data.projects.lastUpdated", Date.now());
            return nodeList;
        });
    }
    GetTaskListQuickTip(force = false, includePeople = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let nodeList = [];
            if (this.Config === null) {
                this.Config = yield this.GetProjectForRepository();
            }
            this.Config.Projects.forEach(element => {
                if (element.Id.toString() === this.Config.ActiveProjectId) {
                    if (element.Project === undefined || element.Project === null) {
                        vscode.window.showInformationMessage("Please pick a project for this repository first");
                        return null;
                    }
                    else {
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
                }
            });
            return nodeList;
        });
    }
    GetProjectForRepository() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var userConfig = vscode.workspace.getConfiguration('twp');
                var token = userConfig.get("APIKey");
                var root = userConfig.get("APIRoot");
                if (!token || !root) {
                    return;
                }
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
    SelectAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            this.loginPanel = vscode.window.createWebviewPanel("twp.TaskPreview", "Teamwork Projects, Login", vscode.ViewColumn.Beside, {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this._extensionPath, 'media'))
                ]
            });
            this.loginPanel.iconPath = {
                light: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg')),
                dark: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg'))
            };
            this.loginPanel.webview.html = this.WebViews.GetWebViewContentLoader();
            this.loginPanel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            }));
            this.panel.onDidDispose(task => {
                this.dispose();
            });
            return true;
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
                this.statusBarItem.text = "Teamwork: " + projectItem.name;
                var path = vscode.workspace.rootPath + "/twp.json";
                let data = JSON.stringify(savedConfig);
                fs.writeFileSync(path, data);
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
            if (taskLists.length === 0) {
                nodeList.push(new EmptyNode_1.EmptyNode("No TaskLists", 0));
            }
            this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
            return nodeList;
        });
    }
    getTaskItems(context, node, provider, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBarItem.text = "Loading tasks......";
            let todoItems = yield this.API.getTaskItems(context, node.id, force);
            let nodeList = [];
            todoItems.forEach(element => {
                nodeList.push(new TaskItemNode_1.TaskItemNode(element.content, element["responsible-party-summary"], "", element.id, element.priority, element.hasTickets, element.completed, element["responsible-party-ids"], node, "taskItem", provider, this));
            });
            if (todoItems.length === 0) {
                nodeList.push(new EmptyNode_1.EmptyNode("No Tasks", 0));
            }
            this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
            return nodeList;
        });
    }
}
exports.TeamworkProjects = TeamworkProjects;
//# sourceMappingURL=teamworkProjects.js.map