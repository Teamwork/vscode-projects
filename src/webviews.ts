import * as path from 'path';
import * as vscode from 'vscode';
import {Template} from './adaptiveCards/templateEngine';
import {EvaluationContext} from './adaptiveCards/expressionParser';
import { TeamworkProjectsApi } from './teamworkProjectsApi';


export class WebViews{
    private readonly _extensionPath: string;    
    public readonly _context: vscode.ExtensionContext;
    public API: TeamworkProjectsApi;

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this._extensionPath = extensionPath;
        this.API = new TeamworkProjectsApi();
    }

    public GetWebViewContentLoader(){
           
        // jquery
        const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
        const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });

        const nonce = this.getNonce();

        const ACstyle = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'loader.css'));
        const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });

        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cat Coding</title>
                    <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                    <script nonce="${nonce}" src="${jqueryUri}"></script>
                    <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                </head>
                <body style='background:#2D2B2C;height:800px;width:400px;'>
                        <div id="app-loader" class="app-loader" >
                        <svg class="app-loader__-logo" xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 160 128">
                            <defs>
                                <style>
                                    .cls-1 {
                                        fill: #ffffff;
                                    }
                    
                                    .cls-2 {
                                        fill: #ffffff;
                                    }
                                </style>
                            </defs>
                            <circle class="cls-1" cx="118" cy="86" r="12"></circle>
                            <path class="cls-2" d="M160,48a32,32,0,0,0-32-32H63.59A20.07,20.07,0,0,0,44,0H20A20.06,20.06,0,0,0,0,20V96a32,32,0,0,0,32,32h96a32,32,0,0,0,32-32Zm-32,64H32A16,16,0,0,1,16,96V32H128a16,16,0,0,1,16,16V96A16,16,0,0,1,128,112Z"></path>
                        </svg>
                        <p class="w-app-preloading__installation-name" style='color:#ffffff'>
                            please wait...
                        </p>
                        <div class="app-loader__loading-bar"></div>
                    </div>
                </body>
                </html>`;


    }

    public GetWebViewLogin(){
           
        // jquery
        const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
        const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });

        const scriptPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'mainTeamwork.js'));
        const scriptUri = scriptPath.with({ scheme: 'vscode-resource' });

        const nonce = this.getNonce();

        const ACstyle = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'loader.css'));
        const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });

        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cat Coding</title>
                    <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                    <script nonce="${nonce}" src="${jqueryUri}"></script>
                    <script nonce="${nonce}" src="${scriptUri}"></script>
                    <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                </head>
                <body style='background:#2D2B2C;height:800px;width:400px;'>
                    
                </body>
                </html>`;


    }

    public async GetWebViewContentAdaptiveCard(taskItem: number, force: boolean = false)  {
        var todo = await this.API.getTodoItem(this._context, taskItem,force);
        if(todo){
            const templateFile = require(path.join(this._extensionPath, 'media/cards', 'taskCard.json'));
            var  _templatePayload: object = templateFile;


             let template = new Template( _templatePayload);
             let context = new EvaluationContext();
             context.$root = todo;
             let expandedTemplatePayload = template.expand(context);

            // Local path to main script run in the webview
            const scriptPathOnDisk = vscode.Uri.file(
                path.join(this._extensionPath, 'media/js', 'mainAdaptive.js')
            );
            // And the uri we use to load this script in the webview
            const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
            
            // jquery
            const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
            const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });


            // AdaptiveCards
            let url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'fabric.min.js'));
            const FabricUri = url.with({ scheme: 'vscode-resource' });

             url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'adaptivecards.min.js'));
            const ACUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'adaptivecards-fabric.min.js'));
            const ACUFabricUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'react.min.js'));
            const ReactUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'react-dom.min.js'));
            const ReactDomUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'markdown-it.min.js'));
            const MarkdownUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'msteamsstyle.css'));
            const mainstyleUri = url.with({ scheme: 'vscode-resource' });

            url = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'fabric.components.min.css'));
            const FabricStyleUri = url.with({ scheme: 'vscode-resource' });

            const ACstyle = vscode.Uri.file(	path.join(this._extensionPath, 'media/css', 'editormain.css'));
            const ACStyleUri = ACstyle.with({ scheme: 'vscode-resource' });

            
            const nonce = this.getNonce();

            return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">

                        <link rel="stylesheet" href="${mainstyleUri}"  nonce="${nonce}"  type="text/css" />
                        <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                        <link rel="stylesheet" href="${FabricStyleUri}"  nonce="${nonce}"  type="text/css" />
                    </head>
                    <body>
                        <div id="exampleDiv"></div>
                        <div id="out"></div>
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${ReactUri}"></script>
                        <script nonce="${nonce}" src="${ReactDomUri}"></script>
  
                        <script nonce="${nonce}" src="${FabricUri}"></script>
                        <script nonce="${nonce}" src="${ACUri}"></script>
                        <script nonce="${nonce}" src="${ACUFabricUri}"></script>
                        

                        <script nonce="${nonce}" src="${MarkdownUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <div id="divData" style='display:none;'>
                            ${JSON.stringify(expandedTemplatePayload)}
                        </div>
                    </body>
                    </html>`;
        }
    }

    public async GetWebViewContentTeamwork(taskItem: number, force: boolean = false)  {
        var config = vscode.workspace.getConfiguration('twp');
        var root = config.get("APIRoot");

        var auth = "Basic " + Buffer.from(config.get("APIKey") + ":xxxxxx").toString("base64");

        var todo = await this.API.getTodoItem(this._context, taskItem);

        if(todo){
            const nonce = this.getNonce();

            const scriptPathOnDisk = vscode.Uri.file(
                path.join(this._extensionPath, 'media/js', 'mainTeamwork.js')
            );
            // And the uri we use to load this script in the webview
            const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
            
            // jquery
            const jqueryPath = vscode.Uri.file(	path.join(this._extensionPath, 'media/js', 'jquery.min.js'));
            const jqueryUri = jqueryPath.with({ scheme: 'vscode-resource' });
    
    
            return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Cat Coding</title>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                        <script nonce="${nonce}" src="${jqueryUri}"></script>
                        <script nonce="${nonce}" src="${scriptUri}"></script>
                        <script type="text/javascript" nonce="${nonce}">
                            $(document).ready(function () {
        
                                $.ajax({
                                    url: '${root}' + 'me.json',
                                    headers: {
                                        'Authorization': '${auth}',
                                    },
                                    dataType: 'json',
                                    method: 'GET',
                                    crossDomain: true,
                                    success: function(data) {

                                    },
                                    error: function() {
                                        var frameUrl = '${root}' + '?embeddedView=1#embed?view=viewTask&params=' + encodeURIComponent(JSON.stringify({ taskId: parseInt("${taskItem}") }))
                                        $('#frmTasks').attr('src', frameUrl);
                                    },
                                    xhrFields: {
                                        withCredentials: true
                                    }
                                });
                            });
    
                        </script>
                    </head>
                    <body>
                        <iframe id="frmTasks" allowtransparency="true" frameborder="0" style="display:none;overflow:hidden;height:97%;width:100%" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-scripts allow-same-origin"></iframe>
                    </body>
                    </html>`;
        }


    }

    private getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }


}