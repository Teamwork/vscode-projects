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

export class TeamworkProjects{
    private readonly _extensionPath: string;    
    panel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;

    public Projects: Project[];

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this._extensionPath = extensionPath;
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
                light: vscode.Uri.file(path.join(this._extensionPath, 'media', 'projects-white.svg')),
                dark: vscode.Uri.file(path.join(this._extensionPath, 'media', 'projects-white.svg'))
              }
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

        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }


        let assignedTo : string[] = node.assignedTo.split(",");
        let people: Person[] = await this.GetPeopleInProject(true, node.parentNode.parentNode.id.toString());

        const selectedPeople = await vscode.window.showQuickPick(
            this.GetPeopleQuickTips(people,assignedTo),
            { placeHolder: "Select Person", ignoreFocusOut: true, canPickMany: true },
        );
        if (selectedPeople) {
            
            vscode.window.showInformationMessage("et voila");
        }
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
        var todo = await this.getTodoItem(this._context, taskItem,force);
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
            const ACPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'adaptivecards.min.js'));
            const ACUri = ACPath.with({ scheme: 'vscode-resource' });
            const MarkdownPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'markdown-it.min.js'));
            const MarkdownUri = MarkdownPath.with({ scheme: 'vscode-resource' });

            

            const mainstyle = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'msteamsstyle.css'));
            const mainstyleUri = mainstyle.with({ scheme: 'vscode-resource' });

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
                    </head>
                    <body>
                        <div id="exampleDiv"></div>
                        <div id="out"></div>
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${ACUri}"></script>
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

        var todo = await this.getTodoItem(this._context, taskItem);

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

    public async RefreshData(){


        this.statusBarItem.text = "Teamwork: Updating Projects";
        let project : ProjectConfig = await this.GetProjectForRepository();

        project.Projects.forEach(async element => {
            this.statusBarItem.text = "Teamwork: Refreshing TaskLists";
            var taskLists = await this.getTaskLists(this._context,null,element.Id,true)
            
            this.statusBarItem.text = "Teamwork: Refreshing TodoItems";
            taskLists.forEach(async subelement =>{
                var taskItems = await this.getTaskItems(this._context,null,null,subelement.id,true);
            });
            this.statusBarItem.text = "Teamwork: " + project.ActiveProjectName;
        });


    }

    public toProjectListResponse(json: string): ProjectListResponse {
        return JSON.parse(json);
    }

    public async GetProjects(force: boolean = false, includePeople: boolean= false, getAll: boolean = false, getList: string = "") : Promise<Project[]>{
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  

        let result;
        // Load from cache if duration less than 30 minutes
        let cachedProjects : Project[] = this._context.globalState.get("twp.data.projects",null);
        let lastUpdated : Date = this._context.globalState.get("twp.data.projects.lastUpdated", new Date() );
        if(cachedProjects && cachedProjects.length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                result =  cachedProjects;
            }
        }

        if(!result){
            const url = root + '/tasks/projects.json?type=canAddItem&pageSize=200';
            result = await axios({
                method:'get',
                url,
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
            .catch(function (error) {
                console.log(error);
            });
        }

        if(includePeople){
            result.data.projects.forEach(async element =>{
                element.people = await this.GetPeopleInProject(force,element.id);
            });
        }

        this.Projects = result.data.projects;
        this._context.globalState.update("twp.data.projects",result.data.projects);
        this._context.globalState.update("twp.data.projects.lastUpdated", new Date() );
        return result.projects;
    }

    public async GetProjectQuickTips(force: boolean = false, selected: ProjectConfigEntry[], includePeople: boolean = false): Promise<ProjectQuickTip[]> {

        
        let nodeList: ProjectQuickTip[] = []; 

        let projects = await this.GetProjects(force,includePeople);

        this.Projects.forEach(element => {
            var isPicked = false;
            if(selected && selected.length > 0 && selected.find(p=>p.Id.toString() === element.id)){
                isPicked = true;
            }
            var item = new ProjectQuickTip(element.name, element.id,isPicked);
            nodeList.push(item);
        });

        this._context.globalState.update("twp.data.projects",projects );       
        this._context.globalState.update("twp.data.projects.lastUpdated",Date.now())
        return nodeList;
    }


    public async GetPeopleInProject(force: boolean = false,id: string) : Promise<Person[]>{

        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }
 
        var url = root + '/projects/' + id + "/people.json";
        let json = await axios({
            method:'get',
            url,
            auth: {
                username: token,
                password: 'xxxxxxxxxxxxx'
            }
        })
        .catch(function (error) {
            console.log(error);
        });

        return json.people; 
    }


    public async GetProjectForRepository(): Promise<ProjectConfig>{
        try{
            var path = vscode.workspace.rootPath + "/twp.json";

            if (fs.existsSync(path)) {
                let config = JSON.parse(fs.readFileSync(path, 'utf8'));
    
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
            })
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

        const projectItem = await vscode.window.showQuickPick(
            this.GetProjectQuickTips(true,savedConfig.Projects),
            { placeHolder: "Select Active Project", ignoreFocusOut: true, canPickMany: false },
        );
        if (projectItem) {
            
            var path = vscode.workspace.rootPath + "/twp.json";
            let data = JSON.stringify(savedConfig);  
            fs.writeFileSync(path, data);
            return savedConfig;
        }
    }

 
    public async getTaskLists(context: vscode.ExtensionContext, node: ProjectNode,id: number = 0, force: boolean = false) : Promise<INode[]>{
        var statusBarText = this.statusBarItem.text;
        this.statusBarItem.text = "Loading Tasklists......";
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }

        var idToUse: number = id !== 0 ? id : node.id;

        // Lets check our cache first
        let nodeList: INode[] = [];

        // Load from cache if duration less than 30 minutes
        let cachedNodes : INode[] = context.globalState.get("twp.data." + idToUse + ".tasklists",[]);
        let lastUpdated : Date = context.globalState.get("twp.data.tasklists." + idToUse + ".lastUpdated",new Date() );
        if(cachedNodes.length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes;
            }
        }


        const url = root + '/projects/' + idToUse + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=true';

        let json = await axios({
            method:'get',
            url,
            auth: {
                username: token,
                password: 'xxxxxxxxxxxxx'
            }
        })
        .catch(function (error) {
            console.log(error);
        });

        json.data["todo-lists"].forEach(element => {
            var provider = node !== null ? null : node.provider;
            nodeList.push(new TaskListNode(element.name, element.id,node,provider,this));
        });

        context.globalState.update("twp.data." + idToUse + ".tasklists",nodeList);
        context.globalState.update("twp.data.tasklists." + idToUse + ".lastUpdated",Date.now())
        this.statusBarItem.text = statusBarText;
        return nodeList; 
    }
   

    public async getTaskItems(context: vscode.ExtensionContext, node: TaskListNode,provider: TaskProvider, id: number = 0, force: boolean = false) : Promise<INode[]>{
       
        var statusBarText = this.statusBarItem.text;
        this.statusBarItem.text = "Loading tasks......";
       
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }

        var idToUse: number = id !== 0 ? id : node.id;

        let nodeList: INode[] = []; 
        // Load from cache if duration less than 30 minutes
        let cachedNodes : INode[] = context.globalState.get("twp.data." + idToUse + ".todoitems",[]);
        let lastUpdated : Date = context.globalState.get("twp.data.tasklists." + idToUse + ".todoitems", new Date())
        if(cachedNodes.length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes;
            }
        }

        const url = root + '/tasklists/' + idToUse + '/tasks.json';

        let json = await axios({
            method:'get',
            url,
            auth: {
                username: token,
                password: 'xxxxxxxxxxxxx'
            }
        })
        .catch(function (error) {
            console.log(error);
        });

        json.data["todo-items"].forEach(element => {
            nodeList.push(new TaskItemNode(element.content,
                element["responsible-party-summary"],"", 
                element.id,
                element.priority,
                element.hasTickets,
                element.isComplete,
                element["responsible-party-ids"],
                node,
                "taskItem",
                provider,
                this));
        });

        
        context.globalState.update("twp.data." + idToUse + ".todoitems", nodeList);
        context.globalState.update("twp.data.tasklists." + idToUse + ".todoitems", Date.now());
        this.statusBarItem.text = statusBarText;
        return nodeList; 
    }


    public async getTodoItem(context: vscode.ExtensionContext, id: number, force: boolean = false){
        
        var statusBarText = this.statusBarItem.text;
        this.statusBarItem.text = "Fetching task details";
        
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");


        var item = this._context.globalState.get("twp.data.task." + id,"");
        var lastUpdated = this._context.globalState.get("twp.data.task." + id + ".lastUpdated", new Date());
        var todo;
        if(item && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                todo = item;
            }
        }else{
            const url = root + '/tasks/' + id + '.json';


            let json = await axios({
                method:'get',
                url,
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
            .catch(function (error) {
                console.log(error);
            });

            todo = json.data["todo-item"];
            this._context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
            this._context.globalState.update("twp.data.task." + id, todo);
        }

        var dateFormat = require('dateformat');
        todo['created-on'] = dateFormat(Date.parse(todo['created-on']), "ddd-mm-yyyy");
        todo['description'] = todo['description'].replace('\'','´');
        todo['content'] = todo['content'].replace('\'','´');

        // If task has comments -> Load them
        if(todo["comments-count"] > 0){
            const commenturl = root + '/tasks/' + id + '/comments.json';
            let comments = await axios({
                method:'get',
                url: commenturl,
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    
            var TurndownService = require('turndown')
            var turndownService = new TurndownService()

            comments.data.comments.forEach(element => {
                var newBody = turndownService.turndown(element['html-body']);
                newBody = newBody.replace('\'','´');
                element.body = newBody;
                element["datetime"] = dateFormat(Date.parse(todo.datetime), "ddd-mm-yyyy hh:MM");
            });

            todo["comments"] = comments.data.comments;
        }
     
        if(todo["attachments-count"] > 0){
            const attachment = root + '/v/2/tasks/' + id + '/files.json?getCategoryPath=true&getLikes=true&getVersions=true&page=1&pageSize=50';
            let comments = await axios({
                method:'get',
                url: attachment,
                auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    
            todo["attachments"] = comments.data.files;
        }

        todo["rooturl"] = root;
        todo.rooturl = root;
        this._context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
        this._context.globalState.update("twp.data.task." + id, todo);
        this.statusBarItem.text = statusBarText;
        return todo;
    }

}