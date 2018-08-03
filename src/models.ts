type AppStatus = "ready" | "not-trained" | "empty"

export type RASATrainingData = {
    "rasa_nlu_data": {
        "common_examples": RASAExample[]
        "regex_features" : any[]
        "entity_synonyms": any[]
    }
}

export type RASAExample = {
    text: string;
    intent: string;
    entities?: any[];
}

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