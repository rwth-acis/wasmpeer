import { v4 as uuid_v4 } from 'uuid';
import Accessor from './accessor';

export default class Catalog {
	constructor(instanceId) {
		const dir = 'wasmpeer/storage/' + instanceId + '/';

		this.targetDir = dir;
		this.catalogPath = dir + 'catalog';

		this.accessor = new Accessor();
	}

	static async build(instanceId) {
		const catalog = new Catalog(instanceId);
		let bootstrapper = await catalog.lookAt(instanceId).catch(_ => {});
		if (!bootstrapper) {
			bootstrapper = await catalog.createWithId(instanceId, 'bootstrapper', JSON.stringify({}));
		}
		return catalog;
	}

	async lookAt(id) {
		const catalog = await this.load();
		if (!catalog[id]) {
			throw new Error('entry is not found');
		}
		return catalog[id];
	}

	new(name) {
		const id = uuid_v4();
		return this.newWithId(id, name);
	}

	async newWithId(id, name) {
		const entry = {
			path: this.targetDir + id,
			id: id
		};

		if (name) {
			entry.name = name;
		}

		const db = await this.load();
		if (db[id]) {
			throw new Error('entry id is being used');
		}
		db[id] = entry;

		await this.save(db);
		return entry;
	}

	async create(name, object) {
		const entry = await this.new(name);
		await this.accessor.put(entry.path, object);
		return entry;
	}

	async createWithId(id, name, object) {
		const entry = await this.newWithId(id, name);
		await this.accessor.put(entry.path, object);
		return entry;
	}

	async update(id, object) {
		const entry = await this.lookAt(id);
		await this.accessor.put(entry.path, object);
	}

	get(id) {
		return this.lookAt(id).then(file => this.accessor.fetch(file.path));
	}

	getJSON(id) {
		return this.get(id).then(values => JSON.parse(values));
	}

	load() {
		return this.accessor.fetch(this.catalogPath).then(values => values ? JSON.parse(values) : {});
	}

	save(object) {
		return this.accessor.put(this.catalogPath, JSON.stringify(object, null, 2));
	}
}
