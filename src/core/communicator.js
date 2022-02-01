import { v4 as uuidv4 } from 'uuid';
import { ChannelProtocol } from './connector.js';
export default class Communicator {
	constructor(connector, options) {
		this.connector = connector;
		this.callStack = {};
		this.execute = async () => { };

		this.handleRequest = this.handleRequest.bind(this);
		this.handleResponse = this.handleResponse.bind(this);

		this.connector.libp2p.handle(ChannelProtocol.REQUEST, this.handleRequest);
		this.connector.libp2p.handle(ChannelProtocol.RESPONSE, this.handleResponse);

		this.logger = options.logger || (() => { });
	}

	getAvailablePeers() {
		return this.connector.getAvailablePeers();
	}

	async request(targetPeerId, serviceId, method, parameter) {
		const payload = {
			callId: uuidv4(),
			method: method,
			serviceId: serviceId,
			parameter: parameter
		};

		const connection = await this.connector.getConnection(targetPeerId);
		if (!connection) {
			throw new Error('Connection not found');
		}
		const ress = new Promise(async (resolve, reject) => {
			await ChannelProtocol.send(connection, ChannelProtocol.REQUEST, payload);
			this.callStack[payload.callId] = resolve;
		});

		const x = await ress;
		return x.data;
	}

	async handleRequest({ connection, stream }) {
		try {
			const req = await ChannelProtocol.receive(stream);

			this.logger.log('INCOMING REQ: ' + JSON.stringify(req));
			const resp = await this.execute(req.serviceId, req.method, req.parameter);
			const payload = {
				req: req,
				callId: req.callId,
				data: resp
			};
			await ChannelProtocol.send(connection, ChannelProtocol.RESPONSE, payload);
			await ChannelProtocol.flush();
		}
		catch (err) {
			this.logger.error(err);
		}
	}

	async handleResponse({ stream }) {
		try {
			const req = await ChannelProtocol.receive(stream);

			if (!this.callStack[req.callId]) {
				throw new Error('Incoming not recognized: ', req.callId);
			}
			this.callStack[req.callId](req);
			this.callStack[req.callId] = null;

			await ChannelProtocol.flush();
		}
		catch (err) {
			this.logger.error(err);
		}
	}
}
