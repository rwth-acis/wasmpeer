'use strict';
export default class KeyValueStore {
    constructor(target) {
        this.db = target
    }

    get(key) {
        return this.db[key];
    }

    export() {
        return JSON.stringify(this.db, null, 2);
    }

    set(key, value) {
        this.db[key] = value;
    }
}
