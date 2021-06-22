'use strict';
import { WASI } from '@wasmer/wasi';
import { WasmFs } from '@wasmer/wasmfs';
import wasiBindings from '@wasmer/wasi/lib/bindings/node';
import fs from 'fs';
import fetch from 'node-fetch';
import KeyValueStore from './store/keyvalue';

//#region core
const wasmFs = new WasmFs();
const wasi = new WASI({
    args: [],
    env: {},
    bindings: {
        ...wasiBindings,
        fs: wasmFs.fs
    }
});

const run = async (bytesInput, funcName, input) => {
    const store = new KeyValueStore();
    const importObject = {
        main: {
            kvstore_get: store.get,
            kvstore_set: store.set
        },
        env: { }
    }
    const mod = await WebAssembly.instantiate(new Uint8Array(bytesInput), importObject);

    const func = mod.instance.exports[funcName];
    const args = argsMapper(input, null);
    return func.apply(this, args);
}

const runWasi = async (bytesInput) => {
    const { buffer } = new Uint8Array(bytesInput);
    const module = await WebAssembly.compile(buffer);
    const instance = await WebAssembly.instantiate(module, {
        ...wasi.getImports(module)
    });

    wasi.start(instance);

    const stdout = await wasmFs.getStdOut();
    return cleanStdout(stdout);
};
//#endregion

//#region helper

// TODO: #3 simple mapper for now, more advance mapping technique like descriptor file is planned
const argsMapper = (input, descriptor) => {
    return input ? Object.values(input) : null;
}

const cleanStdout = (stdout) => {
    const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");

    const regexPattern = new RegExp(pattern, "g");
    return stdout.replace(regexPattern, "");
};

const delay = () => {
    const wait = (1 + Math.floor(Math.random()*10))*1000;
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), wait)
    });
}
//#endregion

//#region interface
const runLocalFile = async (target, funcName, input) => {
    const source = fs.readFileSync(target);
    const res = await run(source, funcName, input);
    return res;
}

const runRemoteFile = async (target, funcName, input) => {
    console.log('getting from url: ' + target);
    const response = await fetch(target);
    const source = await response.arrayBuffer();
    return run(source, funcName, input);
}

module.exports = {
    runLocalFile,
    runRemoteFile
}
//#endregion
