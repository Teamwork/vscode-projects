import * as vscode from "vscode";
import { INode } from "./INode";
import * as path from 'path';

import { TeamworkProjects } from "../../teamworkProjects";
import { Person } from "../responses/peopleResponse";
import { Project } from "../responses/projectresponse";
import { TaskProvider } from "../../taskProvider";

export class ProjectNode implements INode {

    constructor(private readonly label: string, readonly id: number,public Project: Project, public readonly provider: TaskProvider, private readonly twp: TeamworkProjects) {
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            iconPath: vscode.Uri.file(path.join(this.twp._context.extensionPath, 'media', `projects-white.svg` )),
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        };
    }


    public async getChildren(context: vscode.ExtensionContext): Promise<INode[]> {

        try {
            return await this.twp.getTaskLists(context,this);
          } catch (error) {
              vscode.window.showErrorMessage(error);
              return [];
        }
    }

}
