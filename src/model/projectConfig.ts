export class ProjectConfig{
    public ActiveProjectName : string;
    public ActiveProjectId: string;
    public Projects: ProjectConfigEntry[];
    constructor(projects) {
        this.Projects = projects;

        if(projects){
            this.ActiveProjectName = projects[0].Name;
            this.ActiveProjectId = projects[0].Id;
        }else{
            this.ActiveProjectName = "No Project Selected";
            this.ActiveProjectId = "0";      
        }
    }
}

export class ProjectConfigEntry{
    public readonly Name: string;
    public readonly Id: number;
    
    constructor(Name,Id) {
        this.Name = Name;
        this.Id = Id;
    }
}