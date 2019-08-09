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
import { isNullOrUndefined } from 'util';


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
    public ActiveAccount: TeamworkAccount;

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this.context = context;
        this._extensionPath = extensionPath;
        this.ActiveAccount = context.globalState.get("twp.data.activeAccount");
        this.API = new TeamworkProjectsApi(this._context, this);
        this.WebViews = new WebViews(this._context, this._extensionPath, this.API);
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
         await this.API.AddComment(taskItem, content);
         this.panel.webview.html = await this.GetWebViewContent(taskItem, true);
    }

    public async CompleteTask(taskItem: number){
        
        await this.API.CompleteTask(taskItem);
        if(isNullOrUndefined(this.panel) || isNullOrUndefined(this.panel.webview)){

        }else{
            this.panel.webview.html = await this.GetWebViewContent(taskItem, true);
        }


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
    
                let gitLink = "";
                let gitBranch = "";
                const gitExtension = vscode.extensions.getExtension('vscode.git');
                if( !isNullOrUndefined(gitExtension) ){
                    const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
                    const api = gitExtension.getAPI(1);
                    if(api && api.repositories.length > 0){
                        let repo = api.repositories[0];
                        let remote = repo.state.remotes[0];
                        gitBranch = repo.state.HEAD.name;
                        gitLink = remote.fetchUrl.replace(".git","") + "/blob/" + gitBranch + fileName + "#L" + line;
                        gitLink = gitLink.replace("ssh://git@","https://www");
                    }
                 }
                 let taskDescription = "Task added from VSCode: \n";
                taskDescription += "File: " + fileName + "\n";
                taskDescription += "Line: " + line + "\n";
                if(gitBranch.length > 1) {taskDescription += "Branch:" + gitBranch + "\n";}
                if(gitLink.length > 1) {taskDescription += "Link:" + gitLink + "\n";}
                taskDescription += "Selection: " + "\n";
                taskDescription += text;

                var newTask = await this.API.postTodoItem(this._context,parseInt(this.Config.ActiveProjectId),parseInt(taskList.id),result,taskDescription);

                let userData : TeamworkAccount = this.ActiveAccount;
                let root = userData.rootUrl;

                if(!isNullOrUndefined(newTask)){
                    var id = newTask["data"]["taskIds"];
                    var taskDetails = await this.API.getTodoItem(this._context,parseInt(id),true);

                    var langConfig = Utilities.GetActiveLanguageConfig();
                    var commentWrapper = "-";
                    if(!isNullOrUndefined(langConfig)){
                        //Task: Need to find a workaround for files without a comment symbol configured in VSCode
                        //Link: https://digitalcrew.teamwork.com//tasks/14804255
                        //Assigned To: Tim Cadenbach
                        commentWrapper = isNullOrUndefined(langConfig.comments.lineComment) ? "-" : langConfig.comments.lineComment;
                    }
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
    }

    public async RefreshData(){

        try {
            let userData : TeamworkAccount = this.ActiveAccount;
            this.API = new TeamworkProjectsApi(this.context, this);

            if(isNullOrUndefined(userData)){
                return;
            }

            this.IsLoading = true;

            this.UpdateStatusBarText("Updating Projects");
            if(this.Config === null) {
                this.Config = await this.GetProjectForRepository();
            }  

            if(this.Config.Projects !== null){
                this.Config.Projects.forEach(async element =>{

                    if(element.Name.indexOf("(N/A)") === -1) {  
                        this.UpdateStatusBarText("Teamwork: Refreshing TaskLists");
                        element.Project.TodoLists = await this.API.getTaskLists(this._context,element.Id,true);
                        
                        this.UpdateStatusBarText("Teamwork: Refreshing TodoItems");
                        element.Project.TodoLists.forEach(async subelement =>{
                            subelement.TodoItems = await this.API.getTaskItems(this._context,parseInt(subelement.id),true);
                        });
                    }
                });
            }
            if(!isNullOrUndefined(this.Config.ActiveProjectName)){
                this.UpdateStatusBarText(this.Config.ActiveProjectName);
            }        
        } catch (error) {
            this.IsLoading = false;       
        }

        
  

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

        this._context.workspaceState.update("twp.data.projects",this.Projects );       
        this._context.workspaceState.update("twp.data.projects.lastUpdated",Date.now());
        return nodeList;
    }

    public async GetTaskListQuickTip(force: boolean = false, includePeople: boolean = false): Promise<ProjectQuickTip[]> {

        
        let nodeList: ProjectQuickTip[] = []; 

        if(this.Config === null) {
            this.Config = await this.GetProjectForRepository();
        }  


        if (this.Config.ActiveProjectId === ""){
           await this.SelectActiveProject();
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

            let userData : TeamworkAccount = this.ActiveAccount;

            if(isNullOrUndefined(userData)){
                return;
            }
            let token = userData.token;
            let root = userData.rootUrl;
            
            if(!token || !root){
                return; 
            }

            var path = vscode.workspace.rootPath + "/twp.json";
            let config : ProjectConfig;

            if (fs.existsSync(path)) {
                config = JSON.parse(fs.readFileSync(path, 'utf8'));
                if(config){
                    if(config.Projects.length > 0){

                        config.Projects.forEach(function(prj){
                            if(!isNullOrUndefined(prj.Installation) && prj.Installation !== userData.installationId){
                                prj.Name = prj.Name + " (N/A)";
                            } else {
                                prj.Name = prj.Name.replace(" (N/A)","");
                            }
                        });

                           return config;
                    }else{
                        return new ProjectConfig(null);
                    }

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
        var userData = await this.API.getLoginData(context,code);
        await context.workspaceState.update("twp.data.activeAccount", null);
        await context.workspaceState.update("twp.data.activeAccount", userData);
        this.ActiveAccount = userData;
        this.API = new TeamworkProjectsApi(this._context, this);
        this.RefreshData();
        vscode.window.showInformationMessage("You are now logged in as: " + userData.userEmail + "( " + userData.rootUrl + " )");
        
        return null;
    }
    public async SelectProject() : Promise<ProjectConfig>{

        let userData : TeamworkAccount = this.ActiveAccount;
        
        if(isNullOrUndefined(userData)){
            this.SelectAccount();
            return;
        }
        let token = userData.token;
        let root = userData.rootUrl;

        if(isNullOrUndefined(token) || isNullOrUndefined(root)){
            this.SelectAccount();
            return;
        }


        if(isNullOrUndefined(vscode.workspace.rootPath) || isNullOrUndefined(vscode.workspace.getWorkspaceFolder)){
            vscode.window.showErrorMessage("You need to have a workspace or folder opened to select a project");
            return;
        }


        let savedConfig: ProjectConfig = await this.GetProjectForRepository();

        const projectItem = await vscode.window.showQuickPick(
            this.GetProjectQuickTips(true,savedConfig.Projects),
            { placeHolder: "Select Projects", ignoreFocusOut: true, canPickMany: true },
        );
        if (projectItem) {
            
            var items : ProjectConfigEntry[] = [];
            projectItem.forEach(async element =>{
                items.push(new ProjectConfigEntry(element.label,element.id,element, userData.installationId));
            });
            this.Config = new ProjectConfig(items);
            //Task: we should probably allow users to customize the filename storing projects
            //Link: https://digitalcrew.teamwork.com//tasks/14804236
            //Assigned To: Tim Cadenbach
            var path = vscode.workspace.rootPath + "/twp.json";
            let data = JSON.stringify(this.Config);  
            fs.writeFileSync(path, data);
            
            this.RefreshData();
            vscode.commands.executeCommand("taskOutline.refresh");  
            return this.Config;
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
            this.UpdateStatusBarText(projectItem.name);

            var path = vscode.workspace.rootPath + "/twp.json";
            let data = JSON.stringify(savedConfig);  
            fs.writeFileSync(path, data);


            this.Config.ActiveProjectId = projectItem.id;
            this.Config.ActiveProjectName = projectItem.name;
            return savedConfig;
        }
    }

 
    public async UpdateStatusBarText(text: string){
        let userData : TeamworkAccount = this.ActiveAccount;
        if(isNullOrUndefined(userData)){
            this.statusBarItem.text = "Teamwork: " + text + ", not logged in"; 
        }else{
            this.statusBarItem.text = "Teamwork: " + text + ", " + userData.userEmail;
        }

    }

    public async getTaskLists(context: vscode.ExtensionContext,parentNode: ProjectNode, id: number = 0, force: boolean = false) : Promise<INode[]>{
        this.UpdateStatusBarText("Loading Tasklists......");

        // Load task lists
        var taskLists = await this.API.getTaskLists(context,parentNode.id,force);
        let nodeList: INode[] = [];
        taskLists.forEach(element => {
            nodeList.push(new TaskListNode(element.name, parseInt(element.id),parentNode, null, this));
        });


        if(taskLists.length === 0){
            nodeList.push(new EmptyNode("No TaskLists",0));  
        }


        this.UpdateStatusBarText(this.Config.ActiveProjectName);
        return nodeList; 
    }
   
    public async getTaskItems(context: vscode.ExtensionContext, node: TaskListNode,provider: TaskProvider, id: number = 0, force: boolean = false) : Promise<INode[]>{

        this.UpdateStatusBarText("Loading tasks......");

        let todoItems = await this.API.getTaskItems(context, node.id, force);
        let nodeList: INode[] = []; 

        var config = vscode.workspace.getConfiguration('twp');
        var onlySelf = config.get("OnlySelfAssigned");
        var showUnassigned = config.get("showUnAssigned");
        let userData : TeamworkAccount = this.ActiveAccount;
        let userId = userData.userId;

        for(let i = 0; i < todoItems.length; i++){
            let element = todoItems[i];
            if(!isNullOrUndefined(element["responsible-party-ids"]) && element["responsible-party-ids"].indexOf(userId.toString()) < 0 && onlySelf){
                continue;  
            }
            if(isNullOrUndefined(element["responsible-party-ids"]) && !showUnassigned){
                continue;
            }
            nodeList.push(new TaskItemNode(element.content,
                isNullOrUndefined(element["responsible-party-summary"]) ? "Anyone" : element["responsible-party-summary"],"", 
                element.id,
                element.priority,
                element.hasTickets,
                element.completed,
                !isNullOrUndefined(element.subTasks) && element.subTasks.length > 0,
                element["responsible-party-ids"],
                node,
                "taskItem",
                provider,
                this,
                element.subTasks));
        }

        if(todoItems.length === 0){
            nodeList.push(new EmptyNode("No Tasks",0));  
        }


        this.UpdateStatusBarText(this.Config.ActiveProjectName);
        return nodeList; 
    }



}