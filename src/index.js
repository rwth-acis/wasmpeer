import Communicator from './core/communicator.js';
import Storage from './core/storage';
import Executor from './core/executor.js';
import Manager from './core/manager.js';

import { v4 as uuidv4 } from 'uuid';

import wasmString from 'url:../static/wasm/string.wasm';
import wasmCalculator from 'url:../static/wasm/calculator.wasm';


export default class Wasmpeer {
	constructor(instanceId, manager, storage, communicator, executor) {
		this.instanceId = instanceId;
		this.storage = storage;
		this.communicator = communicator;
		this.executor = executor;
		this.manager = manager;
		this.communicator.invoker = this.listen.bind(this);
	}

	static async build(instanceId, StorageBuilder, CommunicatorBuilder, config) {
		if (!instanceId) {
			instanceId = uuidv4();
		}

		const storage = StorageBuilder();
		let bootstrapper = await storage.getJSON(instanceId).catch(async _ => {
			await storage.createWithId(instanceId, 'bootstrapper', JSON.stringify({}));
		});
		let peerId = bootstrapper && bootstrapper.peerId && bootstrapper.peerId.id ? bootstrapper.peerId : null;

		const connector = await CommunicatorBuilder(peerId, config);
		if (!peerId) {
			if (!bootstrapper) {
				bootstrapper= {};
			}
			bootstrapper.peerId = connector.node.id();
			// await storage.update(instanceId, JSON.stringify(bootstrapper));
		}

		const manager = new Manager(instanceId, storage, connector);
		const executor = new Executor(manager, connector);

		await Wasmpeer.bootstrap(manager);
		return new Wasmpeer(instanceId, manager, storage, connector, executor);
	}

	static buildBrowser(instanceId, config) {
		return Wasmpeer.build(instanceId, Storage.buildBrowser, Communicator.build, config);
	}

	static buildNodeJS(instanceId, config) {
		return Wasmpeer.build(instanceId, Storage.buildNodeJS, Communicator.buildNodeJs, config);
	}

	invoke(targetPeerId, method, parameter) {
		return this.connector.call(targetPeerId, method, parameter);
	}

	async listen(url) {
		const location = new URL(url);
		let [, serviceId, endpoint] = location.pathname.split('/');

		let params = {};
		if (location.search) {
			const search = location.search.substring(1);
			params = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
		}

		const res = await this.execute(serviceId, endpoint, params);
		return res;
	}

	async execute(serviceId, endpoint, params) {

		const res = await this.executor.run(serviceId, endpoint, params);
		return res;
	}

	async callOther(serviceId, endpoint, params) {
		const res = await this.connector.callFirst();
		return res;
	}

	static async bootstrap(manager) {
		const path1 = wasmString;
		const filename = path1.replace(/^.*[\\\/]/, '')
		const objCalc = await fetch(path1).then(resp => resp.arrayBuffer());
		const idCalc = await manager.storeService(filename, objCalc);

		const path2 = wasmCalculator;
		const filename2 = path2.replace(/^.*[\\\/]/, '')
		const objStr = await fetch(path2).then(resp => resp.arrayBuffer());
		const idStr = await manager.storeService(filename2, objStr);

		return [idCalc, idStr];
	}
}