import Communicator from './core/communicator.js';
import Executor from './core/executor.js';
import Manager from './core/manager.js';
import Connector from './core/connector.js';

export default class Wasmpeer {
	constructor(connector, options) {
		this.instanceId = connector.id;

		this.manager = new Manager(connector, options);
		this.communicator = new Communicator(connector, this.manager, options);
		this.executor = new Executor(this.manager, connector, options);

		this.connector = connector;
		this.communicator.execute = this.invoke.bind(this);

		this.logger = options.logger || (() => { });
	}

	static async buildBrowser(options = {}) {
		const connector = new Connector(options);
		await connector.build();
		return new Wasmpeer(connector, options);
	}

	static async buildNodeJS(options) {
		const connector = new Connector(options);
		await connector.buildNodeJs();
		return new Wasmpeer(connector, options);
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
		this.logger.log('invoking', serviceId, endpoint, params);
		const res = await this.executor.run(serviceId, endpoint, params);
		return res;
	}

	async invokeOn(targetPeerId, serviceId, endpoint, params) {
		const res = await this.communicator.request(targetPeerId, serviceId, endpoint, params);
		return res;
	}
}