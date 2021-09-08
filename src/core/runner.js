'use strict';
import KeyValueStore from './store/keyvalue';
export default class Runner {
    constructor(storage, connector) {
        this.storage = storage;
        this.connector = connector;
        this.keyValueStore = {
            get: () => { },
            set: () => { }
        };
    }

    async run(id, funcName, input) {
        const { source, store, storeId } = await this.storage.getService(id);

        this.keyValueStore = new KeyValueStore(store);
        const res = this.runBasic(source, funcName, input);

        this.storage.update(storeId, this.keyValueStore.export());
        return res;
    }

    async runBasic(source, funcName, input) {
        const importObject = {
            main: {
                kvstore_get: (key) => this.keyValueStore.get(key),
                kvstore_set: (key, value) => this.keyValueStore.set(key, value),
                // TODO: need support for returning string 
                // log_info: (msg) => { console.log(msg) }
            },
            env: {}
        }
        const mod = await WebAssembly.instantiate(new Uint8Array(source), importObject);

        const args = this.argsMapper(input);
        const func = mod.instance.exports[funcName];
        const res = func.apply(this, args);

        return res;
    }

    // TODO: #3 simple mapper for now, more advance mapping technique like descriptor file is planned
    argsMapper(input, descriptor) {
        return input ? Object.values(input) : null;
    }
}