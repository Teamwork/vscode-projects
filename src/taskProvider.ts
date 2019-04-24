import * as vscode from 'vscode';
import {INode} from './model/nodes/INode';
import { TeamworkProjects } from './teamworkProjects';
import { ProjectNode } from './model/nodes/ProjectNode';
import { ProjectErrorNode } from './model/nodes/ProjectErrorNode';


export class TaskProvider implements vscode.TreeDataProvider<INode> {
  
    public _onDidChangeTreeData: vscode.EventEmitter<INode | undefined> = new vscode.EventEmitter<INode | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<INode | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext, private twp: TeamworkProjects) {
  
    }


	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    public async getChildren(element?: INode): Promise<INode[]> {
        try{
            if (!element) {
                const items = [];
                var config = await this.twp.GetProjectForRepository();
                if(config){

                    config.Projects.forEach(element => {
                        items.push(new ProjectNode("Project: " + element.Name,element.Id,this.twp));
                    });

                    return items;
                }
                if(!config){
                    items.push(new ProjectErrorNode("-> Select Project for Repository","","",0));
                    return items;   
                }
            }
            return element.getChildren(this.context);
        }catch{
            const items = [];
            items.push(new ProjectErrorNode("-> Select Project for Repository","","",0));
            return items;
        }
    }



    public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem  {
        return element.getTreeItem();
    }


}