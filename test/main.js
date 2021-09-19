'use strict';
import assert from 'assert';
import Executor from '../src/core/executor.js';
import Storage from '../src/core/storage.js';
import Accessor from '../src/node/accessor.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

describe('CORE', () => {
    describe('Executor', () => {
        describe('#runLocalFile', () => {
            it('Fibo function should return 120 when the value is 5', async () => {
                const objFibo = fs.readFileSync('./static/wasm/fibo.wasm');
                const res = await Executor.runLocalFile(objFibo, 'main', { i: 5 });
                assert.strictEqual(res, 120);
            });
        });
    });

    describe('Storage', () => {
        const instanceId = uuidv4();
        const accessor = new Accessor(instanceId);
        const storage = new Storage(accessor);
        const path1 = './static/wasm/fibo.wasm';
        const path2 = './static/wasm/helloworld.wasm';
        const objFibo = fs.readFileSync(path1);
        let id = '';
        describe('#create', () => {
            it('Function will create a new entry to the catalog and save the file', async () => {
                const filename = path1.replace(/^.*[\\\/]/, '')
                id = await storage.storeService(filename, objFibo);
                assert.ok(id);
            });
        });
        describe('#read', () => {
            it('Function will read the new entry from the catalog and the file should be the same', async () => {
                const { source } = await storage.getService(id);
                assert.deepStrictEqual(source, objFibo);
            });
        });
        describe('#update', () => {
            it('Function will update the entry from the catalog and the file should be the updated', async () => {
                const objHello = fs.readFileSync(path2);
                storage.updateService(id, objHello);

                const { source } = await storage.getService(id);
                assert.deepStrictEqual(source, objHello);
                assert.notDeepStrictEqual(source, objFibo);
            });
        });
    });
});

describe('SERVER', () => {
    let id = '';
    const instanceId = uuidv4();
    const accessor = new Accessor(instanceId);
    const storage = new Storage(accessor);
    describe('Execute a fibo function from storage', async () => {
        it('Storage will store the source of the wasm file and will return the id of the file in the storage', async () => {
            
            const path1 = './static/wasm/fibo.wasm';
            const objFibo = fs.readFileSync(path1);

            const filename = path1.replace(/^.*[\\\/]/, '')
            id = await storage.storeService(filename, objFibo);
            assert.ok(id);
        });
        it('Executor will execute the fibo function with input 5, and gives return value of 120', async () => {
            const executor = new Executor(storage);
            const res = await executor.run(id, 'main', { i: 5 });
            assert.strictEqual(res, 120);
        });
    });
});