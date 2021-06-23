'use strict';
const assert = require('assert');
const { default: Executor } = require('../src/core/executor');
const { default: Storage } = require('../src/core/storage');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

describe('CORE', () => {
    describe('Executor', () => {
        describe('#runLocalFile', () => {
            it('Fibo function should return 120 when the value is 5', async () => {
                const res = await Executor.runLocalFile('./etc/fibo.wasm', 'main', { i: 5 });
                assert.strictEqual(res, 120);
            });
        });
    });

    describe('Storage', () => {
        const storage = new Storage(uuidv4());
        const path = './etc/fibo.wasm';
        const objFibo = fs.readFileSync(path);
        let id = '';
        describe('#create', () => {
            it('Function will create a new entry to the catalog and save the file', async () => {
                const filename = path.replace(/^.*[\\\/]/, '')
                id = storage.create(filename, objFibo);
                assert.ok(id);
            });
        });
        describe('#read', () => {
            it('Function will read the new entry from the catalog and the file should be the same', async () => {
                const obj = storage.read(id);
                assert.deepStrictEqual(obj, objFibo);
            });
        });
        describe('#update', () => {
            it('Function will update the entry from the catalog and the file should be the updated', async () => {
                const objHello = fs.readFileSync('./etc/helloworld.wasm');
                storage.update(id, objHello);

                const obj = storage.read(id);
                assert.deepStrictEqual(obj, objHello);
                assert.notDeepStrictEqual(obj, objFibo);
            });
        });
    });
});