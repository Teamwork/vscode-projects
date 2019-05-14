"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProjectConfig {
    constructor(projects) {
        this.Projects = projects;
        // Active Project no longer selected -> clear
        if (!this.Projects.find(p => p.Id === parseInt(this.ActiveProjectId))) {
            this.ActiveProjectName = "";
            this.ActiveProjectId = "";
        }
        if (this.ActiveProjectName && this.ActiveProjectName.length < 1) {
            if (projects) {
                this.ActiveProjectName = projects[0].Name;
                this.ActiveProjectId = projects[0].Id;
            }
            else {
                this.ActiveProjectName = "No Project Selected";
                this.ActiveProjectId = "0";
            }
        }
    }
}
exports.ProjectConfig = ProjectConfig;
class ProjectConfigEntry {
    constructor(Name, Id, Project) {
        this.Name = Name;
        this.Id = Id;
        this.Project = Project;
    }
}
exports.ProjectConfigEntry = ProjectConfigEntry;
//# sourceMappingURL=projectConfig.js.map