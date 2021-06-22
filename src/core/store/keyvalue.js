'use strict';
export default class KeyValueStore {
    constructor(target) {
        this.target = target;

        // TODO: persisting data will be implemented later
        this.db = {};
    }

    get(key) {
        return this.db[key];
    }

    set(key, value) {
        this.db[key] = value;
    }
}
