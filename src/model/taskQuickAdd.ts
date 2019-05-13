export class TaskQuickAdd {
    content?:      string;
    tasklistId?:   number;
    "creator-id"?: number;
    notify?:       boolean;
    private?:      boolean;
    "todo-item"?:  TodoItemQuick;
}

export class TodoItemQuick {
    "responsible-party-id"?: string;
    "start-date"?:           string;
    "due-date"?:             string;
    priority?:               string;
    description?:            string;
}
