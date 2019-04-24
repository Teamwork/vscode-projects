import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import {Template} from './adaptiveCards/templateEngine';
import {EvaluationContext} from './adaptiveCards/expressionParser';
import { TaskListNode } from './model/nodes/TaskListNode';
import {TaskItemNode} from './model/nodes/TaskItemNode';
import { ProjectListResponse } from './model/responses/projectListResponse';
import { ProjectQuickTip } from './model/nodes/ProjectQuickTip';
import { ProjectConfig, ProjectConfigEntry } from './model/projectConfig';
import { INode } from './model/nodes/INode';
import { Utilities } from './utilities';

export class TeamworkProjects{
    private readonly _extensionPath: string;    
    panel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;

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
            this.panel.webview.html = await this.GetWebViewContent(taskItem.id);

            this.panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'action':
                            var data = JSON.parse(message.text);
                            this.CreateComment(data.taskId,data.comment);
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

    public async GetWebViewContent(taskItem: number, force: boolean = false){
        var config = vscode.workspace.getConfiguration('twp');
        var showTeamworkPanel = config.get("ShowTeamworkPanel");
        if(showTeamworkPanel){
            return await this.GetWebViewContentTeamwork(taskItem,force);
        }else{
            return await this.GetWebViewContentAdaptiveCard(taskItem,force);
        }
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
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${ACUri}"></script>
                        <script nonce="${nonce}" src="${MarkdownUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <link rel="stylesheet" href="${mainstyleUri}"  nonce="${nonce}"  type="text/css" />
                        <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                    </head>
                    <body>
                        <input type='hidden' id='cardData' value='${JSON.stringify(expandedTemplatePayload)}'>
                        <div id="exampleDiv"></div>
                        <div id="out"></div>
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
            var taskLists = await this.getTaskLists(this._context,element.Id,true)
            
            this.statusBarItem.text = "Teamwork: Refreshing TodoItems";
            taskLists.forEach(async subelement =>{
                var taskItems = await this.getTaskItems(this._context,subelement.id,true);
            });
            this.statusBarItem.text = "Teamwork: " + project.ActiveProjectName;
        });


    }


    public toProjectListResponse(json: string): ProjectListResponse {
        return JSON.parse(json);
    }

    public async GetProjects(force: boolean = false, selected: ProjectConfigEntry[]): Promise<ProjectQuickTip[]> {
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }
        
        let nodeList: ProjectQuickTip[] = []; 

        // Load from cache if duration less than 30 minutes
        let cachedNodes : ProjectQuickTip[] = this._context.workspaceState.get("twp.data.projects");
        let lastUpdated : Date = this._context.workspaceState.get("twp.data.projects.lastUpdated")
        if(cachedNodes && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes;
            }
        }
        
        const url = root + '/tasks/projects.json?type=canAddItem&pageSize=50';
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


        json.data.projects.forEach(element => {
            var isPicked = false;
            if(selected && selected.find(p=>p.Id === element.id)){
                isPicked = true;
            }
            var item = new ProjectQuickTip(element.name, element.id,isPicked);
            nodeList.push(item);
        });

        this._context.workspaceState.update("twp.data.projects",nodeList);       
        this._context.workspaceState.update("twp.data.projects.lastUpdated",Date.now())
        return nodeList;
    }


    public async GetProjectForRepository(): Promise<ProjectConfig>{
        try{
            var path = vscode.workspace.rootPath + "/twp.json";
            let config = JSON.parse(fs.readFileSync(path, 'utf8'));
    
            if(config){
                return config;
            }
        }catch(error){
            console.error(error);
            return new ProjectConfig(null);
        }
    }


    public async SelectProject() : Promise<ProjectConfig>{
        let savedConfig: ProjectConfig = await this.GetProjectForRepository();

        const projectItem = await vscode.window.showQuickPick(
            this.GetProjects(true,savedConfig.Projects),
            { placeHolder: "Select Projects", ignoreFocusOut: true, canPickMany: true },
        );
        if (projectItem) {
            
            var items : ProjectConfigEntry[] = [];
            projectItem.forEach(async element =>{
                items.push(new ProjectConfigEntry(element.label,element.id));
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

 
    public async getTaskLists(context: vscode.ExtensionContext, id: number, force: boolean = false) : Promise<INode[]>{
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }


        // Lets check our cache first
        let nodeList: INode[] = [];

        // Load from cache if duration less than 30 minutes
        let cachedNodes : INode[] = context.workspaceState.get("twp.data." + id + ".tasklists");
        let lastUpdated : Date = context.workspaceState.get("twp.data.tasklists." + id + ".lastUpdated")
        if(cachedNodes && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes;
            }
        }


        const url = root + '/projects/' + id + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=true';

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
            nodeList.push(new TaskListNode(element.name, element.id,this));
        });

        context.workspaceState.update("twp.data." + id + ".tasklists",nodeList);
        context.workspaceState.update("twp.data.tasklists." + id + ".lastUpdated",Date.now())
        return nodeList; 
    }
   

    public async getTaskItems(context: vscode.ExtensionContext, id: number, force: boolean = false) : Promise<INode[]>{
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }

        let nodeList: INode[] = []; 
        // Load from cache if duration less than 30 minutes
        let cachedNodes : INode[] = context.workspaceState.get("twp.data." + id + ".todoitems");
        let lastUpdated : Date = context.workspaceState.get("twp.data.tasklists." + id + ".todoitems")
        if(cachedNodes && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes;
            }
        }

        const url = root + '/tasklists/' + id + '/tasks.json';

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
            nodeList.push(new TaskItemNode(element.content,element["responsible-party-summary"],element["creator-avatar-url"], element.id,this));
        });

        context.workspaceState.update("twp.data." + id + ".todoitems", nodeList);
        context.workspaceState.update("twp.data.tasklists." + id + ".todoitems", Date.now())
        return nodeList; 
    }


    public async getTodoItem(context: vscode.ExtensionContext, id: number, force: boolean = false){
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');
        var token = config.get("APIKey");
        var root = config.get("APIRoot");


        var item = this._context.workspaceState.get("twp.data.task." + id);
        var todo;
        if(item && !force){
            todo = item;
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
            this._context.workspaceState.update("twp.data.task." + id, todo);
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

        return todo;
    }

}