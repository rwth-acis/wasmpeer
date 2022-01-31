'use strict';
import assert from 'assert';
import Executor from '../src/core/executor.js';
import fs from 'fs';
import Compiler from '../src/utils/compiler.js';
import Manager from '../src/core/manager.js';
import Connector from '../src/core/connector.js';

describe('WASMPEER', () => {
	let id = '';

	let manager;
	let executor;
	let connector;

	it('INIT: Setup connector', async () => {
		const options = { logger: console };
		connector = new Connector(options);
		await connector.buildNodeJs();
		manager = new Manager(connector, options);
		executor = new Executor(manager, null, options);
		assert.ok(connector);
	});

	// describe('COMPONENT: Manager', () => {    
	//     const path1 = './static/services/calculator/calculator.wasm';
	//     const path2 = './static/services/string/string.wasm';

	//     let objMain;
	//     let id;

	//     it('Function will create a new entry to the catalog and save the file', async () => {
	//         objMain = fs.readFileSync(path1);
	//         const filename = path1.replace(/^.*[\\\/]/, '')
	//         id = await manager.storeService(filename, objMain, '', {});
	//         assert.ok(id);
	//     });

	//     it('Function will read the new entry from the catalog and the file should be the same', async () => {
	//         const service = await manager.getService(id);
	//         objMain = fs.readFileSync(path1);
	//         const objMainUint8Array = new Uint8Array(objMain);
	//         assert.deepEqual(objMainUint8Array, service.source);
	//     });

	//     // it('Function will update the entry from the catalog and the file should be the updated', async () => {
	//     //     const objHello = fs.readFileSync(path2);
	//     //     // manager.updateService(id, objHello);

	//     //     const { source } = await manager.getService(id);
	//     //     assert.deepStrictEqual(source, objHello);
	//     //     assert.notDeepStrictEqual(source, objMain);
	//     // });
	// });

	describe('SERVICE: Calculator service', async () => {
		let service = null;
		const path1 = './static/services/calculator/calculator.ts';
		it('Compile the assembly script', async () => {
			const mainRaw = fs.readFileSync(path1);
			service = await Compiler.AS(mainRaw.toString());
			assert.ok(service);
		});

		it('Compiled module has generated correct descriptor', async () => {
			assert.deepEqual(service.meta, {
				add: { name: 'add', paramsType: { input: 'usize' }, returnType: 'i32' },
				subtract: { name: 'subtract', paramsType: { input: 'usize' }, returnType: 'i32' },
				multiple: { name: 'multiple', paramsType: { input: 'usize' }, returnType: 'i32' },
				divide: { name: 'divide', paramsType: { input: 'usize' }, returnType: 'i32' },
				fib: { name: 'fib', paramsType: { input: 'usize' }, returnType: 'i32' }
			});
		});

		it('Store the service to storage', async () => {
			const filename = path1.replace(/^.*[\\\/]/, '')
			id = await manager.storeService(filename, service.source, service.raw, service.meta);
			assert.ok(id);
		});

		it('Execute: Add 5 and 6 returns 11', async () => {
			const res = await executor.run(id, 'add', { x: 5, y: 6 });
			assert.strictEqual(res, 11);
		});

		it('Execute: Subtract 5 and 6 returns -1', async () => {
			const res = await executor.run(id, 'subtract', { x: 5, y: 6 });
			assert.strictEqual(res, -1);
		});

		it('Execute: Multiple 5 and 6 returns 30', async () => {
			const res = await executor.run(id, 'multiple', { x: 5, y: 6 });
			assert.strictEqual(res, 30);
		});

		it('Execute: Divide 30 and 6 returns 5', async () => {
			const res = await executor.run(id, 'divide', { x: 30, y: 6 });
			assert.strictEqual(res, 5);
		});

		it('Execute: Fibonacci of 5 returns 8', async () => {
			const res = await executor.run(id, 'fib', { x: 5 });
			assert.strictEqual(res, 8);
		});
	});

	describe('SERVICE: String service', async () => {
		let service = null;
		const path1 = './static/services/string/string.ts';
		it('Compile the assembly script', async () => {
			const mainRaw = fs.readFileSync(path1);
			service = await Compiler.AS(mainRaw.toString());
			assert.ok(service);
		});

		it('Compiled module has generated correct descriptor', async () => {
			assert.deepEqual(service.meta, {
				concat: { name: 'concat', paramsType: { input: 'usize' }, returnType: 'usize' }
			});
		});

		it('Store the service to storage', async () => {
			const filename = path1.replace(/^.*[\\\/]/, '')
			id = await manager.storeService(filename, service.source, service.raw, service.meta);
			assert.ok(id);
		});

		it('Execute: Concat "hello " and "world" returns "hello world"', async () => {
			const res = await executor.run(id, 'concat', { first: 'hello ', second: 'world' });
			assert.strictEqual(res, 'hello world');
		});
	});

	describe('SERVICE: Issue service', async () => {
		let service = null;
		const path1 = './static/services/issue/issue.ts';
		const input1 = {
			title: 'Assemblyscript can\'t support JSON',
			description: 'Apparently JSON is not available natively in Assemblyscript'
		};
		const input2 = {
			title: 'Assemblyscript can\'t support Overloading',
			description: 'Apparently it is not available'
		};
		it('Compile the assembly script', async () => {
			const mainRaw = fs.readFileSync(path1);
			service = await Compiler.AS(mainRaw.toString());
			assert.ok(service);
		});

		it('Compiled module has generated correct descriptor', async () => {
			assert.deepEqual(service.meta, {
				add: { name: 'add', paramsType: { input: 'usize' }, returnType: 'usize' },
				list: { name: 'list', paramsType: {}, returnType: 'usize' },
			});
		});

		it('Store the service to storage', async () => {
			const filename = path1.replace(/^.*[\\\/]/, '')
			id = await manager.storeService(filename, service.source, service.raw, service.meta);
			assert.ok(id);
		});

		it('Execute: Add the first issue', async () => {
			await executor.run(id, 'add', input1);
		});

		it('Execute: Add the second issue', async () => {
			await executor.run(id, 'add', input2);

			Array.from(Array(100).keys()).forEach(async x => {
				await executor.run(id, 'add', input2);
			})
		});

		it('Execute: Get back the list of issues and previous input should exist in the list', async () => {
			const res = await executor.run(id, 'list', null);

			console.log(res);

			const resInput1 = res.find(x => x.title === input1.title && x.description === input1.description);
			assert.ok(resInput1);

			const resInput2 = res.find(x => x.title === input2.title && x.description === input2.description);
			assert.ok(resInput2);
		});
	});

	after(async () => {
		if (connector) {
			await connector.db.close();
			await connector.ipfs.stop();
			console.log('close ipfs');
		}
	})
});