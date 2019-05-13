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
const utilities_1 = require("./utilities");
const taskQuickAdd_1 = require("./model/taskQuickAdd");
class TeamworkProjectsApi {
    GetProjects(context, force = false, includePeople = false, getAll = false, getList = "") {
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
            let cachedProjects = context.globalState.get("twp.data.project", null);
            let lastUpdated = context.globalState.get("twp.data.projects.lastUpdated", new Date());
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
            context.globalState.update("twp.data.project", result.data.projects);
            context.globalState.update("twp.data.projects.lastUpdated", new Date());
            return result.projects;
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
    getTaskLists(context, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            // Lets check our cache first
            let response;
            // Load from cache if duration less than 30 minutes
            let cachedNodes = context.globalState.get("twp.data." + id + ".tasklist", null);
            let lastUpdated = context.globalState.get("twp.data.tasklists." + id + ".lastUpdated", new Date());
            if (cachedNodes !== null && cachedNodes["data"]["todo-lists"].length > 0 && lastUpdated && !force) {
                if (utilities_1.Utilities.DateCompare(lastUpdated, 30)) {
                    return cachedNodes["todo-lists"];
                }
            }
            const url = root + '/projects/' + id + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=false';
            response = yield axios({
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
            context.globalState.update("twp.data." + id + ".tasklist", response);
            context.globalState.update("twp.data.tasklists." + id + ".lastUpdated", Date.now());
            return response["data"]["todo-lists"];
        });
    }
    getTaskItems(context, id = 0, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            if (!token || !root) {
                vscode.window.showErrorMessage("Please Configure the extension first!");
                return;
            }
            let todoItems = [];
            let todoResponse;
            // Load from cache if duration less than 30 minutes
            todoItems = context.globalState.get("twp.data." + id + ".todoitem", []);
            let lastUpdated = context.globalState.get("twp.data.tasklists." + id + ".todoitem", new Date());
            if (todoItems.length > 0 && lastUpdated && !force) {
                if (utilities_1.Utilities.DateCompare(lastUpdated, 30)) {
                    return todoItems;
                }
            }
            const url = root + '/tasklists/' + id + '/tasks.json';
            todoResponse = yield axios({
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
            todoItems = todoResponse["data"]["todo-items"];
            context.globalState.update("twp.data." + id + ".todoitem", todoItems);
            context.globalState.update("twp.data.tasklists." + id + ".todoitem", Date.now());
            return todoItems;
        });
    }
    getTodoItem(context, id, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            var item = context.globalState.get("twp.data.task." + id, "");
            var lastUpdated = context.globalState.get("twp.data.task." + id + ".lastUpdated", new Date());
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
                context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
                context.globalState.update("twp.data.task." + id, todo);
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
            context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
            context.globalState.update("twp.data.task." + id, todo);
            return todo;
        });
    }
    postTodoItem(context, id, tasklistid, title, description) {
        return __awaiter(this, void 0, void 0, function* () {
            var axios = require("axios");
            var config = vscode.workspace.getConfiguration('twp');
            var token = config.get("APIKey");
            var root = config.get("APIRoot");
            const url = root + '/projects/' + id + "/tasks/quickadd.json";
            var task = new taskQuickAdd_1.TaskQuickAdd();
            task.tasklistId = tasklistid;
            task.notify = false;
            task["creator-id"] = 259828;
            task.private = false;
            task.content = title;
            var todoDetails = new taskQuickAdd_1.TodoItemQuick();
            todoDetails.description = description;
            task["todo-item"] = todoDetails;
            let json = yield axios({
                method: 'post',
                data: task,
                url: url,
                headers: {
                    "Content-Type": "application/json",
                },
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
                .catch(function (error) {
                console.log(error);
            });
            return json;
        });
    }
}
exports.TeamworkProjectsApi = TeamworkProjectsApi;
//# sourceMappingURL=teamworkProjectsApi.js.map