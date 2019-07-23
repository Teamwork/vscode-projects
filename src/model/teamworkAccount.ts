

export class TeamworkAccount{

    public installationId: Number;
    public userId: Number;
    public userName: string;
    public userEmail: string;
    public token: string;
    public rootUrl: string;


    constructor(installationId: number, userId: number, userName: string, userEmail: string, token: string, root: string) {
        this.userId = userId;
        this.installationId = installationId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.token = token;
        this.rootUrl = root;
    }


}