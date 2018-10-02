type AppStatus = "ready" | "not-trained" | "empty";

export type RASATrainingData = {
  rasa_nlu_data: {
    common_examples: RASAExample[];
    regex_features: any[];
    entity_synonyms: any[];
  };
};

export type RASAExample = {
  text: string;
  intent: string;
  entities?: any[];
};

type AppModelMeta = {
  [key: string]: any;
};

type RASAModelMeta = AppModelMeta & {
  pipeline: string[];
};

export class AppModel {
  _id: string;
  name: string;
  type: "RASA";
  meta: AppModelMeta;

  constructor(props: Partial<AppModel>) {
    this._id = props._id || "";
    this.name = props.name || "";
    this.type = props.type || "RASA";
  }
}

export class EntityDefinition {
  _id: string;
  value: string;
  synonyms: string[];
  appId: string;

  constructor(props: Partial<EntityDefinition>) {
    this._id = props._id || "";
    this.value = props.value || "";
    this.synonyms = props.synonyms || [];
    this.appId = props.appId || "";
  }
}

export class EntityInExample {
  start: number;
  end: number;
  value: string;
  entity: string;

  constructor(props: Partial<EntityInExample>) {
    this.start = props.start || 0;
    this.end = props.end || 0;
    this.value = props.value || "";
    this.entity = props.entity || "";
  }
}

export class Example {
  _id: string;
  text: string;
  intentName: string;
  intentId: string;
  entities: EntityInExample[];

  constructor(props: Partial<Example>) {
    this._id = props._id || "";
    this.text = props.text || "";
    this.intentName = props.intentName || "";
    this.intentId = props.intentId || "";
    this.entities = (props.entities || []).map(e => new EntityInExample(e));
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

export class TestExample {
  text: string;
  intent: string;
  entities: string[];

  constructor(props: Partial<TestExample>) {
    this.text = props.text || "";
    this.intent = props.intent || "";
    this.entities = props.entities || [];
  }
}

/**
 * Merge test examples removing duplicates
 * NOTE: two test examples are considered duplicate if both text and intent match only (it does not look at entities)
 * @param original base test examples 
 * @param supplements test examples to be merged with originals
 * @returns a copy of original test examples with supplements that does not exists in originals;
 *          supplements are inserted before originals (e.g. [ ...supplements, ...originals ])
 */
export const mergeTestExamples = (original: TestExample[], supplements: TestExample[]): TestExample[] => {
  // not at all efficient, but since we have not many data, it should be fine
  let nonDuplicates = supplements.filter(e => !original.find(o => o.text === e.text && o.intent === e.intent))
  return nonDuplicates.concat(original);
}

export class TestSuite {
  _id: string;
  name: string;
  appId: string;
  lastRunAt: number;
  testExamples: TestExample[];

  constructor(props: Partial<TestSuite>) {
    this._id = props._id || "";
    this.name = props.name || "";
    this.appId = props.appId || "";
    this.lastRunAt = props.lastRunAt || 0;
    this.testExamples = (props.testExamples || []).map(
      line => new TestExample(line)
    );
  }
}
