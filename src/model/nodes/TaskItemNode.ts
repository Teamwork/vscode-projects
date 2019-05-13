import * as vscode from "vscode";
import { INode } from "./INode";
import { TeamworkProjects } from "../../teamworkProjects";
import * as path from 'path';
import { TaskListNode } from "./TaskListNode";
import { TaskProvider } from "../../taskProvider";

export class TaskItemNode implements INode {
    constructor(
        public label: string,
        private description: string, 
        private icon: string | vscode.Uri | {light: string, dark: string},
        public id: number, 
        public priority: string,
        public hasDesk: boolean,
        public isComplete: boolean,
        public assignedTo: string,
        public parentNode: TaskListNode,
        public contextValue: string,
        private readonly provider: TaskProvider, 
        private readonly twp: TeamworkProjects) {
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            description: this.description,
            iconPath: this.getIcon(this.priority,this.hasDesk, this.isComplete),
            collapsibleState: vscode.TreeItemCollapsibleState.None,        
            contextValue: this.contextValue,
            command: {
                command: "taskOutline.showElement",
                title: "",
                arguments: [this],
            }
        };
    }

    public getChildren(): INode[] {
            return  [];
    }

    public getIcon(priority: string, hasDesk: boolean = false, isComplete: boolean = false) {

          if(isComplete){
            return vscode.Uri.file(path.join(this.twp._context.extensionPath, 'resources', 'task.svg')); 
        }

        if(hasDesk){
            return {
                light: path.join(this.twp._context.extensionPath, 'resources/light', 'twdesk_light.svg'),
                dark: path.join(this.twp._context.extensionPath, 'resources/dark', 'twdesk_dark.svg'),
            };
        }

        if(priority === ""){
            return ""; //return vscode.Uri.file(path.join(this.twp._context.extensionPath, 'media', 'task.svg'));
        }

        return {
            light: path.join(this.twp._context.extensionPath, 'resources/light', `task_priority_${priority}.svg`),
            dark: path.join(this.twp._context.extensionPath, 'resources/dark', `task_priority_${priority}.svg`),
        };


    }

}
