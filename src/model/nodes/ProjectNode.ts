import * as vscode from "vscode";
import { INode } from "./INode";
import { TeamworkProjects } from "../../teamworkProjects";

export class ProjectNode implements INode {

    constructor(private readonly label: string, readonly id: number, private readonly twp: TeamworkProjects) {
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        };
    }


    public async getChildren(context: vscode.ExtensionContext): Promise<INode[]> {

        try {
            return await this.twp.getTaskLists(context,this.id);
          } catch (error) {
              vscode.window.showErrorMessage(error);
              return [];
        }
    }

}
