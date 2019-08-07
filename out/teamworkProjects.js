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
const util_1 = require("util");
class TeamworkProjects {
    constructor(context, extensionPath) {
        this.context = context;
        this.IsLoading = false;
        this._disposables = [];
        this._context = context;
        this.context = context;
        this._extensionPath = extensionPath;
        this.API = new teamworkProjectsApi_1.TeamworkProjectsApi(this._context, this);
        this.WebViews = new webviews_1.WebViews(this._context, this._extensionPath, this.API);
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
            yield this.API.AddComment(taskItem, content);
            this.panel.webview.html = yield this.GetWebViewContent(taskItem, true);
        });
    }
    CompleteTask(taskItem) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.API.CompleteTask(taskItem);
            if (util_1.isNullOrUndefined(this.panel) || util_1.isNullOrUndefined(this.panel.webview)) {
            }
            else {
                this.panel.webview.html = yield this.GetWebViewContent(taskItem, true);
            }
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
                    let gitLink = "";
                    let gitBranch = "";
                    const gitExtensionExports = vscode.extensions.getExtension('vscode.git').exports;
                    if (gitExtensionExports) {
                        const gitExtension = gitExtensionExports.exports;
                        const api = gitExtension.getAPI(1);
                        if (api && api.repositories.length > 0) {
                            let repo = api.repositories[0];
                            let remote = repo.state.remotes[0];
                            gitBranch = repo.state.HEAD.name;
                            gitLink = remote.fetchUrl.replace(".git", "") + "/blob/" + gitBranch + fileName + "#L" + line;
                        }
                    }
                    let taskDescription = "Task added from VSCode: \n";
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
                    let userData = this._context.globalState.get("twp.data.activeAccount");
                    let root = userData.rootUrl;
                    if (!util_1.isNullOrUndefined(newTask)) {
                        var id = newTask["data"]["taskIds"];
                        var taskDetails = yield this.API.getTodoItem(this._context, parseInt(id), true);
                        var langConfig = utilities_1.Utilities.GetActiveLanguageConfig();
                        //Task: Need to find a workaround for files without a comment symbol configured in VSCode
                        //Link: https://digitalcrew.teamwork.com//tasks/14804255
                        //Assigned To: Tim Cadenbach
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
            }
        });
    }
    RefreshData() {
        return __awaiter(this, void 0, void 0, function* () {
            let userData = this.context.globalState.get("twp.data.activeAccount");
            let tempUserData = this.ActiveAccount;
            if ((util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData))
                || (!util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData) && userData.installationId !== tempUserData.installationId)) {
                userData = tempUserData;
            }
            if (util_1.isNullOrUndefined(userData)) {
                return;
            }
            this.IsLoading = true;
            this.UpdateStatusBarText("Updating Projects");
            if (this.Config === null) {
                this.Config = yield this.GetProjectForRepository();
            }
            if (this.Config.Projects !== null) {
                this.Config.Projects.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    this.UpdateStatusBarText("Teamwork: Refreshing TaskLists");
                    element.Project.TodoLists = yield this.API.getTaskLists(this._context, element.Id, true);
                    this.UpdateStatusBarText("Teamwork: Refreshing TodoItems");
                    element.Project.TodoLists.forEach((subelement) => __awaiter(this, void 0, void 0, function* () {
                        subelement.TodoItems = yield this.API.getTaskItems(this._context, parseInt(subelement.id), true);
                    }));
                    this.UpdateStatusBarText(this.Config.ActiveProjectName);
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
            if (this.Config.ActiveProjectId === "") {
                yield this.SelectActiveProject();
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
                let userData = this.context.globalState.get("twp.data.activeAccount");
                let tempUserData = this.ActiveAccount;
                if ((util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData))
                    || (!util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData) && userData.installationId !== tempUserData.installationId)) {
                    userData = tempUserData;
                }
                if (util_1.isNullOrUndefined(userData)) {
                    return;
                }
                let token = userData.token;
                let root = userData.rootUrl;
                if (!token || !root) {
                    return;
                }
                var path = vscode.workspace.rootPath + "/twp.json";
                let config;
                if (fs.existsSync(path)) {
                    config = JSON.parse(fs.readFileSync(path, 'utf8'));
                    if (config) {
                        if (config.Projects.length > 0) {
                            for (let i = config.Projects.length; i <= 0; i--) {
                                let element = config.Projects[i];
                                if (!util_1.isNullOrUndefined(element.Installation) && element.Installation !== userData.installationId) {
                                    config.Projects.splice(i, 1);
                                }
                            }
                            return config;
                        }
                        else {
                            return new projectConfig_1.ProjectConfig(null);
                        }
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
            vscode.env.openExternal(vscode.Uri.parse('https://www.teamwork.com/launchpad/login?state=VSCODE&redirect_uri=vscode://teamwork.twp/loginData'));
            return true;
        });
    }
    FinishLogin(context, code) {
        return __awaiter(this, void 0, void 0, function* () {
            this.API = new teamworkProjectsApi_1.TeamworkProjectsApi(this._context, this);
            var userData = yield this.API.getLoginData(context, code);
            yield context.globalState.update("twp.data.activeAccount", null);
            yield context.globalState.update("twp.data.activeAccount", userData);
            //Task: switch all account references in code to use variable instead of globalState
            //Link: https://digitalcrew.teamwork.com//tasks/14849632
            //Assigned To: Tim Cadenbach
            this.ActiveAccount = userData;
            this.RefreshData();
            vscode.window.showInformationMessage("You are now logged in as: " + userData.userEmail + "( " + userData.rootUrl + " )");
            return null;
        });
    }
    SelectProject() {
        return __awaiter(this, void 0, void 0, function* () {
            let userData = this.context.globalState.get("twp.data.activeAccount");
            let tempUserData = this.ActiveAccount;
            if ((util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData))
                || (!util_1.isNullOrUndefined(userData) && !util_1.isNullOrUndefined(tempUserData) && userData.installationId !== tempUserData.installationId)) {
                userData = tempUserData;
            }
            if (util_1.isNullOrUndefined(userData)) {
                this.SelectAccount();
                return;
            }
            let token = userData.token;
            let root = userData.rootUrl;
            if (util_1.isNullOrUndefined(token) || util_1.isNullOrUndefined(root)) {
                this.SelectAccount();
                return;
            }
            if (util_1.isNullOrUndefined(vscode.workspace.rootPath) || util_1.isNullOrUndefined(vscode.workspace.getWorkspaceFolder)) {
                vscode.window.showErrorMessage("You need to have a workspace or folder opened to select a project");
                return;
            }
            let savedConfig = yield this.GetProjectForRepository();
            const projectItem = yield vscode.window.showQuickPick(this.GetProjectQuickTips(true, savedConfig.Projects), { placeHolder: "Select Projects", ignoreFocusOut: true, canPickMany: true });
            if (projectItem) {
                var items = [];
                projectItem.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    items.push(new projectConfig_1.ProjectConfigEntry(element.label, element.id, element, userData.installationId));
                }));
                this.Config = new projectConfig_1.ProjectConfig(items);
                //Task: we should probably allow users to customize the filename storing projects
                //Link: https://digitalcrew.teamwork.com//tasks/14804236
                //Assigned To: Tim Cadenbach
                var path = vscode.workspace.rootPath + "/twp.json";
                let data = JSON.stringify(this.Config);
                fs.writeFileSync(path, data);
                this.RefreshData();
                vscode.commands.executeCommand("taskOutline.refresh");
                return this.Config;
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
                this.UpdateStatusBarText(projectItem.name);
                var path = vscode.workspace.rootPath + "/twp.json";
                let data = JSON.stringify(savedConfig);
                fs.writeFileSync(path, data);
                this.Config.ActiveProjectId = projectItem.id;
                this.Config.ActiveProjectName = projectItem.name;
                return savedConfig;
            }
        });
    }
    UpdateStatusBarText(text) {
        return __awaiter(this, void 0, void 0, function* () {
            let userData = this._context.globalState.get("twp.data.activeAccount");
            this.statusBarItem.text = "Teamwork: " + text + ", " + userData.userEmail;
        });
    }
    getTaskLists(context, parentNode, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.UpdateStatusBarText("Loading Tasklists......");
            // Load task lists
            var taskLists = yield this.API.getTaskLists(context, parentNode.id, force);
            let nodeList = [];
            taskLists.forEach(element => {
                nodeList.push(new TaskListNode_1.TaskListNode(element.name, parseInt(element.id), parentNode, null, this));
            });
            if (taskLists.length === 0) {
                nodeList.push(new EmptyNode_1.EmptyNode("No TaskLists", 0));
            }
            this.UpdateStatusBarText(this.Config.ActiveProjectName);
            return nodeList;
        });
    }
    getTaskItems(context, node, provider, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.UpdateStatusBarText("Loading tasks......");
            let todoItems = yield this.API.getTaskItems(context, node.id, force);
            let nodeList = [];
            var config = vscode.workspace.getConfiguration('twp');
            var onlySelf = config.get("OnlySelfAssigned");
            var showUnassigned = config.get("showUnAssigned");
            let userData = this._context.globalState.get("twp.data.activeAccount");
            let userId = userData.userId;
            for (let i = 0; i < todoItems.length; i++) {
                let element = todoItems[i];
                if (!util_1.isNullOrUndefined(element["responsible-party-ids"]) && element["responsible-party-ids"].indexOf(userId.toString()) < 0 && onlySelf) {
                    continue;
                }
                if (util_1.isNullOrUndefined(element["responsible-party-ids"]) && !showUnassigned) {
                    continue;
                }
                nodeList.push(new TaskItemNode_1.TaskItemNode(element.content, util_1.isNullOrUndefined(element["responsible-party-summary"]) ? "Anyone" : element["responsible-party-summary"], "", element.id, element.priority, element.hasTickets, element.completed, !util_1.isNullOrUndefined(element.subTasks) && element.subTasks.length > 0, element["responsible-party-ids"], node, "taskItem", provider, this, element.subTasks));
            }
            if (todoItems.length === 0) {
                nodeList.push(new EmptyNode_1.EmptyNode("No Tasks", 0));
            }
            this.UpdateStatusBarText(this.Config.ActiveProjectName);
            return nodeList;
        });
    }
}
exports.TeamworkProjects = TeamworkProjects;
//# sourceMappingURL=teamworkProjects.js.map