
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
	let projectConfig : ProjectConfig = await twp.GetProjectForRepository();
	twp.statusBarItem.command = "twp.SetProject";
	twp.statusBarItem.show();
	twp.statusBarItem.text = "Teamwork: " + projectConfig.ActiveProjectName;
	twp.statusBarItem.tooltip =  "Click to refresh Project Data";

	setTimeout( () => twp.RefreshData(),1*60*1000);

	vscode.commands.registerCommand('taskOutline.refresh', task => {
		taskProvider.refresh();
	});

	vscode.commands.registerCommand('taskOutline.showElement',task  => {
		twp.openResource(task);
	});

	//vscode.commands.registerCommand('twp.assignTask',(task:TaskItemNode)  => {
	//	twp.AssignTask(task);
	//	taskProvider.refresh(task);
	//	vscode.window.showInformationMessage("Task assigned");
	//});

	vscode.commands.registerCommand('twp.completeTask',(task:TaskItemNode) => {
		twp.CompleteTask(task.id);
		task.isComplete = true;
		taskProvider.refresh(task);
		vscode.window.showInformationMessage("Task completed");
	});

	vscode.commands.registerCommand('twp.SetProject',  task => {twp.SelectProject();});
	vscode.commands.registerCommand('twp.RefreshData', task => {twp.RefreshData();});


	// Refresh data once every 30 minutes
	setInterval(twp.RefreshData,30 * 60 * 1000)

}