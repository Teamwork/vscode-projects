
import * as vscode from 'vscode';
import * as path from 'path';
import { TaskProvider } from './taskProvider';
import { TeamworkProjects } from './teamworkProjects';
import { ProjectConfig } from './model/projectConfig';
import { TaskItemNode } from './model/nodes/TaskItemNode';



export async function activate(context: vscode.ExtensionContext) {
	
	const twp = new TeamworkProjects(context,context.extensionPath);
	const taskProvider = new TaskProvider(context,twp);
	vscode.window.registerTreeDataProvider('taskOutline', taskProvider);

	// Refresh Data on startup and setup status bar
	twp.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
	twp.Config = await twp.GetProjectForRepository();
	if(twp.Config !== undefined){
		twp.statusBarItem.command = "twp.SetActiveProject";
		twp.statusBarItem.show();
		twp.statusBarItem.text = twp.Config.ActiveProjectName;
		twp.statusBarItem.tooltip =  "Click to refresh Project Data";

		setTimeout( () => twp.RefreshData(),1*60*1000);
	}
	vscode.commands.registerCommand('taskOutline.refresh', task => {
		twp.RefreshData();
		taskProvider.refresh();
		}
	);

	vscode.commands.registerCommand('taskOutline.showElement',task  => {
		twp.openResource(task);
	});

	vscode.commands.registerCommand('twp.completeTask',(task:TaskItemNode) => {
		twp.CompleteTask(task.id);
		task.isComplete = true;
		taskProvider.refresh(task);
		vscode.window.showInformationMessage("Task completed");
	});

	vscode.commands.registerCommand('twp.SetActiveProject',  task => {twp.SelectActiveProject();});
	vscode.commands.registerCommand('twp.SetProject',  task => {twp.SelectProject();});
	vscode.commands.registerCommand('twp.RefreshData', task => {twp.RefreshData();});
	vscode.commands.registerCommand('twp.linkTask', task => { twp.QuickAddTask();});
	vscode.commands.registerCommand('twp.SetAccount',  task => {twp.SelectAccount();});


	// Refresh data once every 30 minutes
	setInterval(twp.RefreshData,30 * 60 * 1000)

}