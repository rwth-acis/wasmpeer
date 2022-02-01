'use strict';
import { v4 as uuidv4 } from 'uuid';
export default class KeyValueStore {
	constructor(connector, id) {
		this.id = id;
		this.connector = connector;
		const value = this.connector.db.get(id).map(x => x.value)[0];
		this.db = value ? JSON.parse(value) : {};
	}

	get(key) {
		return this.db[key];
	}

	async save() {
		const value = JSON.stringify(this.db, null, 2);
		await this.connector.db.put({ _id: this.id, value: value });
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
