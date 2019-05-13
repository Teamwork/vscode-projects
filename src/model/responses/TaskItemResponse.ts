// To parse this data:
//
//   import { Convert, TaskItemResponse } from "./file";
//
//   const taskItemResponse = Convert.toTaskItemResponse(json);

export interface TaskItemResponse {
    STATUS?:       string;
    "todo-items"?: TodoItem[];
}
export interface TodoItem {
    id?:                            number;
    boardColumn?:                   BoardColumn;
    canComplete?:                   boolean;
    "comments-count"?:              number;
    description?:                   string;
    "has-reminders"?:               boolean;
    "has-unread-comments"?:         boolean;
    private?:                       number;
    content?:                       string;
    order?:                         number;
    "project-id"?:                  number;
    "project-name"?:                string;
    "todo-list-id"?:                number;
    "todo-list-name"?:              string;
    "tasklist-private"?:            boolean;
    "tasklist-isTemplate"?:         boolean;
    status?:                        string;
    "company-name"?:                string;
    "company-id"?:                  number;
    "creator-id"?:                  number;
    "creator-firstname"?:           string;
    "creator-lastname"?:            string;
    "updater-id"?:                  number;
    "updater-firstname"?:           string;
    "updater-lastname"?:            string;
    completed?:                     boolean;
    "start-date"?:                  string;
    "due-date-base"?:               string;
    "due-date"?:                    string;
    "created-on"?:                  Date;
    "last-changed-on"?:             Date;
    position?:                      number;
    "estimated-minutes"?:           number;
    priority?:                      string;
    progress?:                      number;
    "harvest-enabled"?:             boolean;
    parentTaskId?:                  string;
    lockdownId?:                    string;
    "tasklist-lockdownId"?:         string;
    "has-dependencies"?:            number;
    "has-predecessors"?:            number;
    hasTickets?:                    boolean;
    timeIsLogged?:                  string;
    "attachments-count"?:           number;
    "responsible-party-ids"?:       string;
    "responsible-party-id"?:        string;
    "responsible-party-names"?:     string;
    "responsible-party-type"?:      string;
    "responsible-party-firstname"?: string;
    "responsible-party-lastname"?:  string;
    "responsible-party-summary"?:   string;
    predecessors?:                  any[];
    "parent-task"?:                 ParentTask;
    canEdit?:                       boolean;
    viewEstimatedTime?:             boolean;
    "creator-avatar-url"?:          string;
    canLogTime?:                    boolean;
    commentFollowerSummary?:        string;
    changeFollowerSummary?:         string;
    commentFollowerIds?:            string;
    changeFollowerIds?:             string;
    userFollowingComments?:         boolean;
    userFollowingChanges?:          boolean;
    DLM?:                           number;
}

export interface BoardColumn {
    id?:    number;
    name?:  string;
    color?: string;
}

export interface ParentTask {
    content?: string;
    id?:      string;
}
