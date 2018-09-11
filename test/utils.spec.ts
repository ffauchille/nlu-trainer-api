import { expect } from 'chai';
import { describe, it, Done } from 'mocha'; 
import { withEntities } from '../src/utils';
import { Example, Entity } from '../src/models';

describe("Utils", () => {
    let colors = [ "yellow", "green", "blue" ]
    let entity = "red"
    let ex0 = new Example({ text: "I like icecreams"})
    let ex1 = new Example({ text: "I like red icecreams and yellow"})
    let ex2 = new Example({ text: "I like yellow icecreams and green ones!!!", entities: [] })
    let ex3 = new Example({ text: "I like yellow icecreams and yellow phones, go figure... !!!", entities: [] })
    
    it("Shouldn't append any entities if no match found", (done: Done) => {
        expect(withEntities(entity, colors, ex0).entities).to.have.lengthOf(0)
        done();
    })

    it("Should append entities from both entity value and synonyms", (done: Done) => {
        expect(withEntities(entity, colors, ex1 ).entities).to.deep.equal([
            new Entity({ start: 7, end: 10, value: "red", entity }),
            new Entity({ start: 25, end: 31, value: "yellow", entity })
        ])
        done();
    })

    it("Should correctly append entites to examples", (done: Done) => {
        expect(withEntities(entity, colors, ex2 ).entities).to.deep.equal([
            new Entity({ start: 7, end: 13, value: "yellow", entity }),
            new Entity({ start: 28, end: 33, value: "green", entity })
        ])
        done();
    })

    it("Should correctly get multiple entities of same name", (done: Done) => {
        expect(withEntities(entity, colors, ex3).entities).to.deep.equal([
            new Entity({ start: 7, end: 13, value: "yellow", entity }),
            new Entity({ start: 28, end: 34, value: "yellow", entity })
        ])
        done();
    })
})