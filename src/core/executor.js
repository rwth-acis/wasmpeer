'use strict';
import Runner from './runner.js';

export default class Executor {
	constructor(manager, connector, options) {
		this.manager = manager;
		this.connector = connector;
		this.options = options;
	}

	run(id, funcName, input) {
		const runner = new Runner(this.manager, this.connector, this.options);
		return runner.run(id, funcName, input);
	}

	static runLocalFile(source, funcName, input) {
		const runner = new Runner(null);
		return runner.runBasic(source, funcName, input);
	}
}

//#region helper
const delay = () => {
	const wait = (1 + Math.floor(Math.random() * 10)) * 1000;
	return new Promise(function (resolve) {
		setTimeout(resolve.bind(null, v), wait)
	});
}
//#endregion