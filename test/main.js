'use strict';
import assert from 'assert';
import Executor from '../src/core/executor.js';
import Storage from '../src/core/storage.js';
import Accessor from '../src/node/accessor.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Compiler from '../src/utils/compiler.js';

describe('COMPONENTS', () => { 
    describe('Storage', () => {
        const instanceId = uuidv4();
        const accessor = new Accessor(instanceId);
        const storage = new Storage(accessor);
        const path1 = './static/wasm/main.wasm';
        const path2 = './static/wasm/helloworld.wasm';
        const objMain = fs.readFileSync(path1);
        let id = '';
        describe('#create', () => {
            it('Function will create a new entry to the catalog and save the file', async () => {
                const filename = path1.replace(/^.*[\\\/]/, '')
                id = await storage.storeService(filename, objMain);
                assert.ok(id);
            });
        });
        describe('#read', () => {
            it('Function will read the new entry from the catalog and the file should be the same', async () => {
                const { source } = await storage.getService(id);
                assert.deepStrictEqual(source, objMain);
            });
        });
        describe('#update', () => {
            it('Function will update the entry from the catalog and the file should be the updated', async () => {
                const objHello = fs.readFileSync(path2);
                storage.updateService(id, objHello);

                const { source } = await storage.getService(id);
                assert.deepStrictEqual(source, objHello);
                assert.notDeepStrictEqual(source, objMain);
            });
        });
    });
});

describe('SERVICES', () => {
    let id = '';
    const instanceId = uuidv4();
    const accessor = new Accessor(instanceId);
    const storage = new Storage(accessor);

    describe('Calculator service', async () => {
        let service = null;
        const path1 = './static/as/calculator.ts';
        it('Compile the assembly script', async () => {
            const mainRaw = fs.readFileSync(path1);
            service = await Compiler.AS(mainRaw.toString());
            assert.ok(service);
        });

        it('Compiled module has generated correct descriptor', async () => {
            assert.deepEqual(service.meta, {
                add: { name: 'add', paramsType: { x: 'i32', y: 'i32'}, returnType: 'i32' },
                subtract: { name: 'subtract', paramsType: { x: 'i32', y: 'i32'}, returnType: 'i32' },
                multiple: { name: 'multiple', paramsType: { x: 'i32', y: 'i32'}, returnType: 'i32' },
                divide: { name: 'divide', paramsType: { x: 'i32', y: 'i32'}, returnType: 'i32' },
                fib: { name: 'fib', paramsType: { n: 'i32' }, returnType: 'i32' }
            });
        });

        it('Store the service to storage', async () => {
            const filename = path1.replace(/^.*[\\\/]/, '')
            id = await storage.storeService(filename, service.source, service.raw, service.meta);
            assert.ok(id);
        });

        describe('Execute the service', () => {
            const executor = new Executor(storage);

            it('Add 5 and 6 returns 11', async () => {
                const res = await executor.run(id, 'add', { x: 5, y: 6 });
                assert.strictEqual(res, 11);
            });
    
            it('Subtract 5 and 6 returns -1', async () => {
                const res = await executor.run(id, 'subtract', { x: 5, y: 6 });
                assert.strictEqual(res, -1);
            });
    
            it('Multiple 5 and 6 returns 30', async () => {
                const res = await executor.run(id, 'multiple', { x: 5, y: 6 });
                assert.strictEqual(res, 30);
            });
    
            it('Divide 30 and 6 returns 5', async () => {
                const res = await executor.run(id, 'divide', { x: 30, y: 6 });
                assert.strictEqual(res, 5);
            });
    
            it('Fibonacci of 5 returns 8', async () => {
                const res = await executor.run(id, 'fib', { x: 5 });
                assert.strictEqual(res, 8);
            });
        });
    });

    describe('String service', async () => {
        let service = null;
        const path1 = './static/as/string.ts';
        it('Compile the assembly script', async () => {
            const mainRaw = fs.readFileSync(path1);
            service = await Compiler.AS(mainRaw.toString());
            assert.ok(service);
        });

        it('Compiled module has generated correct descriptor', async () => {
            assert.deepEqual(service.meta, {
                concat: { name: 'concat', paramsType: { a: 'usize', b: 'usize'}, returnType: 'usize' }
            });
        });

        it('Store the service to storage', async () => {
            const filename = path1.replace(/^.*[\\\/]/, '')
            id = await storage.storeService(filename, service.source, service.raw, service.meta);
            assert.ok(id);
        });

        
        describe('Execute the service', () => {
            const executor = new Executor(storage);
            it('Concat "hello " and "world" returns "hello world"', async () => {
                const res = await executor.run(id, 'concat', { a: 'hello ', b: 'world' });
                assert.strictEqual(res, 'hello world');
            });
        });
    });
});