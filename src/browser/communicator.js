import Storage from "./storage";
import Executor from "../core/executor";

export default class Communicator {
	constructor(instanceId) {
		this.instanceId = instanceId;
		this.storage = new Storage(this.instanceId);
	}

	async listen(url) {
		const location = new URL(url);
		let [, serviceId, endpoint] = location.pathname.split('/');

		let params = {};
		if (location.search) {
			const search = location.search.substring(1);
			params = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
		}

		console.log(serviceId, endpoint, params);

		// REMARK: for testing purpose due to unavailability of upload mechanism
		serviceId = await this.setupForTest();

		const executor = new Executor(this.storage);
		const res = await executor.run(serviceId, endpoint, params);

		return Promise.resolve(new Response(res.toString()));
	}

	async setupForTest() {
		const path1 = '/wasm/fibo.wasm';
		const objFibo = await fetch(path1).then(resp => resp.arrayBuffer());

		const filename = path1.replace(/^.*[\\\/]/, '')
		const id = await this.storage.storeService(filename, objFibo);
		
		return id;
	}
}