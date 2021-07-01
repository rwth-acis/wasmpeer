'use strict';
export default class KeyValueStore {
    constructor(target) {
        this.db = target
    }

    get(key) {
        return this.db[key];
    }

    export() {
        return this.db;
    }

    set(key, value) {
        this.db[key] = value;
    }
}
