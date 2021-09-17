// import 'regenerator-runtime/runtime';
// import Communicator from './communicator';

// const urlMatcher = 'wasmpeer.org';

// // REMARK: will be auto-generated in every new browser instance
// const instanceId = 'f5e9de80-e9f2-4fcd-8ea0-2e089565ae9p';
// window.wasmpeer = new Communicator(instanceId);


import 'babel-polyfill';
import Connector from '../../src/core/connector';

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

  const log = (txt) => {
    output.textContent += `${txt.trim()}\n`
  }

  const connector = await Connector.build(null, {
    log,
    ..._config
  });
  status.innerText = 'wasmpeer started!'

  window.wasmpeer = connector;
});
