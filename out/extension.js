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
        twp.Config = yield twp.GetProjectForRepository();
        twp.statusBarItem.command = "twp.SetActiveProject";
        twp.statusBarItem.show();
        twp.statusBarItem.text = twp.Config.ActiveProjectName;
        twp.statusBarItem.tooltip = "Click to refresh Project Data";
        setTimeout(() => twp.RefreshData(), 1 * 60 * 1000);
        vscode.commands.registerCommand('taskOutline.refresh', task => {
            taskProvider.refresh();
        });
        vscode.commands.registerCommand('taskOutline.showElement', task => {
            twp.openResource(task);
        });
        vscode.commands.registerCommand('twp.completeTask', (task) => {
            twp.CompleteTask(task.id);
            task.isComplete = true;
            taskProvider.refresh(task);
            vscode.window.showInformationMessage("Task completed");
        });
        vscode.commands.registerCommand('twp.SetActiveProject', task => { twp.SelectActiveProject(); });
        vscode.commands.registerCommand('twp.SetProject', task => { twp.SelectProject(); });
        vscode.commands.registerCommand('twp.RefreshData', task => { twp.RefreshData(); });
        vscode.commands.registerCommand('twp.linkTask', task => {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("You need to have code selected to use this.");
            }
            var workspaceRoot = vscode.workspace.rootPath;
            var fileName = editor.document.fileName.replace(workspaceRoot, "");
            var selection = editor.selection;
            var line = selection.start.line;
            var text = editor.document.getText(selection);
        });
        // Refresh data once every 30 minutes
        setInterval(twp.RefreshData, 30 * 60 * 1000);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map