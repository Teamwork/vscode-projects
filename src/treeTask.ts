import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TreeTask extends vscode.TreeItem {

    type: string;
    id: string;
    
    constructor(
        type: string, 
        label: string, 
        collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.type = type;
        this.command = command;
    }
     

	get tooltip(): string {
		return `${this.label}-${this.label}`;
	}

	get description(): string {
		return `${this.label}-${this.label}`;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dep.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dep.svg')
	};

	contextValue = 'todoItem';

}