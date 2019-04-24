import * as vscode from "vscode";
import { INode } from "./INode";
import { TeamworkProjects } from "../../teamworkProjects";
import * as path from 'path';
export class TaskItemNode implements INode {

    constructor(
        public readonly label: string,
        private readonly description: string, 
        private readonly icon: string,
        public readonly id: number, 
        private readonly twp: TeamworkProjects) {
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            description: this.description,
            iconPath: vscode.Uri.file(path.join(this.twp._context.extensionPath, 'media', 'projects-white.svg')),
            collapsibleState: vscode.TreeItemCollapsibleState.None,        
            contextValue: "taskItem-label",
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
}
