import Libp2p from 'libp2p';
import Bootstrap from 'libp2p-bootstrap';
import KadDHT from 'libp2p-kad-dht';
import Gossipsub from 'libp2p-gossipsub';
import MPLEX from 'libp2p-mplex';
import { NOISE } from '@chainsafe/libp2p-noise';
import WebRTCStar from 'libp2p-webrtc-star';
import wrtc from 'wrtc';
import IPFS from 'ipfs';

import pipe from 'it-pipe';
import all from 'it-all';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';

export default class Connector {
	constructor(workspace) {
		this.workspace = workspace;
		this.libp2p = null;
		this.ipfs = null;
		this.info = null;
		this.builder = this.builder.bind(this);
		this.FILES = [];
		this.FILESHash = {};
	}

	async build() {
		const ipfs = await IPFS.create({
			libp2p: this.builder
		});
		this.ipfs = ipfs;
		this.info = await ipfs.id();
	}

	async buildNodeJs(opts) {
		opts.transport = {
			[WebRTCStar.prototype[Symbol.toStringTag]]: {
				wrtc
			}
		};
		return this.build(opts);
	}

	async getFile(hash) {
		if (!hash) {
			throw new Error('No CID was inserted.');
		}

		for await (const file of this.ipfs.ls(hash)) {
			if (file.type === 'file') {
				const content = uint8ArrayConcat(await all(this.ipfs.cat(file.cid)));
				return {
					name: file.name,
					hash: hash,
					size: file.size,
					content: content
				};
			}
		}
	}

	startSubscribe(handler) {
		try {
			this.ipfs.pubsub.subscribe(this.workspace, handler);
		} catch (err) {
			err.message = `Failed to subscribe to the workspace: ${err.message}`;
			throw new Error(err.message);
		}		
	}

	publishHash(hash) {
		const data = uint8ArrayFromString(hash);
		return this.ipfs.pubsub.publish(this.workspace, data);
	}

	async getConnection(targetPeerId) {
		let foundTargetPeerData = null;
		this.libp2p.peerStore.peers.forEach(peerData => {
			const peerId = peerData.id.toB58String();
			if (targetPeerId === peerId) {
				foundTargetPeerData = peerData;
				return;
			}
		})
		let connection = this.libp2p.connectionManager.get(foundTargetPeerData.id);
		// reattempt connection
		if (!connection) {
			connection = await this.libp2p.dial(foundTargetPeerData.id);
		}
		return connection;
	}

	async builder(opts) {
		const peerId = opts.peerId
		const bootstrapList = [
			'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
			'/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
			'/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
			'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
			'/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
		];
		const transport = opts.transport || {};

		const node = await Libp2p.create({
			peerId,
			addresses: {
				listen: [
					'/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
					'/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
				]
			},
			connectionManager: {
				minPeers: 25,
				maxPeers: 100,
				pollInterval: 5000
			},
			modules: {
				transport: [
					WebRTCStar
				],
				streamMuxer: [
					MPLEX
				],
				connEncryption: [
					NOISE
				],
				peerDiscovery: [
					Bootstrap
				],
				dht: KadDHT,
				pubsub: Gossipsub
			},
			config: {

				transport: transport,
				peerDiscovery: {
					autoDial: true,
					mdns: {
						interval: 10000,
						enabled: true
					},
					bootstrap: {
						interval: 30e3,
						enabled: true,
						list: bootstrapList
					}
				},
				relay: {
					enabled: true,
					hop: {
						enabled: true,
						active: true
					}
				},
				dht: {
					enabled: true,
					kBucketSize: 20,
					randomWalk: {
						enabled: true,
						interval: 10e3,
						timeout: 2e3
					}
				},
				pubsub: {
					enabled: true
				}
			},
			metrics: {
				enabled: true,
				computeThrottleMaxQueueSize: 1000,
				computeThrottleTimeout: 2000,
				movingAverageIntervals: [
					60 * 1000,
					5 * 60 * 1000,
					15 * 60 * 1000
				],
				maxOldPeersRetention: 50
			}
		});

		this.libp2p = node;
		return node;
	}

	getAvailablePeers() {
		return this.ipfs.pubsub.peers(this.workspace);
	}
}

// #region protocols
export const ChannelProtocol = {
	REQUEST: 'request',
	RESPONSE: 'response',
	flush: async (stream) => {
		await pipe([], stream);
	},
	receive: async (stream) => {
		await pipe(
			stream,
			async (source) => {
				for await (const message of source) {
					req = JSON.parse(String(message));
					return req;
				}
			}
		)
	},
	send: async (connection, channel, payload) => {
		try {
			const { stream } = await connection.newStream([channel]);
			await pipe(
				[JSON.stringify(payload)],
				stream
			);
			return;
		} catch (err) {
			console.error('Could not negotiate chat protocol stream with peer', err);
		}
	}
}
// #endregion