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


export class TeamworkProjects{
    private readonly _extensionPath: string;    
    panel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;
    public Projects: Project[];
    public Config : ProjectConfig;
    public API: TeamworkProjectsApi;
    public IsLoading: Boolean = false;

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this._extensionPath = extensionPath;
        this.API = new TeamworkProjectsApi();
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
            this.panel.webview.html = this.GetWebViewContentLoader();
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
            this.panel.webview.html = this.GetWebViewContentLoader();
            this.panel.webview.html = await this.GetWebViewContent(taskItem.id);

            this.panel.webview.onDidReceiveMessage(
                async message => {
                    var data = JSON.parse(message.text);
                    switch (data.type) {
                        case 'comment':
                            this.panel.webview.html = this.GetWebViewContentLoader();
                            this.CreateComment(data.taskId, data.comment);
                            return;
                        case 'complete':
                            this.panel.webview.html = this.GetWebViewContentLoader();
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
            return await this.GetWebViewContentTeamwork(taskItem,force);
        }else{
            return await this.GetWebViewContentAdaptiveCard(taskItem,force);
        }
    }

    public GetWebViewContentLoader(){
           
            // jquery
            const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
            const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });

            const nonce = this.getNonce();

            const ACstyle = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'loader.css'));
            const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });

            return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                    </head>
                    <body style='background:#2D2B2C;height:800px;width:400px;'>
                            <div id="app-loader" class="app-loader" >
                            <svg class="app-loader__-logo" xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 160 128">
                                <defs>
                                    <style>
                                        .cls-1 {
                                            fill: #ffffff;
                                        }
                        
                                        .cls-2 {
                                            fill: #ffffff;
                                        }
                                    </style>
                                </defs>
                                <circle class="cls-1" cx="118" cy="86" r="12"></circle>
                                <path class="cls-2" d="M160,48a32,32,0,0,0-32-32H63.59A20.07,20.07,0,0,0,44,0H20A20.06,20.06,0,0,0,0,20V96a32,32,0,0,0,32,32h96a32,32,0,0,0,32-32Zm-32,64H32A16,16,0,0,1,16,96V32H128a16,16,0,0,1,16,16V96A16,16,0,0,1,128,112Z"></path>
                            </svg>
                            <p class="w-app-preloading__installation-name" style='color:#ffffff'>
                                please wait...
                            </p>
                            <div class="app-loader__loading-bar"></div>
                        </div>
                    </body>
                    </html>`;


    }

    public async GetWebViewContentAdaptiveCard(taskItem: number, force: boolean = false)  {
        var todo = await this.API.getTodoItem(this._context, taskItem,force);
        if(todo){
            const templateFile = require(path.join(this._extensionPath, 'media/cards', 'taskCard.json'));
            var  _templatePayload: object = templateFile;


             let template = new Template( _templatePayload);
             let context = new EvaluationContext();
             context.$root = todo;
             let expandedTemplatePayload = template.expand(context);

            // Local path to main script run in the webview
            const scriptPathOnDisk = vscode.Uri.file(
                path.join(this._extensionPath, 'media/js', 'mainAdaptive.js')
            );
            // And the uri we use to load this script in the webview
            const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
            
            // jquery
            const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
            const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });


            // AdaptiveCards
            let url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'fabric.min.js'));
            const FabricUri = url.with({ scheme: 'vscode-resource' });

             url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'adaptivecards.min.js'));
            const ACUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'adaptivecards-fabric.min.js'));
            const ACUFabricUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'react.min.js'));
            const ReactUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'react-dom.min.js'));
            const ReactDomUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'markdown-it.min.js'));
            const MarkdownUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'msteamsstyle.css'));
            const mainstyleUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'fabric.components.min.css'));
            const FabricStyleUri = url.with({ scheme: 'vscode-resource' });

            const ACstyle = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'editormain.css'));
            const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });

            
            const nonce = this.getNonce();

            return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">

                        <link rel="stylesheet" href="${mainstyleUri}"  nonce="${nonce}"  type="text/css" />
                        <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                        <link rel="stylesheet" href="${FabricStyleUri}"  nonce="${nonce}"  type="text/css" />
                    </head>
                    <body>
                        <div id="exampleDiv"></div>
                        <div id="out"></div>
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${ReactUri}"></script>
                        <script nonce="${nonce}" src="${ReactDomUri}"></script>
  
                        <script nonce="${nonce}" src="${FabricUri}"></script>
                        <script nonce="${nonce}" src="${ACUri}"></script>
                        <script nonce="${nonce}" src="${ACUFabricUri}"></script>
                        

                        <script nonce="${nonce}" src="${MarkdownUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <div id="divData" style='display:none;'>
                            ${JSON.stringify(expandedTemplatePayload)}
                        </div>
                    </body>
                    </html>`;
        }
    }

    public async GetWebViewContentTeamwork(taskItem: number, force: boolean = false)  {
        var config = vscode.workspace.getConfiguration('twp');
        var root = config.get("APIRoot");

        var auth = "Basic " + Buffer.from(config.get("APIKey") + ":xxxxxx").toString("base64");

        var todo = await this.API.getTodoItem(this._context, taskItem);

        if(todo){
            const nonce = this.getNonce();

            const scriptPathOnDisk = vscode.Uri.file(
                path.join(this._extensionPath, 'media/js', 'mainTeamwork.js')
            );
            // And the uri we use to load this script in the webview
            const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
            
            // jquery
            const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
            const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });
    
    
            return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <script type="text/javascript" nonce="${nonce}">
                            $(document).ready(function () {
        
                                $.ajax({
                                    url: '${root}' + 'me.json',
                                    headers: {
                                        'Authorization': '${auth}',
                                    },
                                    dataType: 'json',
                                    method: 'GET',
                                    crossDomain: true,
                                    success: function(data) {

                                    },
                                    error: function() {
                                        var frameUrl = '${root}' + '?embeddedView=1#embed?view=viewTask&params=' + encodeURIComponent(JSON.stringify({ taskId: parseInt("${taskItem}") }))
                                        $('#frmTasks').attr('src', frameUrl);
                                    },
                                    xhrFields: {
                                        withCredentials: true
                                    }
                                });
                            });
    
                        </script>
                    </head>
                    <body>
                        <iframe id="frmTasks" allowtransparency="true" frameborder="0" style="display:none;overflow:hidden;height:97%;width:100%" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-scripts allow-same-origin"></iframe>
                    </body>
                    </html>`;
        }


    }

    private getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
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

        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
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
        this.panel = vscode.window.createWebviewPanel("twp.TaskPreview","Teamwork Projects, Login",vscode.ViewColumn.Beside,{
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._extensionPath, 'media'))
            ]                
          });
          this.panel.iconPath = {
            light: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg')),
            dark: vscode.Uri.file(path.join(this._extensionPath, 'resources', 'projects-white.svg'))
          };
        return true;
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