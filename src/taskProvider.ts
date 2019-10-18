import * as vscode from 'vscode';
import {INode} from './model/nodes/INode';
import { TeamworkProjects } from './teamworkProjects';
import { ProjectNode } from './model/nodes/ProjectNode';
import { ProjectErrorNode } from './model/nodes/ProjectErrorNode';
import { isNullOrUndefined } from 'util';
import { TeamworkAccount } from './model/teamworkAccount';


export class TaskProvider implements vscode.TreeDataProvider<INode> {
  
    public _onDidChangeTreeData: vscode.EventEmitter<INode | undefined> = new vscode.EventEmitter<INode | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<INode | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext, private twp: TeamworkProjects) {
  
        this.ProjectNodes = [];
    }

    public ProjectNodes : ProjectNode[]

	refresh(node?: INode): void {

        if(node){
            this._onDidChangeTreeData.fire(node);
        }

		this._onDidChangeTreeData.fire();
	}

    public async getChildren(element?: INode): Promise<INode[]> {
        try{
            if (!element) {
                const items = [];
                var config = await this.twp.GetProjectForRepository();
                if(config){
                     config.Projects.forEach(element => {
                        var node = new ProjectNode("Project: " + element.Name,element.Id,element.Project,this,this.twp);
                        this.ProjectNodes.push(node);
                        items.push(node);
                    });

                    return items;
                }
                if(!config){

                    let userData : TeamworkAccount = this.twp.ActiveAccount;
   
                    if(isNullOrUndefined(userData)){
                        items.push(new ProjectErrorNode("-> Please login first.","","",0));
                        return items; 
                    }else{
                        let token = userData.token;
                        let root = userData.rootUrl;
                        
                        if(isNullOrUndefined(token) ||isNullOrUndefined(root) || token === "" || root === ""){
                            items.push(new ProjectErrorNode("-> Please login first.","","",0));
                            return items; 
                        }else{
                            items.push(new ProjectErrorNode("-> Select Project for Repository","","",0));
                            return items; 
                        }
                    }
 
 
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