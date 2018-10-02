import { expect } from 'chai';
import { describe, it, Done } from 'mocha'; 
import { withEntities, wordIndexOf } from '../src/utils';
import { Example, EntityInExample, TestExample, mergeTestExamples } from '../src/models';

describe("Files", () => {
    let ex0 = new TestExample({ text: "share screen on skype", intent: "skype", entities: [] })
    let ex1 = new TestExample({ text: "skype conversation with many", intent: "skype", entities: [] })
    let ex2 = new TestExample({ text: "order a car", intent: "car book", entities: [] })
    
    it("Should merge test examples without duplicates", (done: Done) => {
        expect(mergeTestExamples([ex0, ex1], [ex0, ex1, ex2])).to.have.lengthOf(3)
        done();
    })
})