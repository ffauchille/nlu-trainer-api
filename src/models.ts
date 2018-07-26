type AppStatus = "ready" | "not-trained" | "empty"

export class AppModel {
    _id: string;
    name: string;
    status: AppStatus;

    constructor(props: Partial<AppModel>) {
        this._id = props._id || ""
        this.name = props.name || ""
        this.status = props.status || "not-trained"
    }
}