'use strict';
import { v4 as uuidv4 } from 'uuid';
export default class KeyValueStore {
	constructor(target) {
		this.db = target
	}

	get(key) {
		return this.db[key];
	}

	export() {
		return JSON.stringify(this.db, null, 2);
	}

	set(key, value) {
		this.db[key] = value;
	}

	set(key, value) {
		this.db[key] = value;
	}

	create(value) {
		const key = uuidv4();
		this.set(key, value);
		return key;
	}
}
