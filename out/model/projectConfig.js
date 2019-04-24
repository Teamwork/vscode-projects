"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProjectConfig {
    constructor(projects) {
        this.Projects = projects;
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
exports.ProjectConfig = ProjectConfig;
class ProjectConfigEntry {
    constructor(Name, Id) {
        this.Name = Name;
        this.Id = Id;
    }
}
exports.ProjectConfigEntry = ProjectConfigEntry;
//# sourceMappingURL=projectConfig.js.map