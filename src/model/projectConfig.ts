import { Project } from "./responses/projectListResponse";

export class ProjectConfig{
    public ActiveProjectName : string;
    public ActiveProjectId: string;
    public ActiveTaskListId: string;
    public ActiveTaskListName: string;
    public Projects: ProjectConfigEntry[];
    constructor(projects) {
        this.Projects = projects;


        if(this.Projects === undefined){
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
    
    constructor(Name,Id, Project) {
        this.Name = Name;
        this.Id = Id;
        this.Project = Project;
    }
}