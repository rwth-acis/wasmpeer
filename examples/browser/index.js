'use strict'
import Wasmpeer from '../../src/index.js';

// #region logger

const $logs = document.querySelector('#logs')

const logTo = (msg, type) => {
	type = type || 'INFO'
	const timeFormat = (new Date()).toISOString().split('T')[1].split('.')[0]
	$logs.innerHTML = `${$logs.innerHTML.trimEnd()}${timeFormat} [${type}] ${msg}<br />`
}

const onError = (err) => {
	console.log(err)
	let msg = 'An error occured, check the dev console'

	if (err.stack !== undefined) {
		msg = err.stack
	} else if (typeof err === 'string') {
		msg = err
	}

	logTo(msg, 'ERROR');
}

window.onerror = onError

// console.log = logTo;
// console.warn = logTo;
// console.error = logTo;

// #endregion

const startApplication = async () => {
	logTo('Initiate')

	const wasmpeer = await Wasmpeer.buildBrowser({ logger: console });

	const $nodeId = document.querySelector('.node-id')
	$nodeId.innerText = await wasmpeer.instanceId;

	document.querySelectorAll('button:disabled').forEach(b => { b.disabled = false })
	document.querySelectorAll('input:disabled').forEach(b => { b.disabled = false })
	document.querySelectorAll('.disabled').forEach(el => { el.classList.remove('disabled') })

	window.wasmpeer = wasmpeer;

	// #region uploader
	const $uploadForm = document.querySelector('#uploadForm')

	const $uploadBtn = document.querySelector('#uploadBtn')
	const $cancelBtn = document.querySelector('#cancelBtn')
	const $submitBtn = document.querySelector('#submitBtn')

	const $sourceContainer = document.querySelector('#service-upload')
	const $metaContainer = document.querySelector('#meta-upload')

	const readFile = (file) => {
		return new Promise((resolve, reject) => {
			var fr = new FileReader();
			fr.onload = () => {
				resolve(fr.result)
			};
			fr.onerror = reject;
			fr.readAsText(file);
		});
	}

	const openForm = () => {
		$uploadForm.style = 'display: block'
		$uploadBtn.style = 'display: none'
	}

	const closeForm = () => {
		$uploadForm.style = 'display: none'
		$uploadBtn.style = 'display: block'
	}

	const submitForm = async (e) => {
		try {
			e.preventDefault()
			$submitBtn.disabled = true

			const serviceSource = $sourceContainer.files[0]
			const serviceMeta = $metaContainer.files[0]
			const serviceMetaContent = await readFile(serviceMeta)

			await window.wasmpeer.manager.storeServiceTsd(serviceSource.name, serviceSource, null, serviceMetaContent)
			logTo('Successful adding service: ' + serviceSource.name)

			$submitBtn.disabled = false
			closeForm()
		}
		catch (err) {
			logTo('Failed adding service: ' + err.message)
		}
	}

	$submitBtn.addEventListener('click', submitForm)
	$uploadBtn.addEventListener('click', openForm)
	$cancelBtn.addEventListener('click', closeForm)

	// #endregion

	// #region service list

	const $serviceTable = document.querySelector('#serviceTable tbody')

	let existingServices = []

	const refreshHTMLServiceList = () => {
		$serviceTable.innerHTML = '';
		const groups = [...new Set(existingServices.map(x => x.owner))];
		groups.forEach(key => {
			const groupRow = document.createElement('tr')
			const groupCell = document.createElement('td')
			groupCell.colSpan = 2
			groupCell.innerHTML = key || 'LOCAL'
			groupCell.style = "background-color: grey"
			groupRow.appendChild(groupCell)

			existingServices.filter(x => x.owner === key).forEach(x => {
				const nameCell = document.createElement('td')
				nameCell.innerHTML = x.name

				const hashCell = document.createElement('td')
				hashCell.innerHTML = x.hash

				const downloadCell = document.createElement('td')
				const link = document.createElement('button')
				link.onclick = async function () {
					const aa = await window.wasmpeer.invoke(x.hash, 'list', {})
					console.log(aa)
				}
				downloadCell.appendChild(link)

				const row = document.createElement('tr')
				row.appendChild(nameCell)
				row.appendChild(downloadCell)
				$serviceTable.insertBefore(row, $serviceTable.firstChild)
			});
			$serviceTable.insertBefore(groupRow, $serviceTable.firstChild)
		})

	}

	const reloadServices = () => {
		const services = window.wasmpeer.manager.getAvailableServices();

		const toBeAdd = services.filter(x => !existingServices.includes(x))
		const toBeRemoved = existingServices.filter(x => !services.includes(x))

		if (toBeAdd.length === 0 && toBeRemoved.length === 0) {
			return;
		}

		toBeAdd.forEach(x => logTo('Found new service: ' + x.name))
		toBeRemoved.forEach(x => logTo('Remove service: ' + x.name))

		existingServices = services

		refreshHTMLServiceList()
	}

	setInterval(async () => {
		try {
			reloadServices()
		} catch (err) {
			err.message = `Failed to publish the service list: ${err.message}`
		}
	}, 5000)
	// #endregion

	// #region peer list
	const $workspacePeersList = document.querySelector('#peers')

	let existingPeers = []

	const refreshHTMLPeerList = () => {
		const peersAsHtml = existingPeers
			.reverse()
			.map((addr) => `<li><pre style="overflow: visible; overflow-wrap: break-word; margin: 0px">${addr}</pre></li>`)
			.join('')

		$workspacePeersList.innerHTML = peersAsHtml
	}

	const reloadPeers = async () => {
		const peers = await window.wasmpeer.communicator.getAvailablePeers()

		const toBeAdd = peers.filter(x => !existingPeers.includes(x))
		const toBeRemoved = existingPeers.filter(x => !peers.includes(x))

		if (toBeAdd.length === 0 && toBeRemoved.length === 0) {
			return;
		}

		toBeAdd.forEach(x => logTo('Found new peer: ' + x))
		toBeRemoved.forEach(x => logTo('Remove peer: ' + x))

		existingPeers = peers

		refreshHTMLPeerList()
	}

	setInterval(async () => {
		try {
			await reloadPeers();
		} catch (err) {
			err.message = `Failed to refresh the peer list: ${err.message}`
			onError(err)
		}
	}, 1000)
	// #endregion
}

startApplication()

// #region helper
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
// #endregion
