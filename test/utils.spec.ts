import { expect } from 'chai';
import { describe, it, Done } from 'mocha'; 
import { withEntities, wordIndexOf } from '../src/utils';
import { Example, EntityInExample } from '../src/models';

describe("Utils", () => {
    let colors = [ "yellow", "green", "blue" ]
    let entity = "red"
    let ex0 = new Example({ text: "I like icecreams"})
    let ex1 = new Example({ text: "I like red icecreams and yellow"})
    let ex2 = new Example({ text: "I like yellow icecreams and green ones!!!"})
    let ex3 = new Example({ text: "I like yellow icecreams and yellow phones, go figure... !!!"})
    let ex4 = new Example({ text: "I like yellowsubmarines all attached"})
    
    it("Shouldn't append any entities if no match found", (done: Done) => {
        expect(withEntities(entity, colors, ex0).entities).to.have.lengthOf(0)
        done();
    })

    it("Should append entities from both entity value and synonyms", (done: Done) => {
        expect(withEntities(entity, colors, ex1 ).entities).to.deep.equal([
            new EntityInExample({ start: 7, end: 10, value: "red", entity }),
            new EntityInExample({ start: 25, end: 31, value: "yellow", entity })
        ])
        done();
    })

    it("Should correctly append entites to examples", (done: Done) => {
        expect(withEntities(entity, colors, ex2 ).entities).to.deep.equal([
            new EntityInExample({ start: 7, end: 13, value: "yellow", entity }),
            new EntityInExample({ start: 28, end: 33, value: "green", entity })
        ])
        done();
    })

    it("Should correctly get multiple entities of same name", (done: Done) => {
        expect(withEntities(entity, colors, ex3).entities).to.deep.equal([
            new EntityInExample({ start: 7, end: 13, value: "yellow", entity }),
            new EntityInExample({ start: 28, end: 34, value: "yellow", entity })
        ])
        done();
    })

    it("Should NOT extract a subword of a word where an entity is. (ex. yellowsubmarine should not extract 'yellow' entity from it", (done: Done) => {
        expect(withEntities(entity, colors, ex4).entities).to.have.lengthOf(0)
        done();
    })

    it("Should correcty find the index of a whole word", (done: Done) => {
        expect(wordIndexOf("li", ex0.text)).to.equal(-1, "'li' should not match in 'I like icecreams' since it's part of a word")
        expect(wordIndexOf("like", ex0.text)).to.equal(2, "'like' should match in 'I like icecreams' since it's a whole word")
        expect(wordIndexOf("icecreams", ex0.text)).to.equal(7, "'icecreams' should match in 'I like icecreams' since it's a whole word")
        expect(wordIndexOf("i", ex0.text)).to.equal(-1, "'i' should match in 'I like icecreams' since it's a whole word and function must be case sensitive")
        expect(wordIndexOf("I", ex0.text)).to.equal(0, "'I' should match in 'I like icecreams' since it's a whole word and function must be case sensitive")
        done();
    })
})