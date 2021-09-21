import 'babel-polyfill';
import Wasmpeer from '../../src/index.js';
import { v4 as uuidv4 } from 'uuid';
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
}

// UI elements
const status = document.getElementById('status')
const output = document.getElementById('output')
output.textContent = ''

document.addEventListener('DOMContentLoaded', async () => {
	const key = getParameter('key');
	if (key) {
		let instanceId = localStorage.getItem('wasmpeer_' + key);
		if (!instanceId) {
			instanceId = uuidv4();
			localStorage.setItem('wasmpeer_' + key, instanceId);
		}
		status.innerText = 'wasmpeer starting...';
		const log = (txt) => {
			output.textContent += `${txt.trim()}\n`
		}

		const wasmpeer = await Wasmpeer.buildBrowser(instanceId, {
			log,
			..._config
		});
		status.innerText = 'wasmpeer started!'

		window.wasmpeer = wasmpeer;
	} else {
		let btn = document.createElement("button");
		btn.innerHTML = "Create new Instance";
		btn.onclick = () => {
			window.location.href = window.location.origin + '?key=' + uuidv4();
		}
		document.body.appendChild(btn);
	}
});

const getParameter = (parameterName) => {
	let result = null;
	let tmp = [];
	let items = location.search.substr(1).split('&');
	for (let index = 0; index < items.length; index++) {
		tmp = items[index].split('=');
		if (tmp[0] === parameterName) {
			result = tmp[1];
		}
	}
	return result;
}