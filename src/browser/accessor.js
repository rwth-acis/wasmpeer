'use strict';
import localforage from 'localforage';
localforage.config({
	driver: localforage.INDEXEDDB,
	name: 'wasmpeer',
	version: 1.0,
	storeName: 'db',
	description: 'wasmpeer storage system'
});

export default class Accessor {
	constructor(instanceId) {
		this.targetDir = 'wasmpeer/storage/' + instanceId + '/';
		// TODO: fomulate encryption/decryption key
	}

	put(path, object) {
		const encrypted = this.encrypt(object);
		return localforage.setItem(this.targetDir + path, encrypted);
	}

	fetch(path) {
		return localforage.getItem(this.targetDir + path).then(raw => this.decrypt(raw));
	}

	encrypt(inp) {
		// TODO: encryption algorithm will be used
		return inp;
	}

	decrypt(inp) {
		// TODO: decryption algorithm will be used
		return inp;
	}
}