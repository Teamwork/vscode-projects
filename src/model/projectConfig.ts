import { Project } from "./responses/projectListResponse";
import { isNullOrUndefined } from "util";

export class ProjectConfig{
    public ActiveProjectName : string;
    public ActiveProjectId: string;
    public ActiveTaskListId: string;
    public ActiveTaskListName: string;
    public Projects: ProjectConfigEntry[];
    constructor(projects) {
        this.Projects = projects;


        if(isNullOrUndefined(this.Projects)){
            this.ActiveProjectName = "No Project Selected";
            this.ActiveProjectId = "0";   
            return;
        }

        // Active Project no longer selected -> clear
        if(!this.Projects.find(p=>p.Id === parseInt(this.ActiveProjectId))){
            this.ActiveProjectName = "";
            this.ActiveProjectId = "";
        }

        if(this.ActiveProjectName && this.ActiveProjectName.length < 1){
            if(projects ){
                this.ActiveProjectName = projects[0].Name;
                this.ActiveProjectId = projects[0].Id;
            }else{
                this.ActiveProjectName = "No Project Selected";
                this.ActiveProjectId = "0";      
            }
        }


    }
}

export class ProjectConfigEntry{
    public readonly Name: string;
    public readonly Id: number;
    public readonly Project: Project;
    public readonly Installation: number;
    
    constructor(Name,Id, Project, Installation) {
        this.Name = Name;
        this.Id = Id;
        this.Project = Project;
        this.Installation = Installation;
    }
}