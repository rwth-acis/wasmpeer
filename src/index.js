import Communicator from './core/communicator.js';
import Storage from './core/storage';
import Executor from './core/executor.js';
import Manager from './core/manager.js';
import Connector from './core/connector.js';
import { v4 as uuidv4 } from 'uuid';

const __defaultWorkspace = 'wasmpeer';
export default class Wasmpeer {
	constructor(instanceId, manager, communicator, executor, connector) {
		this.instanceId = instanceId;
		this.communicator = communicator;
		this.executor = executor;
		this.manager = manager;
		this.connector = connector;
		this.communicator.execute = this.invoke.bind(this);
	}

	static async build(connector, config) {
		const instanceId = await connector.ipfs.id();

		const manager = new Manager(connector);
		const communicator = new Communicator(connector, manager);
		const executor = new Executor(manager, communicator);

		return new Wasmpeer(instanceId, manager, communicator, executor, connector);
	}

	static async buildBrowser(config) {
		const connector = new Connector(__defaultWorkspace);
		await connector.build();
		return Wasmpeer.build(connector, config);
	}

	static async buildNodeJS(config) {
		const connector = new Connector(__defaultWorkspace);
		await connector.buildNodeJs();
		return Wasmpeer.build(connector, config);
	}

	async listen(url) {
		const location = new URL(url);
		let [, serviceId, endpoint] = location.pathname.split('/');

		let params = {};
		if (location.search) {
			const search = location.search.substring(1);
			params = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
		}

		const res = await this.invoke(serviceId, endpoint, params);
		return res;
	}

	async invoke(serviceId, endpoint, params) {
		console.log('invoking', serviceId, endpoint, params);
		const res = await this.executor.run(serviceId, endpoint, params);
		return res;
	}

	async invokeOn(targetPeerId, serviceId, endpoint, params) {
		const res = await this.communicator.request(targetPeerId, serviceId, endpoint, params);
		return res;
	}
}