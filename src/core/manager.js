'use strict';

const _sourceId = '_source';
const _metaId = '_meta';
const _nameId = '_name';

import all from 'it-all';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';
import { extractor } from '../utils/parser.js';

export default class Manager {
    constructor(connector, options = {}) {
        this.compiler = options.compiler || null;
        this.activeServices = [];
        this.ownServices = [];
        this.lookup = {};
        this.db = {};
        this.connector = connector;
        this.logger = options.logger || (() => { });

        try {
            // init repo
            (async () => {
                const exists = await this.connector.ipfs.files.stat('/catalog.json').catch(_ => null);
                if (!exists) {
                    return;
                }

                const catalogRaw = await all(this.connector.ipfs.files.read('/catalog.json'));
                this.ownServices = JSON.parse((new TextDecoder()).decode(uint8ArrayConcat(catalogRaw)) || '[]');

                this.ownServices.forEach(async hash => {
                    const meta = await this.connector.getFileInJSON(hash);
                    this.activeServices.push(hash);
                    this.lookup[hash] = {
                        hash: hash,
                        name: meta[_nameId]
                    }
                })
            })();
        }
        catch (err) {
            this.logger.error('instantiate catalog error', error)
        }

        this.incomingBroadcast = this.incomingBroadcast.bind(this);
        this.connector.startSubscribe(this.incomingBroadcast);

        this.outgoingBroadcast();
    }

    async uploadAS(filename, object) {
        const service = await this.compiler.AS(object.toString());
        const id = await this.storeService(filename, service.source, service.raw, service.meta);
        return id;
    }

    async storeServiceTsd(filename, object, objectRaw, objectTsd) {
        const meta = extractor(objectTsd);
        return this.storeService(filename, object, objectRaw, meta);
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

        return cid;
    }

    async createEntry(hash, name, size, content) {
        if (this.ownServices.includes(hash)) {
            throw new Error('service exist');
        }
        this.activeServices.push(hash);
        this.ownServices.push(hash);
        this.lookup[hash] = {
            hash: hash,
            name: name,
            content: content
        }

        await this.connector.ipfs.files.write('/catalog.json', new TextEncoder().encode(JSON.stringify(this.ownServices)), {
            create: true,
            parents: true
        });
    }

    getAvailableServices() {
        return this.activeServices.map(x => this.lookup[x]);
    }

    async getService(id) {
        const content = await this.connector.getFile(id);
        const meta = JSON.parse((new TextDecoder()).decode(content));
        const source = await this.connector.getFile(meta[_sourceId]);
        return {
            source: source,
            meta: meta
        };
    }

    // #region broadcaster
    async incomingBroadcast(message) {
        const myId = this.connector.id;
        const hash = message.data.toString();
        const senderId = message.from;
        if (myId !== senderId && !this.activeServices.includes(hash)) {
            const meta = await this.connector.getFileInJSON(hash);
            this.activeServices.push(hash);
            this.lookup[hash] = {
                hash: hash,
                name: meta[_nameId]
            }
        }
    }

    outgoingBroadcast() {
        setInterval(async () => {
            try {
                await Promise.all(this.ownServices.map(this.connector.publishHash));
            } catch (err) {
                err.message = `Failed to publish the file list: ${err.message}`;
                throw new Error(err.message);
            }
        }, 10000);
    }
    // #endregion
}
