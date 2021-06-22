'use strict';
import fs from 'fs';
import fetch from 'node-fetch';
import Runner from './runner';

export default class Executor {
    constructor() { }
    
    static async runLocalFile(target, funcName, input) {
        const source = fs.readFileSync(target);
        return this.run(source, funcName, input);
    }
    
    static async runRemoteFile(target, funcName, input) {
        console.log('getting from url: ' + target);
        const response = await fetch(target);
        const source = await response.arrayBuffer();
        return this.run(source, funcName, input);
    }

    static run(source, funcName, input) {
        const runner = new Runner(source, funcName, input);
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