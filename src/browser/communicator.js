import Storage from "./storage";
import Executor from "../core/executor";
import Connector from "./connector";

export default class Communicator {
	constructor(instanceId) {
		this.instanceId = instanceId;
		this.storage = new Storage(this.instanceId);
		this.connector = new Connector();
		this.executor = new Executor(this.storage, this.connector);
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