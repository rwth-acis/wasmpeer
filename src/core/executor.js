'use strict';
import fetch from 'node-fetch';
import Runner from './runner';

export default class Executor {
    constructor(storage) {
        this.storage = storage;
    }

    run(id, funcName, input) {
        const runner = new Runner(this.storage);
        return runner.run(id, funcName, input);
    }

    static runLocalFile(source, funcName, input) {
        const runner = new Runner(null);
        return runner.runBasic(source, funcName, input);
    }
}

//#region helper
const delay = () => {
    const wait = (1 + Math.floor(Math.random()*10))*1000;
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), wait)
    });
}
//#endregion