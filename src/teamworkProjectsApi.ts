
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
        let userData : TeamworkAccount = this.twp.ActiveAccount;

        if(isNullOrUndefined(userData)){
            return;
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
 
        if(userData.useApiKey){
            this.axios.defaults.headers.common = {
                'User-Agent': `tw-vscode (${process.platform} | ${vscode.extensions.getExtension('teamwork.twp').packageJSON.version})`
            };
            this.axios.auth =  {
                username: token,
                password: 'xxxxxxxxxxxxx'
            };
            this.axios.defaults.auth = {
                username: token,
                password: 'xxxxxxxxxxxxx'
            };
        }else{
            this.axios.defaults.headers.common = {
                'User-Agent': `tw-vscode (${process.platform} | ${vscode.extensions.getExtension('teamwork.twp').packageJSON.version})`,
                'Authorization': `Bearer ${token}`};
        }



        this.isConfigured = true;
    }


    



    public async GetProjects(context: vscode.ExtensionContext, force: boolean = false, includePeople: boolean= false, getAll: boolean = false, getList: string = "") : Promise<Project[]>{
       
        let userData : TeamworkAccount = this.twp.ActiveAccount;

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
            return new TodoList[0];
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
        todo['created-on'] = dateFormat(Date.parse(todo['created-on']), "dd-MM-yyyy");
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
                element["datewritten"] = dateFormat(Date.parse(element.datetime), "dd-MM-yyyy hh:mm");
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

        var config = vscode.workspace.getConfiguration('twp');
        var timeTracking = config.get("enabletimeTracking");

        todo["timeIsLogged"] = Number(todo["timeIsLogged"]);
        if(todo["timeIsLogged"] === 1 && timeTracking){
            const timeEntryUrl = this.root + '/projects/api/v2/tasks/' + id + '/time_entries.json?getTotals=true&includeSubTasks=1&page=1&pageSize=250';
            let timeEntries = await this.axios({
                method:'get',
                url: timeEntryUrl,
                headers: {
                   "Content-Type": "application/json",
                },
            })
            .catch(function (error) {
                console.log(error);
            });
    
            let totalHours = 0;
            let totalMinutes = 0;
            let estimated = await this.timeConvert(todo["estimated-minutes"]);
            todo["estimated"] = estimated;
            
            timeEntries.data.timeEntries.forEach(element => {
                element["date"] = dateFormat(Date.parse(element["date"]), "dd-MM-yyyy hh:mm");
                totalHours += element["hours"];
                totalMinutes += element["minutes"];
            });
            let total = await this.timeConvert(totalHours * 60 + totalMinutes);
            todo["total"] = total;
            todo["timeEntries"] = timeEntries.data.timeEntries;

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


    public async AddTimeEntry(taskItem: number, hours: number, minutes: number, description: string, complete: boolean, billable: boolean) : Promise<boolean>{
        if(!this.isConfigured){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }  
        const url = this.root + 'tasks/' + taskItem + '/time_entries.json';

        let userData : TeamworkAccount = this.twp.ActiveAccount;
        let userId = userData.userId;

        var dateFormat = require('dateformat');

        let start = new Date();
        start.setHours(start.getHours() - hours);
        start.setMinutes(start.getMinutes() - minutes);

        var timeentry = {
            "time-entry": {
                "date": dateFormat(start,"yyyymmdd"),
                "time": dateFormat(start,"HH:MM"),
                "description": description,
                "hours":  hours,
                "minutes":  minutes,
                "isBillable": billable,
                "markTaskComplete": complete,
                "person-id": userId.toString()
            }
         };

        let json = await this.axios({
            method: 'post',
            url: url,
            data: timeentry,
            headers: {
                "Content-Type": "application/json",
             }
          })
        .catch(function (error) {
            console.log(timeentry);
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

    public async getLoginDataLegacy(context: vscode.ExtensionContext, root: string, apiKey: string): Promise<TeamworkAccount> {
        
        var loginaxios = require("axios");

        let url = root + '/account.json';

        let json = await loginaxios({
            method:'get',
            url,
            auth: {
                username: apiKey,
                password: 'xxxxxxxxxxxxx'
        }
        })
        .catch(function (error) {
            console.log(error);
            vscode.window.showErrorMessage("Getting details failed, are you sure your APIKey is correct?");
            return null;
        });

        let loginData = json["data"];

        let user = new TeamworkAccount(
            loginData.account.id,
            0,
            "",
            "",
            apiKey,
            root,true);
        url = root + '/me.json',
        json = await loginaxios({
            method:'get',
            url,
            auth: {
                username: apiKey,
                password: 'xxxxxxxxxxxxx'
        }
        })
        .catch(function (error) {
            console.log(error);
            vscode.window.showErrorMessage("Getting details failed, are you sure your APIKey is correct?");
            return null;
        });

        let meData = json["data"];

        user.userId = meData.person.id;
        user.userName = meData.person["user-name"]



        return user;
    }


    public async timeConvert(n) : Promise<string> {
        var num = n;
        var hours = (num / 60);
        var rhours = Math.floor(hours);
        var minutes = (hours - rhours) * 60;
        var rminutes = Math.round(minutes);
        return rhours + "h " + rminutes + "m";
    }

}



  