async;
getTaskLists(context, vscode.ExtensionContext, id, number);
Promise < INode[] > {
    var: axios = require("axios"),
    var: config = vscode.workspace.getConfiguration('twp'),
    var: token = config.get("APIKey"),
    var: root = config.get("APIRoot"),
    if(, token) { }
} || !root;
{
    vscode.window.showErrorMessage("Please Configure the extension first!");
    return;
}
var encodedToken = new Buffer(token + ":xxx").toString("base64");
let nodeList = [];
const url = root + '/projects/' + this.id + '/todo_lists.json?getNewTaskDefaults=true&nestSubTasks=true';
let json = yield axios({
    method: 'get',
    url,
    auth: {
        username: token,
        password: 'xxxxxxxxxxxxx'
    }
})
    .catch(function (error) {
    console.log(error);
});
json.data["todo-lists"].forEach(element => {
    nodeList.push(new TaskListNode(element.name, element.id));
});
return nodeList;
//# sourceMappingURL=twpapi.js.map