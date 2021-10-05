import pipe from 'it-pipe';
import { v4 as uuidv4 } from 'uuid';
import IPFS from 'ipfs';

const __defaultWorkspace = 'wasmpeer';

import all from 'it-all';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';

import { libp2pBundleNodeJS, libp2pBundle } from './libp2pbundle.js';

export default class Communicator {
	constructor(node, info, log) {
		this.node = node;
		this.log = log;
		this.info = info;
		this.callStack = {};
		this.FILES = [];
		this.FILESHash = {};
		this.messageHandler = this.messageHandler.bind(this);
		
		try {
			this.node.pubsub.subscribe(__defaultWorkspace, this.messageHandler);
		} catch (err) {
			err.message = `Failed to subscribe to the workspace: ${err.message}`;
			throw new Error(err.message);
		}

		setInterval(async () => {
			try {
				await this.sendFileList();
			} catch (err) {
				err.message = `Failed to publish the file list: ${err.message}`;
				throw new Error(err.message);
			}
		}, 10000);

		this.invoker = () => { };

		// node.handle(node.peerId.toB58String(), async ({ connection, stream }) => {
		// 	try {
		// 		await pipe(
		// 			stream,
		// 			async (source) => {
		// 				for await (const message of source) {
		// 					const req = JSON.parse(String(message));

		// 					if (req.type === 'ANS') {
		// 						if (!this.callStack[req.callId]) {
		// 							throw new Error('Incoming not recognized: ', req.callId);
		// 						}
		// 						this.callStack[req.callId](req);
		// 						this.callStack[req.callId] = null;
		// 					} else {
		// 						// UI.log('INCOMING REQ: ', req.callId);
		// 						const resp = await this.invoker('https://wasmpeer.org/e21af0b5-2a5c-4e93-9ee2-d3449fcf23e3/main?i=10');

		// 						const payload = {
		// 							type: 'ANS',
		// 							req: req,
		// 							callId: req.callId,
		// 							data: resp
		// 						};

		// 						try {
		// 							const { stream } = await connection.newStream([connection.remotePeer.toB58String()])
		// 							await Invocator.send(JSON.stringify(payload), stream);
		// 							return;
		// 						} catch (err) {
		// 							console.error('Could not negotiate chat protocol stream with peer', err)
		// 						}
		// 					}
		// 				}
		// 			}
		// 		)

		// 		await pipe([], stream)
		// 	} catch (err) {
		// 		console.error(err)
		// 	}
		// });
	}

	sendFileList() {
		return Promise.all(this.FILES.map(this.publishHash));
	}

	static buildNodeJs(peerId, params = {}) {
		params.bundle = libp2pBundleNodeJS;
		return Communicator.build(peerId, params);
	}

	static async build(peerId, params = {}) {

		let { transport, bundle, log, sigServers, bootstrappers } = params;

		const node = await IPFS.create({
				libp2p: bundle || libp2pBundle
		});
		const info = await node.id();
		return new Communicator(node, info, log);
	}

	getAvailablePeers() {
		return this.node.pubsub.peers(__defaultWorkspace);
	}

	getAvailableServices() {
		return this.FILES.map(x => this.FILESHash[x]);
	}

	publishHash = (hash) => {
		const data = uint8ArrayFromString(hash);
		return this.node.pubsub.publish(__defaultWorkspace, data);
	}

	async messageHandler(message) {
		const stringId = this.info.id.toString();

		const myNode = stringId;
		const hash = message.data.toString();
		const messageSender = message.from;

		if (myNode !== messageSender && !this.FILES.includes(hash)) {
			this.getFile(messageSender || stringId, hash);
		}
	}

	async getFile(messageSender, hash) {
		if (!hash) {
			throw new Error('No CID was inserted.');
		} else if (this.FILES.includes(hash)) {
			console.log('The file is already in the current workspace.');
			return;
		}

		this.FILES.push(hash);
	
		for await (const file of this.node.ls(hash)) {
			if (file.type === 'file') {
				const content = uint8ArrayConcat(await all(this.node.cat(file.cid)));

				this.FILESHash[hash] = {
					name: file.name,
					hash: hash,
					size: file.size,
					content: content,
					messageSender: messageSender
				};

				await this.publishHash(hash);
				console.log(`The ${file.name} file was added.`);
				// $emptyRow.style.display = 'none'
			}
		}
	}

	async sendMessage(targetPeerId, message) {
		this.node.peerStore.peers.forEach(async peerData => {
			const peerId = peerData.id.toB58String();
			if (targetPeerId !== peerId) return;

			let connection = this.node.connectionManager.get(peerData.id);
			if (!connection) {
				connection = await this.node.dial(peerData.id);
			}

			if (!connection) return;

			try {
				const { stream } = await connection.newStream([peerId]);
				await Invocator.send(message, stream);
			} catch (err) {
				console.error('Could not negotiate chat protocol stream with peer', err);
			}
		})
	}

	async invoke(targetPeerId, payload) {
		this.node.peerStore.peers.forEach(async peerData => {
			const peerId = peerData.id.toB58String();
			if (targetPeerId !== peerId) return;

			let connection = this.node.connectionManager.get(peerData.id);
			if (!connection) {
				connection = await this.node.dial(peerData.id);
			}
			if (!connection) return;

			try {
				const { stream } = await connection.newStream([peerId]);
				await Invocator.send(JSON.stringify(payload), stream);
				return;
			} catch (err) {
				console.error('Could not negotiate chat protocol stream with peer', err);
			}
		})
	}

	async call(targetPeerId, method, parameter) {
		const payload = {
			callId: uuidv4(),
			method: method,
			type: 'GET',
			serviceId: 'abcdef',
			parameter: parameter
		};

		const ress = new Promise((resolve, reject) => {
			this.invoke(targetPeerId, payload);
			this.callStack[payload.callId] = resolve;
		});

		const resp = await ress.then(x => {
			return x.data;
		});

		return resp;
	}

	// callFirst() {
	//   const list = this.peer.fingerTable.getTable();
	//   const a = Object.values(list)[0];

	//   return this.call(a.fingerId, null);
	// }
}

const Invocator = {
	handler: async ({ connection, stream }) => {
		try {
			await pipe(
				stream,
				async function (source) {
					for await (const message of source) {

						console.info(`${connection.remotePeer.toB58String().slice(0, 8)}: ${String(message)}`);
					}
				}
			)

			await pipe([], stream);
		} catch (err) {
			console.error(err);
		}
	},
	send: async (message, stream) => {
		try {
			await pipe(
				[message],
				stream,
				async (source) => {
					for await (const message of source) {
						console.info(String(message));
					}
				}
			)
		} catch (err) {
			console.error(err);
		}
	}
}
