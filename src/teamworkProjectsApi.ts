
import * as vscode from 'vscode';
import { Utilities } from './utilities';
import { TaskListResponse, TodoList } from './model/responses/TaskListResponse';
import { TodoItem, TaskItemResponse} from './model/responses/TaskItemResponse';
import { Project, ProjectListResponse} from './model/responses/projectListResponse';
import { Person, PeopleResponse} from './model/responses/peopleResponse';
import { TaskQuickAdd, TodoItemQuick } from './model/taskQuickAdd';
import { TeamworkAccount } from './model/teamworkAccount';
import { isNullOrUndefined } from 'util';
import { TeamworkProjects } from './teamworkProjects';

export class TeamworkProjectsApi{


    private axios = require("axios");
    private isConfigured: boolean;
    private root: string;
    private twp: TeamworkProjects;

    constructor(context: vscode.ExtensionContext, teamwork: TeamworkProjects) {
        this.twp = teamwork;
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let tempUserData = this.twp.ActiveAccount;


        if((isNullOrUndefined(userData) && !isNullOrUndefined(tempUserData)) 
        || (!isNullOrUndefined(userData) && !isNullOrUndefined(tempUserData) && userData.installationId !== tempUserData.installationId)){
            userData = tempUserData;
        }

        let token: string;
        
        if(isNullOrUndefined(userData)){
            this.isConfigured = false;
            return; 
        }else{
            token = userData.token;
            this.root = userData.rootUrl;
    
    
            if(!token || !this.root){
                this.isConfigured = false;
                return; 
            } 
        }
 

        this.axios.defaults.headers.common = {
            'User-Agent': `tw-vscode (${process.platform} | ${vscode.extensions.getExtension('teamwork.twp').packageJSON.version})`,
            'Authorization': `Bearer ${token}`};

        this.isConfigured = true;
    }


    



    public async GetProjects(context: vscode.ExtensionContext, force: boolean = false, includePeople: boolean= false, getAll: boolean = false, getList: string = "") : Promise<Project[]>{
       
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let tempUserData = this.twp.ActiveAccount;
        
        if((isNullOrUndefined(userData) && !isNullOrUndefined(tempUserData)) 
        || (!isNullOrUndefined(userData) && !isNullOrUndefined(tempUserData) && userData.installationId !== tempUserData.installationId)){
            userData = tempUserData;
        }

        if(!isNullOrUndefined(userData)){
            this.isConfigured = true;
        }



        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  

        let result;
        // Load from cache if duration less than 30 minutes
        let cachedProjects : Project[] = context.globalState.get("twp.data.project",null);
        let lastUpdated : Date = context.globalState.get("twp.data.projects.lastUpdated", new Date() );
        if(cachedProjects && cachedProjects.length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                result =  cachedProjects;
            }
        }

        if(!result){
            const url = this.root + '/tasks/projects.json?type=canAddItem&pageSize=200';

            result = await this.axios({
                method:'get',
                url,
            })
            .catch(function (error) {
                console.log(error);
            });
        }

        if(includePeople){
            result.data.projects.forEach(async element =>{
                element.people = await this.GetPeopleInProject(context,force,element.id);
            });
        }

       if(!isNullOrUndefined(result.data)){ await context.globalState.update("twp.data.project",result.data.projects);}
       if(!isNullOrUndefined(result.data)){  await context.globalState.update("twp.data.projects.lastUpdated", new Date() );}
        return result.data.projects;
    }

    public async GetPeopleInProject(context: vscode.ExtensionContext,force: boolean = false,id: string) : Promise<Person[]>{
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  
 
        var url = this.root + '/projects/' + id + "/people.json";
        let json = await this.axios({
            method:'get',
            url
        })
        .catch(function (error) {
            console.log(error);
        });

        return json.people; 
    }
    
    public async getTaskLists(context: vscode.ExtensionContext, id: number = 0, force: boolean = false) : Promise<TodoList[]>{
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  
     
        // Lets check our cache first
        let response: TaskListResponse;
    
        // Load from cache if duration less than 30 minutes
        let cachedNodes : TaskListResponse = await context.globalState.get("twp.data." + id + ".tasklist",null);
        let lastUpdated : Date = await context.globalState.get("twp.data.tasklists." + id + ".lastUpdated",new Date() );
        if(cachedNodes !== null && cachedNodes["data"]["tasklists"].length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes["data"]["tasklists"];
            }
        }
    
        const url = this.root + '/projects/api/v1/projects/' + id + '/tasklists.json?page=1&pageSize=100';

        response = await this.axios({
            method:'get',
            url
        })
        .catch(function (error) {
            console.log(error);
        });
    
    
        await context.globalState.update("twp.data." + id + ".tasklist",response);
        await context.globalState.update("twp.data.tasklists." + id + ".lastUpdated",Date.now());
        return response["data"]["tasklists"]; 
    }

    public async getTaskItems(context: vscode.ExtensionContext, id: number = 0, force: boolean = false) : Promise<TodoItem[]>{
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  

        let todoItems: TodoItem[] = []; 
        let todoResponse: TaskItemResponse;
        // Load from cache if duration less than 30 minutes
        todoItems = context.globalState.get("twp.data." + id + ".todoitem",[]);
        let lastUpdated : Date = await  context.globalState.get("twp.data.tasklists." + id + ".todoitem", new Date());
        if(todoItems.length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return todoItems;
            }
        }

        const url = this.root + '/tasklists/' + id + '/tasks.json?nestSubTasks=true';
         todoResponse = await this.axios({
            method:'get',
            url,
        })
        .catch(function (error) {
            console.log(error);
        });

        todoItems = todoResponse["data"]["todo-items"];
       
        context.globalState.update("twp.data." + id + ".todoitem", todoItems);
        context.globalState.update("twp.data.tasklists." + id + ".todoitem", Date.now());
        return todoItems; 
    }

    public async getTodoItem(context: vscode.ExtensionContext, id: number, force: boolean = false){
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  

        var item = context.globalState.get("twp.data.task." + id,"");
        var lastUpdated = context.globalState.get("twp.data.task." + id + ".lastUpdated", new Date());
        var todo;
        if(item && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                todo = item;
            }
        }else{
            const url = this.root + '/tasks/' + id + '.json';

            let json = await this.axios({
                method:'get',
                url
            })
            .catch(function (error) {
                console.log(error);
            });

            todo = json.data["todo-item"];
            await context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
            await context.globalState.update("twp.data.task." + id, todo);
        }

        var dateFormat = require('dateformat');
        todo['created-on'] = dateFormat(Date.parse(todo['created-on']), "ddd-mm-yyyy");
        todo['description'] = todo['description'].replace('\'','´');
        todo['content'] = todo['content'].replace('\'','´');

        // If task has comments -> Load them
        if(todo["comments-count"] > 0){
            const commenturl = this.root + '/tasks/' + id + '/comments.json';
            let comments = await this.axios({
                method:'get',
                url: commenturl,
                headers: {
                   "Content-Type": "application/json",
                },
            })
            .catch(function (error) {
                console.log(error);
            });
    
            var TurndownService = require('turndown');
            var turndownService = new TurndownService();

            comments.data.comments.forEach(element => {
                var newBody = turndownService.turndown(element['html-body']);
                newBody = newBody.replace('\'','´');
                element.body = newBody;
                element["datewritten"] = dateFormat(Date.parse(element.datetime), "ddd-mm-yyyy hh:MM");
            });

            todo["comments"] = comments.data.comments;
        }
     
        if(todo["attachments-count"] > 0){
            const attachment = this.root + '/v/2/tasks/' + id + '/files.json?getCategoryPath=true&getLikes=true&getVersions=true&page=1&pageSize=50';
            let comments = await this.axios({
                method:'get',
                url: attachment,
                headers: {
                   "Content-Type": "application/json",
                },
            })
            .catch(function (error) {
                console.log(error);
            });
    
            todo["attachments"] = comments.data.files;
        }

        todo["rooturl"] = this.root;
        todo.rooturl = this.root;
        context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
        context.globalState.update("twp.data.task." + id, todo);
        return todo;
    }


    public async postTodoItem(context: vscode.ExtensionContext, id: number, tasklistid: number, title:string, description:string) {
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  

        const url = this.root + '/projects/' + id + "/tasks/quickadd.json";

        var task = new TaskQuickAdd();
        task.tasklistId = tasklistid;
        task.notify = false;
        task.private = false;
        task.content = title;

        var todoDetails = new TodoItemQuick();
        todoDetails.description = description;
        task["todo-item"] = todoDetails;

        let json = await this.axios({
            method: 'post',
            data: task,
            url:url,
            headers: {
               "Content-Type": "application/json",
            },
          })
        .catch(function (error) {
            console.log(error);
        });

        return json;
    }

    public async CompleteTask(taskItem: number) : Promise<boolean>{
        
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  
        const url = this.root + '/tasks/' + taskItem + '/complete.json';
        let json = await this.axios({
            method: 'put',
            url: url,
            data: ""
          })
        .catch(function (error) {
            console.log(error);
            return false;
        });
        return true;
    }


    public async AddComment(taskItem: number, content: string) : Promise<boolean>{
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  
        const url = this.root + '/tasks/' + taskItem + '/comments.json';

        var comment = {                
            "comment": {
                "body": "" + content + "",
                "notify": "false",
                "isPrivate": false,
                "content-type":"text",
                "ParseMentions": true,
            }};

        let json = await this.axios({
            method: 'post',
            url: url,
            data: comment
          })
        .catch(function (error) {
            console.log(comment);
            console.log(error);
            return false;
        });
        return true;
    }


    public async getLoginData(context: vscode.ExtensionContext, code: string): Promise<TeamworkAccount> {
     
       
        var loginaxios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');

        let url = 'https://api.teamwork.com/launchpad/v1/token.json?code=' + code;

        let data = {
            code: code,
        };

        let json = await loginaxios({
            method:'post',
            data: JSON.stringify(data),
            url,
        })
        .catch(function (error) {
            console.log(error);
            return null;
        });


        let loginData = json["data"];

        let user = new TeamworkAccount(
            loginData.installation.id,
            loginData.user.id,
            loginData.user.firstName + " " + loginData.user.lastName,
            loginData.user.email,
            loginData["access_token"],
            loginData.installation.apiEndPoint,);

        return user;
    }

}



  