'use strict'

import Wasmpeer from '../../src/index.js';

// import wasmString from 'url:../static/string/string.wasm';
// import wasmStringTypes from 'url:../static/issue/issue.wasm';
// import wasmIssue from 'url:../static/issue/issue.wasm';
// import wasmCalculator from 'url:../static/calculator/calculator.wasm';
// import wasmIssue from 'url:../static/issue/issue.wasm';

// Node
const $nodeId = document.querySelector('.node-id')
const $logs = document.querySelector('#logs')
// Peers
const $peers = document.querySelector('#peers')
const $workspacePeersList = $peers.querySelector('#workspace-peers')

const $fileHistory = document.querySelector('#file-history tbody')

const $allDisabledButtons = document.querySelectorAll('button:disabled')
const $allDisabledInputs = document.querySelectorAll('input:disabled')
const $allDisabledElements = document.querySelectorAll('.disabled')

let wasmpeer
let info

function onSuccess(msg) {
	$logs.classList.add('success')
	$logs.innerHTML = msg
}

function onError(err) {
	console.log(err)
	let msg = 'An error occured, check the dev console'

	if (err.stack !== undefined) {
		msg = err.stack
	} else if (typeof err === 'string') {
		msg = err
	}

	$logs.classList.remove('success')
	$logs.innerHTML = msg
}

window.onerror = onError

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

/* ===========================================================================
   Boot the app
   =========================================================================== */

const startApplication = async () => {
	const log = () => {};
	wasmpeer = await Wasmpeer.buildBrowser({
		log,
		// ..._config
	});

	info = await wasmpeer.instanceId;
	$nodeId.innerText = info.id
	$allDisabledButtons.forEach(b => { b.disabled = false })
	$allDisabledInputs.forEach(b => { b.disabled = false })
	$allDisabledElements.forEach(el => { el.classList.remove('disabled') })

	async function refreshWorkspacePeerList() {
		const peers = await wasmpeer.communicator.getAvailablePeers();
		const peersAsHtml = peers.reverse()
			.map((addr) => {
				return `<tr><td>${addr}</td></tr>`
			}).join('')
	
		$workspacePeersList.innerHTML = peersAsHtml
	}

	function appendFile(name, hash, size, data, messageSender) {
		const file = new window.Blob([data], { type: 'application/octet-binary' })
	
		const url = window.URL.createObjectURL(file)
		const row = document.createElement('tr')
	
		const nameCell = document.createElement('td')
		nameCell.innerHTML = name
	
		const peerIdCell = document.createElement('td')
		peerIdCell.innerHTML = messageSender
	
		const hashCell = document.createElement('td')
		hashCell.innerHTML = hash
	
		const sizeCell = document.createElement('td')
		sizeCell.innerText = size
	
		const downloadCell = document.createElement('td')
		const link = document.createElement('a')
		link.setAttribute('href', url)
		link.setAttribute('download', name)
		link.innerHTML = '<button class="table-action"></button>'
		downloadCell.appendChild(link)
	
		row.appendChild(peerIdCell)
		row.appendChild(nameCell)
		row.appendChild(hashCell)
		row.appendChild(sizeCell)
		row.appendChild(downloadCell)
	
		$fileHistory.insertBefore(row, $fileHistory.firstChild)
	}

	setInterval(async () => {
		try {
			await refreshWorkspacePeerList()
		} catch (err) {
			err.message = `Failed to refresh the workspace peer list: ${err.message}`
			onError(err)
		}
	}, 1000)

	setInterval(async () => {
		try {
			$fileHistory.innerHTML = ''
			const files = wasmpeer.manager.getAvailableServices();
			files.forEach(x => {
				appendFile(x.name, x.hash, x.size, x.data, x.messageSender);
			});
		} catch (err) {
			err.message = `Failed to publish the file list: ${err.message}`
		}
	}, 5000)

	window.wasmpeer = wasmpeer;

	// function bootstrap(manager) {
	// 	const path1 = wasmString;
	// 	const path2d = wasmString;
	// 	const filename = path1.replace(/^.*[\\\/]/, '')
	// 	const objCalc = await fetch(path1).then(resp => resp.arrayBuffer());
	// 	const objDCalc = await fetch(path1).then(resp => resp.arrayBuffer());
	// 	const idCalc = await manager.storeService(filename, objCalc, objDCalc);

	// 	const path2 = wasmCalculator;
	// 	const path2d = wasmCalculator;
	// 	const filename2 = path2.replace(/^.*[\\\/]/, '')
	// 	const objStr = await fetch(path2).then(resp => resp.arrayBuffer());
	// 	const objDStr = await fetch(path2).then(resp => resp.arrayBuffer());
	// 	const idStr = await manager.storeService(filename2, objStr, objDStr);
	// }	
}

startApplication()

