import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import {Template} from './adaptiveCards/templateEngine';
import {EvaluationContext} from './adaptiveCards/expressionParser';
import { TaskListNode } from './model/nodes/TaskListNode';
import {TaskItemNode} from './model/nodes/TaskItemNode';
import { ProjectListResponse, Project } from './model/responses/projectListResponse';
import { ProjectQuickTip, PersonQuickTip } from './model/nodes/ProjectQuickTip';
import { ProjectConfig, ProjectConfigEntry } from './model/projectConfig';
import { INode } from './model/nodes/INode';
import { Utilities } from './utilities';
import { ProjectNode } from './model/nodes/ProjectNode';
import { Person, PeopleResponse } from './model/responses/peopleResponse';
import { TaskProvider } from './taskProvider';
import { TeamworkProjectsApi } from './teamworkProjectsApi';
import { EmptyNode } from './model/nodes/EmptyNode';
import { WebViews } from './webviews';
import { TeamworkAccount } from './model/teamworkAccount';


export class TeamworkProjects{
    private readonly _extensionPath: string;    
    private panel: vscode.WebviewPanel | undefined;
    private loginPanel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;
    public Projects: Project[];
    public Config : ProjectConfig;
    public API: TeamworkProjectsApi;
    public IsLoading: Boolean = false;
    public WebViews: WebViews;

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this._extensionPath = extensionPath;
        this.API = new TeamworkProjectsApi();
        this.WebViews = new WebViews(this._context, this._extensionPath)
    }
    private _disposables: vscode.Disposable[] = [];
	public dispose() {
		// Clean up our resources
		this.panel.dispose();
        this.panel = null;
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	public async openResource(taskItem: TaskItemNode): Promise<void> {

        const column = vscode.ViewColumn.Beside;

        if(this.panel){
            this.panel.reveal(column);
            this.panel.title = taskItem.label;
            this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
            this.panel.webview.html = await this.GetWebViewContent(taskItem.id);
        }else{
            this.panel = vscode.window.createWebviewPanel("twp.TaskPreview","Task: " + taskItem.label,vscode.ViewColumn.Beside,{
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this._extensionPath, 'media'))
                ]                
              });
              this.panel.iconPath = {
                light: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg')),
                dark: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg'))
              };
            this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
            this.panel.webview.html = await this.GetWebViewContent(taskItem.id);

            this.panel.webview.onDidReceiveMessage(
                async message => {
                    var data = JSON.parse(message.text);
                    switch (data.type) {
                        case 'comment':
                            this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
                            this.CreateComment(data.taskId, data.comment);
                            return;
                        case 'complete':
                            this.panel.webview.html = this.WebViews.GetWebViewContentLoader();
                            this.CompleteTask(data.taskId);
                            return;
                    }
                }
            );

            this.panel.onDidDispose ( task=>{
                this.dispose();
            });

        }
	}

    public async CreateComment(taskItem: number, content: string){

        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }
        const url = root + '/tasks/' + taskItem + '/comments.json';

        var comment = {                
            "comment": {
                "body": "" + content + "",
                "notify": "false",
                "isPrivate": false,
                "content-type":"text",
                "ParseMentions": true,
            }};

        let json = await axios({
            method: 'post',
            url: url,
            data: comment,
            auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
            }
          })
        .catch(function (error) {
            console.log(comment);
            console.log(error);
        });

         this.panel.webview.html = await this.GetWebViewContent(taskItem, true);
         

    }

    public async CompleteTask(taskItem: number){

        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }
        const url = root + '/tasks/' + taskItem + '/complete.json';


        let json = await axios({
            method: 'put',
            url: url,
            data: "",
            auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
            }
          })
        .catch(function (error) {
            console.log(error);
        });

         this.panel.webview.html = await this.GetWebViewContent(taskItem, true);

    }

    public async GetPeopleQuickTips(people: Person[], assignedTo: String[]) : Promise<PersonQuickTip[]>{
        
        let personTips: PersonQuickTip[] = [];
        
        people.forEach(async element =>{
            var IsPicked = false;
            if(assignedTo.includes(element.id)){
                IsPicked = true;
            }
            personTips.push(new PersonQuickTip(element["first-name"] + " " + element["last-name"], element.id,IsPicked));
        });
        
        return personTips;
    }

    public async AssignTask(node: TaskItemNode){
    }

    public async GetWebViewContent(taskItem: number, force: boolean = false){
        var config = vscode.workspace.getConfiguration('twp');
        var showTeamworkPanel = config.get("ShowTeamworkPanel");
        if(showTeamworkPanel){
            return await this.WebViews.GetWebViewContentTeamwork(taskItem,force);
        }else{
            return await this.WebViews.GetWebViewContentAdaptiveCard(taskItem,force);
        }
    }



    public async QuickAddTask(){
        
        if(this.IsLoading){
            return;
        }

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("You need to have code selected to use this.");
        }


        var workspaceRoot = vscode.workspace.rootPath;
        var fileName = editor.document.fileName.replace(workspaceRoot,"");
        var selection = editor.selection;
        var line = selection.start.line;
        var cursor = selection.start.character;
        var text = editor.document.getText(selection);


        var list = await this.GetTaskListQuickTip(true);
        if(list !== null && list.length > 0){
            const taskList = await vscode.window.showQuickPick(
                list,
                { placeHolder: "Select Tasklist", ignoreFocusOut: true, canPickMany: false },
            );

            if(taskList !== null){
                const result = await vscode.window.showInputBox({
                    placeHolder: 'Task Title @person [today|tomorrow]',
                });
    
    
                const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
                var gitLink = "";
                var gitBranch = "";
                if(gitExtension){
                    const api = gitExtension.getAPI(1);
                    if(api && api.repositories.length > 0){
                        var repo = api.repositories[0];
                        var remote = repo.state.remotes[0];
                        gitBranch = repo.state.HEAD.name;
                        gitLink = remote.fetchUrl.replace(".git","") + "/blob/" + gitBranch + fileName + "#L" + line;
                    }
                 }
                var taskDescription = "Task added from VSCode: \n";
                taskDescription += "File: " + fileName + "\n";
                taskDescription += "Line: " + line + "\n";
                if(gitBranch.length > 0) {taskDescription += "Branch:" + gitBranch + "\n";}
                if(gitLink.length > 0) {taskDescription += "Link:" + gitLink + "\n";}
                taskDescription += "Selection: " + "\n";
                taskDescription += text;

                var newTask = await this.API.postTodoItem(this._context,parseInt(this.Config.ActiveProjectId),parseInt(taskList.id),result,taskDescription);

                var config = vscode.workspace.getConfiguration('twp');
                var root = config.get("APIRoot");
                var id = newTask["data"]["taskIds"];
                var taskDetails = await this.API.getTodoItem(this._context,parseInt(id),true);

                var langConfig = Utilities.GetActiveLanguageConfig();
                var commentWrapper = langConfig.comments.lineComment;
                var content = taskDetails.content;
                var responsible = taskDetails["responsible-party-names"];


                 editor.edit(edit => {
                    edit.setEndOfLine(vscode.EndOfLine.CRLF);
                    edit.insert(new vscode.Position(line, cursor), commentWrapper + "Task: " + content + "\r\n");
                    edit.insert(new vscode.Position(line, cursor), commentWrapper + "Link: " + root + "/tasks/" + id + "\r\n");
                    edit.insert(new vscode.Position(line, cursor), commentWrapper + "Assigned To: " + responsible + "\r\n"+ "\r\n");
                });
                
                vscode.window.showInformationMessage("Task was added");
            }
        }
    }

    public async RefreshData(){

        let userData : TeamworkAccount = this.context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;
        
        if(!token || !root){
            return; 
        }


        if(this.IsLoading){
            return;
        }

        this.IsLoading = true;

        this.statusBarItem.text = "Teamwork: Updating Projects";
        if(this.Config === null) {
            this.Config = await this.GetProjectForRepository();
        }  

        if(this.Config.Projects !== null){
            this.Config.Projects.forEach(async element =>{

                this.statusBarItem.text = "Teamwork: Refreshing TaskLists";
                element.Project.TodoLists = await this.API.getTaskLists(this._context,element.Id,true);
                
                this.statusBarItem.text = "Teamwork: Refreshing TodoItems";
                element.Project.TodoLists.forEach(async subelement =>{
                    subelement.TodoItems = await this.API.getTaskItems(this._context,parseInt(subelement.id),true);
                });
                this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
            });
        }
        
        this.IsLoading = false;
    }

    public toProjectListResponse(json: string): ProjectListResponse {
        return JSON.parse(json);
    }

    public async GetProjectQuickTips(force: boolean = false, selected: ProjectConfigEntry[], includePeople: boolean = false): Promise<ProjectQuickTip[]> {

        
        let nodeList: ProjectQuickTip[] = []; 

        this.Projects = await this.API.GetProjects(this._context,force,includePeople);

        this.Projects.forEach(element => {
            var isPicked = false;
            if(selected && selected.length > 0 && selected.find(p=>p.Id.toString() === element.id)){
                isPicked = true;
            }
            var item = new ProjectQuickTip(element.name, element.id,isPicked);
            nodeList.push(item);
        });

        this._context.globalState.update("twp.data.projects",this.Projects );       
        this._context.globalState.update("twp.data.projects.lastUpdated",Date.now());
        return nodeList;
    }

    public async GetTaskListQuickTip(force: boolean = false, includePeople: boolean = false): Promise<ProjectQuickTip[]> {

        
        let nodeList: ProjectQuickTip[] = []; 

        if(this.Config === null) {
            this.Config = await this.GetProjectForRepository();
        }  


        this.Config.Projects.forEach(element => {
            if(element.Id.toString() === this.Config.ActiveProjectId){

                if(element.Project === undefined || element.Project === null){
                    vscode.window.showInformationMessage("Please pick a project for this repository first");
                    return null;
                }else{
                    if(element.Project.TodoLists && element.Project.TodoLists.length > 0){
                        element.Project.TodoLists.forEach(subelement => {
                            var item = new ProjectQuickTip(subelement.name, subelement.id,false);
                            nodeList.push(item);
                        });
                    }else{
                        vscode.window.showInformationMessage("Please wait for Project data to be loaded");
                        this.RefreshData();
                        return null;
                    }
                }



            }
        });

        return nodeList;
    }


    public async GetProjectForRepository(): Promise<ProjectConfig>{
        try{

            var userConfig = vscode.workspace.getConfiguration('twp');
            var token = userConfig.get("APIKey");
            var root = userConfig.get("APIRoot");
            
            if(!token || !root){
                return; 
            }

            var path = vscode.workspace.rootPath + "/twp.json";
            let config : ProjectConfig;

            if (fs.existsSync(path)) {
                config = JSON.parse(fs.readFileSync(path, 'utf8'));
                if(config){
                    return config;
                }
              }else{
                  return new ProjectConfig(null);
              }

 
        }catch(error){
            console.error(error);
            return new ProjectConfig(null);
        }
    }

    public async SelectAccount() : Promise<Boolean>{
        vscode.env.openExternal(vscode.Uri.parse('https://www.teamwork.com/launchpad/login?state=VSCODE&redirect_uri=vscode://teamwork.twp/loginData'));
        return true;
    }

    public async FinishLogin(context: vscode.ExtensionContext, code: string) : Promise<TeamworkAccount>{
        var api = new TeamworkProjectsApi;
        var userData = await api.getLoginData(context,code);
        console.log(JSON.stringify(userData));
        context.globalState.update("twp.data.activeAccount", userData);
        this.RefreshData();
        return null;
    }
    public async SelectProject() : Promise<ProjectConfig>{
        let savedConfig: ProjectConfig = await this.GetProjectForRepository();

        const projectItem = await vscode.window.showQuickPick(
            this.GetProjectQuickTips(true,savedConfig.Projects),
            { placeHolder: "Select Projects", ignoreFocusOut: true, canPickMany: true },
        );
        if (projectItem) {
            
            var items : ProjectConfigEntry[] = [];
            projectItem.forEach(async element =>{
                items.push(new ProjectConfigEntry(element.label,element.id,element));
            });
            var config = new ProjectConfig(items);
            var path = vscode.workspace.rootPath + "/twp.json";
            let data = JSON.stringify(config);  
            fs.writeFileSync(path, data);

            
            this.RefreshData();
            vscode.commands.executeCommand("taskOutline.refresh");  
            return config;
        }
    }

    public async SelectActiveProject() : Promise<ProjectConfig>{
        let savedConfig: ProjectConfig = await this.GetProjectForRepository();

        let nodeList: ProjectQuickTip[] = []; 
        savedConfig.Projects.forEach(element => {
            var isPicked = false;
            if(parseInt(savedConfig.ActiveProjectId) === element.Id){
                isPicked = true;
            }
            var item = new ProjectQuickTip(element.Name, element.Id.toString(),isPicked);
            nodeList.push(item);
        });

        const projectItem = await vscode.window.showQuickPick(nodeList,
            { placeHolder: "Select Active Project", ignoreFocusOut: true, canPickMany: false },
        );
        if (projectItem) {
            
            savedConfig.ActiveProjectId = projectItem.id;
            savedConfig.ActiveProjectName = projectItem.name;
            this.statusBarItem.text = "Teamwork: " + projectItem.name;

            var path = vscode.workspace.rootPath + "/twp.json";
            let data = JSON.stringify(savedConfig);  
            fs.writeFileSync(path, data);


            return savedConfig;
        }
    }

 
    public async getTaskLists(context: vscode.ExtensionContext,parentNode: ProjectNode, id: number = 0, force: boolean = false) : Promise<INode[]>{
        var statusBarText = this.statusBarItem.text;
        this.statusBarItem.text = "Loading Tasklists......";

        // Load task lists
        var taskLists = await this.API.getTaskLists(context,parentNode.id,force);
        let nodeList: INode[] = [];
        taskLists.forEach(element => {
            nodeList.push(new TaskListNode(element.name, parseInt(element.id),parentNode, null, this));
        });


        if(taskLists.length === 0){
            nodeList.push(new EmptyNode("No TaskLists",0));  
        }


        this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
        return nodeList; 
    }
   
    public async getTaskItems(context: vscode.ExtensionContext, node: TaskListNode,provider: TaskProvider, id: number = 0, force: boolean = false) : Promise<INode[]>{

        this.statusBarItem.text = "Loading tasks......";

        let todoItems = await this.API.getTaskItems(context, node.id, force);
        let nodeList: INode[] = []; 

        todoItems.forEach(element => {
            nodeList.push(new TaskItemNode(element.content,
                element["responsible-party-summary"],"", 
                element.id,
                element.priority,
                element.hasTickets,
                element.completed,
                element["responsible-party-ids"],
                node,
                "taskItem",
                provider,
                this));
        });


        if(todoItems.length === 0){
            nodeList.push(new EmptyNode("No Tasks",0));  
        }


        this.statusBarItem.text = "Teamwork: " + this.Config.ActiveProjectName;
        return nodeList; 
    }



}