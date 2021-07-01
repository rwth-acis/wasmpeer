'use strict';
export default class KeyValueStore {
    constructor(target) {
        this.db = target
    }

    get(key) {
        return this.db[key];
    }

    set(key, value) {
        this.db[key] = value;
    }
}
