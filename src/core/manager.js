'use strict';

const _sourceId = '_source';
const _metaId = '_meta';
const _nameId = '_name';

import all from 'it-all';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';

export default class Manager {
    constructor(connector, compiler) {
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
        const service = await this.connector.ipfs.add({
            path: filename,
            content: object
        });

        objectMeta[_nameId] = filename;
        objectMeta[_sourceId] = service.cid.toString();

        const metaObject = new TextEncoder().encode(JSON.stringify(objectMeta, null, 2));
        const wrap = await this.connector.ipfs.add({
            path: filename + _metaId,
            content: metaObject
        });

        const cid = wrap.cid.toString();
        this.createEntry(cid, filename, 1, metaObject);

        await this.connector.ipfs.files.write('/catalog.json', new TextEncoder().encode(JSON.stringify(this.FILES)), {
            create: true,
            parents: true
        });

        return cid;
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
        const content = uint8ArrayConcat(await all(this.connector.ipfs.cat(id)));
        const meta = JSON.parse((new TextDecoder()).decode(content));
        const source = uint8ArrayConcat(await all(this.connector.ipfs.cat(meta[_sourceId])));
        return {
            source: source,
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
