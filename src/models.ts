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


type AppModelMeta = {
    [key: string]: any
}

type RASAModelMeta = AppModelMeta & {
    pipeline: string[]
}


export class AppModel {
    _id: string;
    name: string;
    type: 'RASA';
    meta: AppModelMeta

    constructor(props: Partial<AppModel>) {
        this._id = props._id || ""
        this.name = props.name || ""
        this.type = props.type || 'RASA'
    }
}

export class Entity {
    start: number;
    end: number;
    value: string;
    entity: string;

    constructor(props: Partial<Entity>) {
        this.start = props.start || 0
        this.end = props.end || 0
        this.value = props.value || ""
        this.entity = props.entity || ""
    }
}

export class Example {
    _id: string;
    text: string;
    intentName: string;
    intentId: string;
    entities: Entity[];

    constructor(props: Partial<Example>) {
        this._id = props._id || ""
        this.text = props.text || ""
        this.intentName = props.intentName || ""
        this.intentId = props.intentId || ""
        this.entities  = (props.entities || []).map(e => new Entity(e))
    }
}