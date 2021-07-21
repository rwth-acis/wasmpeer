import Executor from "../core/executor";

export default class Communicator {
	constructor(instanceId) {
		this.instanceId = instanceId;
	}

	async listen(url) {
		const location = new URL(url);
		const [, serviceId, endpoint] = location.pathname.split('/');

		let params = {};
		if (location.search) {
			const search = location.search.substring(1);
			params = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
		}

		console.log(serviceId, endpoint, params);

		const path1 = '/wasm/fibo.wasm';
		const objFibo = await fetch(path1).then(resp => resp.arrayBuffer());

		const res = await Executor.runLocalFile(objFibo, 'main', { i: 5 });
		const resp = new Response(res.toString());

		return Promise.resolve(resp);
	}
}