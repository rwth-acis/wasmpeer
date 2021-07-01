'use strict';
import fs from 'fs';
import fetch from 'node-fetch';
import Runner from './runner';
import Storage from './storage';

export default class Executor {
    constructor(instanceId) {
        this.instanceId = instanceId;
    }
    
    async run(id, funcName, input) {
        const storage = new Storage(this.instanceId);
        const { source, store } = storage.getService(id);
        return Executor.start(source, store, funcName, input);
    }

    static async runLocalFile(target, funcName, input) {
        const source = fs.readFileSync(target);
        return Executor.start(source, null, funcName, input);
    }
    
    static async runRemoteFile(target, funcName, input) {
        console.log('getting from url: ' + target);
        const response = await fetch(target);
        const source = await response.arrayBuffer();
        return Executor.start(source, null, funcName, input);
    }

    static start(source, store, funcName, input) {
        const runner = new Runner(source, store, funcName, input);
        return runner.run();
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