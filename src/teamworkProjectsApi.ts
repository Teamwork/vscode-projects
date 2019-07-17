
import * as vscode from 'vscode';
import { Utilities } from './utilities';
import { TaskListResponse, TodoList } from './model/responses/TaskListResponse';
import { TodoItem, TaskItemResponse} from './model/responses/TaskItemResponse';
import { Project, ProjectListResponse} from './model/responses/projectListResponse';
import { Person, PeopleResponse} from './model/responses/peopleResponse';
import { TaskQuickAdd, TodoItemQuick } from './model/taskQuickAdd';
import { TeamworkAccount } from './model/teamworkAccount';

export class TeamworkProjectsApi{

    public async GetProjects(context: vscode.ExtensionContext, force: boolean = false, includePeople: boolean= false, getAll: boolean = false, getList: string = "") : Promise<Project[]>{
        var axios = require("axios");
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;
        
        if(!token || !root){
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
                element.people = await this.GetPeopleInProject(context,force,element.id);
            });
        }

        context.globalState.update("twp.data.project",result.data.projects);
        context.globalState.update("twp.data.projects.lastUpdated", new Date() );
        return result.data.projects;
    }

    public async GetPeopleInProject(context: vscode.ExtensionContext,force: boolean = false,id: string) : Promise<Person[]>{

        var axios = require("axios");
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;

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
    
    public async getTaskLists(context: vscode.ExtensionContext, id: number = 0, force: boolean = false) : Promise<TodoList[]>{
        var axios = require("axios");
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }
     
        // Lets check our cache first
        let response: TaskListResponse;
    
        // Load from cache if duration less than 30 minutes
        let cachedNodes : TaskListResponse = context.globalState.get("twp.data." + id + ".tasklist",null);
        let lastUpdated : Date = context.globalState.get("twp.data.tasklists." + id + ".lastUpdated",new Date() );
        if(cachedNodes !== null && cachedNodes["data"]["todo-lists"].length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return cachedNodes["data"]["todo-lists"];
            }
        }
    
        const url = root + '/projects/' + id + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=false';
    
        response = await axios({
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
    
    
        context.globalState.update("twp.data." + id + ".tasklist",response);
        context.globalState.update("twp.data.tasklists." + id + ".lastUpdated",Date.now());
        return response["data"]["todo-lists"]; 
    }

    public async getTaskItems(context: vscode.ExtensionContext, id: number = 0, force: boolean = false) : Promise<TodoItem[]>{
        var axios = require("axios");
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;
        
        if(!token || !root){
            vscode.window.showErrorMessage("Please Configure the extension first!"); 
            return; 
        }

        let todoItems: TodoItem[] = []; 
        let todoResponse: TaskItemResponse;
        // Load from cache if duration less than 30 minutes
        todoItems = context.globalState.get("twp.data." + id + ".todoitem",[]);
        let lastUpdated : Date = context.globalState.get("twp.data.tasklists." + id + ".todoitem", new Date());
        if(todoItems.length > 0 && lastUpdated && !force){
            if(Utilities.DateCompare(lastUpdated,30)){
                return todoItems;
            }
        }

        const url = root + '/tasklists/' + id + '/tasks.json';

        todoResponse = await axios({
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

        todoItems = todoResponse["data"]["todo-items"];
       
        context.globalState.update("twp.data." + id + ".todoitem", todoItems);
        context.globalState.update("twp.data.tasklists." + id + ".todoitem", Date.now());
        return todoItems; 
    }

    public async getTodoItem(context: vscode.ExtensionContext, id: number, force: boolean = false){
     
       
        var axios = require("axios");
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;


        var item = context.globalState.get("twp.data.task." + id,"");
        var lastUpdated = context.globalState.get("twp.data.task." + id + ".lastUpdated", new Date());
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
            context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
            context.globalState.update("twp.data.task." + id, todo);
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
    
            var TurndownService = require('turndown');
            var turndownService = new TurndownService();

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
        context.globalState.update("twp.data.task." + id + ".lastUpdated", Date.now());
        context.globalState.update("twp.data.task." + id, todo);
        return todo;
    }


    public async postTodoItem(context: vscode.ExtensionContext, id: number, tasklistid: number, title:string, description:string){
        var axios = require("axios");
        let userData : TeamworkAccount = context.globalState.get("twp.data.activeAccount");
        let token = userData.token;
        let root = userData.rootUrl;

        const url = root + '/projects/' + id + "/tasks/quickadd.json";

        var task = new TaskQuickAdd();
        task.tasklistId = tasklistid;
        task.notify = false;
        task.private = false;
        task.content = title;

        var todoDetails = new TodoItemQuick();
        todoDetails.description = description;
        task["todo-item"] = todoDetails;

        let json = await axios({
            method: 'post',
            data: task,
            url:url,
            headers: {
               "Content-Type": "application/json",
            },
            auth: {
                    username: token,
                    password: 'xxxxxxxxxxxxx'
            }
          })
        .catch(function (error) {
            console.log(error);
        });

        return json;
    }

    public async getLoginData(context: vscode.ExtensionContext, code: string): Promise<TeamworkAccount> {
     
       
        var axios = require("axios");
        var config = vscode.workspace.getConfiguration('twp');

        let url = 'https://api.teamwork.com/launchpad/v1/token.json?code=' + code;

        let data = {
            code: code,
        };

        let json = await axios({
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



  