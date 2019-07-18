import * as vscode from "vscode";
import { INode } from "./INode";
import { TeamworkProjects } from "../../teamworkProjects";
import * as path from 'path';
import { TaskListNode } from "./TaskListNode";
import { TaskProvider } from "../../taskProvider";
import { TodoItem } from "../responses/TaskItemResponse";
import { isNullOrUndefined } from "util";

export class TaskItemNode implements INode {
    constructor(
        public label: string,
        private description: string, 
        private icon: string | vscode.Uri | {light: string, dark: string},
        public id: number, 
        public priority: string,
        public hasDesk: boolean,
        public isComplete: boolean,
        public hasChildren: boolean,
        public assignedTo: string,
        public parentNode: TaskListNode | TaskItemNode,
        public contextValue: string,
        private readonly provider: TaskProvider, 
        private readonly twp: TeamworkProjects,
        public subTasks?: TodoItem[],) {
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            description: this.description,
            iconPath: this.getIcon(this.priority,this.hasDesk, this.isComplete),
            collapsibleState: this.hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,        
            contextValue: this.contextValue,
            command: {
                command: "taskOutline.showElement",
                title: "",
                arguments: [this],
            }
        };
    }

    public async getChildren(): Promise<INode[]> {
        try {
            if(isNullOrUndefined(this.subTasks)){
                return [];
            }else{
                let nodeList: INode[] = []; 
    
                this.subTasks.forEach(element => {
                    nodeList.push(new TaskItemNode(element.content,
                        element["responsible-party-summary"],"", 
                        element.id,
                        element.priority,
                        element.hasTickets,
                        element.completed,
                        !isNullOrUndefined(element.subTasks) && element.subTasks.length > 0,
                        element["responsible-party-ids"],
                        this,
                        "taskItem",
                        this.provider,
                        this.twp));
                });
                return nodeList;
            }
          } catch (error) {
              vscode.window.showErrorMessage(error);
              return [];
        }


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
