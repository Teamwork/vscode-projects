import { ProjectNode } from "./nodes/ProjectNode";
import { TaskItemNode } from "./nodes/TaskItemNode";
import { TaskListNode } from "./nodes/TaskListNode";

export class ProjectCache{
    public RootNode: ProjectNode;
    public TaskListNodes : TaskListNode[];
    public TaskItemNodes: TaskItemNode[]
}