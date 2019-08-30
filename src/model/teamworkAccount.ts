

export class TeamworkAccount{

    public installationId: Number;
    public userId: Number;
    public userName: string;
    public userEmail: string;
    public token: string;
    public rootUrl: string;
    public useApiKey: boolean;


    constructor(installationId: number, userId: number, userName: string, userEmail: string, token: string, root: string, useApiKey: boolean = false) {
        this.userId = userId;
        this.installationId = installationId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.token = token;
        this.rootUrl = root;
        this.useApiKey = useApiKey;
    }


}