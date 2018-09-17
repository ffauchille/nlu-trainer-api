import { Example } from "./models";

export function joinPath(...paths: string[]): string {
    return paths.reduce((path, chunck) => {
        if (path.length > 0) {
            return (path.endsWith("/") ? path : path + "/") + (chunck.startsWith("/") ? chunck.slice(1, chunck.length) : chunck)
        } else return chunck
    },"")
}

export function urlify(str: string) {
    return str.replace(" ", "%20")
}

/** first index of the whole word <w> in <str>; it's case sensitive */
export function wordIndexOf(w: string, txt: string, start?: number): number {
    let idx = -1;
    let startIdx = start || 0;
    let foundIdx = txt.indexOf(w, startIdx)
    let wordBreaker = /[+,;!?.' ]/
    if (foundIdx > -1) {
        let afterWordEndIdx = foundIdx + w.length
        let firstLetterAfterWord = txt[afterWordEndIdx]
        // check if next character is a word breaker
        if (afterWordEndIdx === txt.length || !!wordBreaker.exec(firstLetterAfterWord)) {
            idx = foundIdx;
        }
    }
    return idx;
}

function allIndexesOf(txt: string, substr: string): { start: number, end: number }[] {

    let idxs = [];
    if (txt.length > 0) {
        let index;
        let startIndex = 0
        let subStrLen= substr.length
        let lowerSubStr = substr.toLowerCase();
        let lowerTxt = txt.toLowerCase();

        while ((index = wordIndexOf(lowerSubStr, lowerTxt, startIndex)) > -1) {
                let end = index + subStrLen;
                idxs.push({ start: index, end });
                startIndex = end;
        }
    }
    return idxs
}

export function withEntities(entityValue: string, synonyms: string[], example: Example): Example {
    let newEntities = [entityValue, ...synonyms]
        .filter(v => allIndexesOf(example.text, v).length > 0)
        .map(ev => {
            return allIndexesOf(example.text, ev).reduce(((entities, idx) => entities.concat({
                ...idx,
                value: ev,
                entity: entityValue
            })), []);
        })
        .reduce((res, arr) => res.concat(arr), [])
    return {
        ...example,
        entities: (example.entities || []).concat(newEntities)
    }
}