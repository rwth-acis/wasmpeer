'use strict';
import Wasmpeer from '../../src/index.js';
import express from 'express';

const _config = {
	sigServers: [
		'/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
		'/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
	],
	bootstrappers: [
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
	]
};

(async () => {
	// REMARK: InstanceId will be stored in the local storage, including port
	const instanceId = 'f5e9de80-e9f2-4fcd-8ea0-2e089544ae9p';
	const port = 3000;

	_config.log = console.log;
	const wasmpeer = await Wasmpeer.buildNodeJS(instanceId, _config);

	const app = express();
	const listener = async (req, res) => {
		try {
			const { serviceId, endpoint } = req.params;
			const { version, peerId } = req.query;
			const input = populateInput(req);

			const finalResult = await wasmpeer.listen(serviceId, endpoint, input);
			res.send(finalResult.toString());
		}
		catch (err) {
			console.error(err);
			res.status(500).send('failed');
		}
	}

	app.all('/:serviceId/:endpoint', listener);
	app.listen(port);
	console.log('listening to: ', port);
})();

const populateInput = (req) => {
	delete req.query.version;
	delete req.query.peerId;
	switch (req.method) {
		case 'POST':
		case 'PUT':
			return req.body;
		default:
			return req.query;
	}
}