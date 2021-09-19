import Connector from './core/connector.js';
import Storage from "./core/storage.js";
import Executor from "./core/executor.js";
import AccessorBrowser from './browser/accessor.js';
import AccessorNodeJs from './node/accessor.js';
import { v4 as uuidv4 } from 'uuid';

export default class Wasmpeer {
	constructor(instanceId, storage, connector, executor) {
		this.instanceId = instanceId;
		this.storage = storage;
		this.connector = connector;
		this.executor = executor;
		this.connector.invoker = this.listen.bind(this);
	}

	static async build(instanceId, Accessor, ConnectorBuilder, config) {
		if (!instanceId) {
			instanceId = uuidv4();
		}
		const accessor = new Accessor(instanceId);
		const storage = new Storage(accessor);

		let peerId = await storage.read(instanceId).catch(async _ => {
			await storage.createWithId(instanceId, 'bootstrapper', JSON.stringify({}));
		});
		peerId = peerId && peerId.id ? peerId : null;

		const connector = await ConnectorBuilder(peerId, config);
		if (!peerId) {
			await storage.update(instanceId, JSON.stringify(connector.node.peerId.toJSON()));
		}
		const executor = new Executor(storage, connector);

		return new Wasmpeer(instanceId, storage, connector, executor);
	}

	static buildBrowser(instanceId, config) {
		return Wasmpeer.build(instanceId, AccessorBrowser, Connector.build, config);
	}

	static buildNodeJS(instanceId, config) {
		return Wasmpeer.build(instanceId, AccessorNodeJs, Connector.buildNodeJs, config);
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

	async setupForTest() {
		const path1 = '/wasm/fibo.wasm';
		const objFibo = await fetch(path1).then(resp => resp.arrayBuffer());

		const filename = path1.replace(/^.*[\\\/]/, '')
		const id = await this.storage.storeService(filename, objFibo);

		return id;
	}
}