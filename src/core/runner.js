'use strict';
import KeyValueStore from './keyvalue-store.js';
import loader from "@assemblyscript/loader";
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
        const service = await this.storage.getService(id);
        this.keyValueStore = new KeyValueStore(service.store);
        const res = this.runBasic(service.source, funcName, input, service.meta[funcName].returnType);

        this.storage.update(service.storeId, this.keyValueStore.export());
        return res;
    }

    async runBasic(source, funcName, input, returnType) {
        const importObject = {
            main: {
                kvstore_get: (key) => this.keyValueStore.get(key),
                kvstore_set: (key, value) => this.keyValueStore.set(key, value),
                // TODO: need support for returning string 
                // log_info: (msg) => { console.log(msg) }
            },
            env: {}
        }
        
        const mod = await loader.instantiate(new Uint8Array(source), importObject);

        const func = mod.instance.exports[funcName];
        const res = func.apply(this, args);

        return res;
    }

    // TODO: #3 simple mapper for now, more advance mapping technique like descriptor file is planned
    argsMapper(input, descriptor) {
        return input ? Object.values(input) : null;
    }
}