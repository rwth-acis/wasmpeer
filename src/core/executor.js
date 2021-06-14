'use strict';
import { WASI } from '@wasmer/wasi';
import { WasmFs } from '@wasmer/wasmfs';
import wasiBindings from '@wasmer/wasi/lib/bindings/node';
import fs from 'fs';
import fetch from 'node-fetch';

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

const run = async (bytesInput) => {
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
const cleanStdout = (stdout) => {
    const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");

    const regexPattern = new RegExp(pattern, "g");
    return stdout.replace(regexPattern, "");
};
//#endregion

//#region interface
const runLocalFile = (target) => {
    const inp = fs.readFileSync(target);
    return run(inp);
}

const runRemoteFile = async (url) => {
    console.log('getting from url: ' + url);
    const response = await fetch(url);
    const responseArrayBuffer = await response.arrayBuffer();
    return run(responseArrayBuffer);
}

module.exports = {
    runLocalFile,
    runRemoteFile
}
//#endregion
