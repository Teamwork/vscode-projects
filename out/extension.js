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
const taskProvider_1 = require("./taskProvider");
const teamworkProjects_1 = require("./teamworkProjects");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const twp = new teamworkProjects_1.TeamworkProjects(context, context.extensionPath);
        const taskProvider = new taskProvider_1.TaskProvider(context, twp);
        vscode.window.registerTreeDataProvider('taskOutline', taskProvider);
        // Refresh Data on startup and setup status bar
        twp.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        let projectConfig = yield twp.GetProjectForRepository();
        twp.statusBarItem.command = "twp.SetProject";
        twp.statusBarItem.show();
        twp.statusBarItem.text = "Teamwork: " + projectConfig.ActiveProjectName;
        twp.statusBarItem.tooltip = "Click to refresh Project Data";
        setTimeout(() => twp.RefreshData(), 1 * 60 * 1000);
        vscode.commands.registerCommand('taskOutline.refresh', task => {
            taskProvider.refresh();
        });
        vscode.commands.registerCommand('taskOutline.showElement', task => {
            twp.openResource(task);
        });
        //vscode.commands.registerCommand('twp.assignTask',(task:TaskItemNode)  => {
        //	twp.AssignTask(task);
        //	taskProvider.refresh(task);
        //	vscode.window.showInformationMessage("Task assigned");
        //});
        vscode.commands.registerCommand('twp.completeTask', (task) => {
            twp.CompleteTask(task.id);
            task.isComplete = true;
            taskProvider.refresh(task);
            vscode.window.showInformationMessage("Task completed");
        });
        vscode.commands.registerCommand('twp.SetProject', task => { twp.SelectProject(); });
        vscode.commands.registerCommand('twp.RefreshData', task => { twp.RefreshData(); });
        // Refresh data once every 30 minutes
        setInterval(twp.RefreshData, 30 * 60 * 1000);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map