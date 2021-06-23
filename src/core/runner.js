'use strict';
import { WASI } from '@wasmer/wasi';
import { WasmFs } from '@wasmer/wasmfs';
import wasiBindings from '@wasmer/wasi/lib/bindings/node';
import KeyValueStore from './store/keyvalue';

const wasmFs = new WasmFs();
const wasi = new WASI({
    args: [],
    env: {},
    bindings: {
        ...wasiBindings,
        fs: wasmFs.fs
    }
});

export default class Runner {
    constructor(source, funcName, input) {
        this.source = source;
        this.funcName = funcName;
        this.args = this.argsMapper(input);
        
    }

    async run() {
        const store = new KeyValueStore();
        const importObject = {
            main: {
                kvstore_get: (key) => store.get(key),
                kvstore_set: (key, value) => store.set(key, value),
                // TODO: need support for returning string 
                // log_info: (msg) => { console.log(msg) }
            },
            env: { }
        }
        const mod = await WebAssembly.instantiate(new Uint8Array(this.source), importObject);
    
        const func = mod.instance.exports[this.funcName];
        return func.apply(this, this.args);
    }

    // TODO: #3 simple mapper for now, more advance mapping technique like descriptor file is planned
    argsMapper(input, descriptor) {
        return input ? Object.values(input) : null;
    }

    //#region wasi example
    async runWasi(bytesInput) {
        const { buffer } = new Uint8Array(bytesInput);
        const module = await WebAssembly.compile(buffer);
        const instance = await WebAssembly.instantiate(module, {
            ...wasi.getImports(module)
        });
    
        wasi.start(instance);
    
        const stdout = await wasmFs.getStdOut();
        return cleanStdout(stdout);
    };

    cleanStdout(stdout) {
        const pattern = [
            "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
            "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
        ].join("|");
    
        const regexPattern = new RegExp(pattern, "g");
        return stdout.replace(regexPattern, "");
    };
    //#endregion
}