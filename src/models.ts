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

export class EntityDefinition {
    _id: string;
    value: string;
    synonyms: string[];
    appId: string;

    constructor(props: Partial<EntityDefinition>) {
        this._id = props._id || ""
        this.value = props.value || ""
        this.synonyms = props.synonyms || []
        this.appId = props.appId || ""
    }
}

export class EntityInExample {
    start: number;
    end: number;
    value: string;
    entity: string;

    constructor(props: Partial<EntityInExample>) {
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
    entities: EntityInExample[];

    constructor(props: Partial<Example>) {
        this._id = props._id || ""
        this.text = props.text || ""
        this.intentName = props.intentName || ""
        this.intentId = props.intentId || ""
        this.entities  = (props.entities || []).map(e => new EntityInExample(e))
    }
}


export class ModelEvaluation {
    intent_evaluation: IntentEvaluation;
  
    constructor(props: Partial<ModelEvaluation>) {
      this.intent_evaluation = new IntentEvaluation(
        props.intent_evaluation || {}
      );
    }
  }
  
  class IntentEvaluation {
    report: string;
    predictions: Prediction[];
    precision: number;
    f1_score: number;
    accuracy: number;
  
    constructor(props: Partial<IntentEvaluation>) {
      this.report = props.report || "";
      this.predictions = (props.predictions || []).map(
        prediction => new Prediction(prediction)
      );
      this.precision = props.precision || 0;
      this.f1_score = props.f1_score || 0;
      this.accuracy = props.accuracy || 0;
    }
  }
  
  class Prediction {
    text: string;
    intent: string;
    predicted: string;
    confidence: number;
  
    constructor(props: Partial<Prediction>) {
      this.text = props.text || "";
      this.intent = props.intent || "";
      this.predicted = props.predicted || "";
      this.confidence = props.confidence || -1;
    }
  }