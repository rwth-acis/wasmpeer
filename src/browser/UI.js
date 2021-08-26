import 'regenerator-runtime/runtime';
export default class UI {
  static peerId(peerId) {
    document.getElementById('peerId').innerHTML = 'peer id: ' + peerId;
  }

  static peerTable(peers) {
    document.getElementById('peers').innerHTML = peers.map(x => '"' + x.key + '": ' + x.value).join('<br />');
  }

  static log(...args) {
    let text = '';
    args.forEach(x => {
      text += x + ' ' 
    });

    const timestamp = new Date();
    document.getElementById('log').innerHTML = document.getElementById('log').innerHTML + '<span><b>' + timestamp.toISOString() + '</b> ' + text + '</span><br />';
  }
}