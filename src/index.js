import Connector from './core/connector.js';
import Storage from './core/storage.js';
import Executor from './core/executor.js';
import Manager from './core/manager.js';

import { v4 as uuidv4 } from 'uuid';

export default class Wasmpeer {
	constructor(instanceId, manager, storage, connector, executor) {
		this.instanceId = instanceId;
		this.storage = storage;
		this.connector = connector;
		this.executor = executor;
		this.manager = manager;
		this.connector.invoker = this.listen.bind(this);
	}

	static async build(instanceId, StorageBuilder, ConnectorBuilder, config) {
		if (!instanceId) {
			instanceId = uuidv4();
		}

		const storage = new StorageBuilder();
		let peerId = await storage.getJSON(instanceId).catch(async _ => {
			await storage.createWithId(instanceId, 'bootstrapper', JSON.stringify({}));
		});
		peerId = peerId && peerId.id ? peerId : null;

		const connector = await ConnectorBuilder(peerId, config);
		if (!peerId) {
			await storage.update(instanceId, JSON.stringify(connector.node.peerId.toJSON()));
		}

		const manager = new Manager(storage);
		const executor = new Executor(manager, connector);

		return new Wasmpeer(instanceId, manager, storage, connector, executor);
	}

	static buildBrowser(instanceId, config) {
		return Wasmpeer.build(instanceId, Storage.buildBrowser, Connector.build, config);
	}

	static buildNodeJS(instanceId, config) {
		return Wasmpeer.build(instanceId, Storage.buildNodeJS, Connector.buildNodeJs, config);
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

		// REMARK: for testing purpose due to unavailability of upload mechanism
		serviceId = await this.setupForTest();
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

	async bootstrap() {

		const path1 = '/as/calculator.ts';

		const objFibo = await fetch(path1).then(resp => resp.arrayBuffer());

		const filename = path1.replace(/^.*[\\\/]/, '')
		const id = await this.storage.storeService(filename, objFibo);

		return id;
	}
}