'use strict';
import KeyValueStore from './keyvalue-store.js';
import loader from "@assemblyscript/loader";
export default class Runner {
	constructor(manager, communicator) {
		this.manager = manager;
		this.communicator = communicator;
		this.keyValueStore = {
			get: () => { },
			set: () => { }
		};
	}

	async run(id, funcName, input) {
		const service = await this.manager.getService(id);
		this.keyValueStore = new KeyValueStore(service.store);
		const res = await this.runBasic(service.source, funcName, input, service.meta);

		this.manager.update(service.storeId, this.keyValueStore.export());
		return res;
	}

	async runBasic(source, funcName, input, meta = {}) {
		let __exports = {};
		const importObject = {
			module: {},
			env: {
				abort() { },
				seed() { }
			},
			input: {
				kvstore_get: (rawKey) => {
					const key = __exports.__getString(rawKey);
					const value = this.keyValueStore.get(key);
					return __exports.__newString(value);
				},
				kvstore_update: (rawKey, rawValue) => {
					const key = __exports.__getString(rawKey);
					const value = __exports.__getString(rawValue);
					this.keyValueStore.set(key, value)
				},
				kvstore_create: (rawValue) => {
					const value = __exports.__getString(rawValue);
					const key = this.keyValueStore.create(value);
					return __exports.__newString(key);
				}
			}
		}

		const mod = loader.instantiateSync(new Uint8Array(source), importObject);
		__exports = mod.exports;

		const func = mod.exports[funcName];
		const parsedInput = JSON.stringify(input);
		const res = func(__exports.__newString(parsedInput));

		return this.resMapper(__exports, res, meta[funcName].returnType);
	}

	// TODO: #3 simple mapper for now, more advance mapping technique like descriptor file is planned
	argsMapper(input, paramsType, exports) {
		return input ? Object.values(input).map(x => {
			if (!isNaN(x)) {
				return Number(x);
			}
			else if (typeof x === 'string' || x instanceof String) {
				return exports.__newString(x);
			}
		}) : null;
	}

	resMapper(__exports, input, type) {
		switch (type) {
			case 'usize':
				const response = __exports.__getString(input)
				try {
					const JSONparser = (str) => {
						const raw = JSON.parse(str);
						if (Array.isArray(raw)) {
							return raw.map(x => JSONparser(x));
						}
						return raw;
					}
					return JSONparser(response);

				} catch (err) {
					return response;
				}
			default:
				return input;
		}
	}
}