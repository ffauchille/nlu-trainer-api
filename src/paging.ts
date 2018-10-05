import { Collection } from "./mongo";

export const DEFAULT_PAGE_SIZE = 20;

export class Page {
    offset: number;
    size: number;

    constructor(props: Partial<Page>) {
        this.offset = props.offset || 1
        this.size = props.size || DEFAULT_PAGE_SIZE
    }
}

export const selectPage$ = (col: string, page: Page, selector: object = {}) => {
    let collection = new Collection(col);
    return collection.run(c => c.find(selector).skip((page.offset - 1) * page.size).limit(page.size).toArray())
}
