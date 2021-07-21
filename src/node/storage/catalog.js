import fs from 'fs';
import os from 'os';
import { v4 as uuid_v4 } from 'uuid';
import Accessor from './accessor';

export default class Catalog {
	constructor(instanceId) {
		const dir = os.tmpdir() + '/wasmpeer/storage/' + instanceId + '/';
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		};

		this.targetDir = dir;
		this.catalogPath = dir + 'catalog';

		this.accessor = new Accessor();
	}

	lookAt(id) {
		const catalog = this.load();
		return catalog[id];
	}

	new(name) {
		const id = uuid_v4();
		const entry = {
			path: this.targetDir + id,
			id: id
		};

		if (name) {
			entry.name = name;
		}

		const db = this.load();
		db[id] = entry;

		this.save(db);
		return entry;
	}

	create(name, object) {
		const entry = this.new(name);
		this.accessor.put(entry.path, object);
		return entry;
	}

	update(id, object) {
		const entry = this.lookAt(id);
		this.accessor.put(entry.path, object);
	}

	get(id) {
		const file = this.lookAt(id);
		if (!file) {
			throw new Error('file is not found');
		}

		return this.accessor.fetch(file.path);
	}

	getJSON(id) {
		return JSON.parse(this.get(id));
	}

	load() {
		// TODO: requires encryption
		if (!fs.existsSync(this.catalogPath)) {
			return {};
		} else {
			return JSON.parse(fs.readFileSync(this.catalogPath));
		}
	}

	save(object) {
		// TODO: requires encryption
		fs.writeFileSync(this.catalogPath, JSON.stringify(object, null, 2));
	}
}
