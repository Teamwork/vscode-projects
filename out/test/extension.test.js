try {
    var request = require('request');
    var config = vscode.workspace.getConfiguration('twp');
    var token = config.get("APIKey");
    var root = config.get("APIRoot");
    if (!token || !root) {
        vscode.window.showErrorMessage("Please Configure the extension first!");
        return;
    }
    var encodedToken = new Buffer(token + ":xxx").toString("base64");
    var project;
    var tasklists;
    // Hardcoded for one project for now
    request(root + '/projects/401378.json', {
        method: "GET",
        headers: {
            "Authorization": "BASIC " + encodedToken,
            "Content-Type": "application/json"
        }
    }, (err, res, body) => {
        if (err) {
            vscode.window.showErrorMessage(err);
        }
        var response = Convert.toProjectResponse(body);
        this.renderTree(response);
    });
}
catch (error) {
    vscode.window.showErrorMessage(error);
}
//# sourceMappingURL=extension.test.js.map