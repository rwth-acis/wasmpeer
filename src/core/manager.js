'use strict';

const _keyvalueStoreId = '_store';
const _sourceId = '_source';
const _rawId = '_raw';
const _metaId = '_meta';

export default class Manager {
    constructor(storage, connector, compiler) {
        this.storage = storage;
        this.compiler = compiler;
        this.FILES = [];
		this.FILESHash = {};
        this.db = {};

        if (connector) {
            this.connector = connector;
            this.outgoingBroadcast();

            this.incomingBroadcast = this.incomingBroadcast.bind(this);
            this.connector.startSubscribe(this.incomingBroadcast);            
        }
    }

    async uploadAS(filename, object) {
        const service = await this.compiler.AS(object.toString());
        const id = await this.storeService(filename, service.source, service.raw, service.meta);
        return id;
    }

    async storeService(filename, object, objectRaw, objectMeta) {
        const source = await this.storage.create(filename, object);
        const raw = await this.storage.create(null, objectRaw);
        const meta = await this.storage.create(null, JSON.stringify(objectMeta, null, 2));
        const store = await this.storage.create(null, JSON.stringify({}, null, 2));

        const detail = JSON.stringify({
            [_keyvalueStoreId]: store.id,
            [_sourceId]: source.id,
            [_rawId]: raw.id,
            [_metaId]: meta.id,
            meta: objectMeta
        }, null, 2);

        let entry = null;
        if (this.connector) {
            const fileAdded = await this.connector.ipfs.add({
                path: filename,
                content: detail
            }, {
                wrapWithDirectory: true
            })
            const key = fileAdded.cid.toString();
            this.createEntry(key, filename, detail);

            entry = await this.storage.createWithId(key, filename, detail);
        } else {
            entry = await this.storage.create(filename, detail);
        }

        return entry.id;
    }

    createEntry(hash, name, size, content) {
        this.FILES.push(hash);
        this.FILESHash[hash] = {
            hash: hash,
            name: name,
            content: content
        }
    }

    getAvailableServices() {
		return this.FILES.map(x => this.FILESHash[x]);
	}	

    async getService(id) {
        const entry = await this.storage.getJSON(id);
        const source = await this.storage.get(entry[_sourceId]);
        const store = await this.storage.getJSON(entry[_keyvalueStoreId]);
        const meta = await this.storage.getJSONSafe(entry[_metaId]);
        return {
            sourceId: entry[_sourceId],
            storeId: entry[_keyvalueStoreId],
            metaId: entry[_metaId],
            source: source,
            store: store,
            meta: meta
        };
    }

    async updateService(id, object) {
        const entry = await this.storage.getJSON(id);
        await this.storage.update(entry[_sourceId], object);
    }

    update(id, object) {
        // console.log('update: ', id, object);
        return this.storage.update(id, object);
    }

    read(id) {
        return this.storage.getJSON(id);
    }

    createWithId(id, name, object) {
        return this.storage.createWithId(id, name, object);
    }

    // #region broadcaster
    async incomingBroadcast(message) {
		const myId = this.connector.info.id.toString();
		const hash = message.data.toString();
		const senderId = message.from;
        
		if (myId !== senderId && !this.FILES.includes(hash)) {
			const entry = await this.connector.getFile(hash);
            this.createEntry(hash, entry.name, entry.content);
		}
	}

    outgoingBroadcast() {
        setInterval(async () => {
            try {
                await Promise.all(this.FILES.map(this.connector.publishHash)); 
            } catch (err) {
                err.message = `Failed to publish the file list: ${err.message}`;
                throw new Error(err.message);
            }
        }, 10000);    
	}
    // #endregion
}
