'use strict'
import Wasmpeer from '../../src/index.js';

// #region logger

const $logs = document.querySelector('#logs')

const logTo = (msg, type) => {
	type = type || 'INFO'
	const timeFormat = (new Date()).toISOString().split('T')[1].split('.')[0]
	$logs.innerHTML = `${timeFormat} [${type}] ${msg}<br />${$logs.innerHTML.trimEnd()}`
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

console.log = logTo;
console.warn = logTo;
console.error = logTo;

// #endregion

const startApplication = async () => {
	logTo('Initiate')

	const wasmpeer = await Wasmpeer.buildBrowser({ logger: console });

	const $nodeId = document.querySelector('.node-id')
	$nodeId.innerText = await wasmpeer.instanceId;

	document.querySelectorAll('.disabled').forEach(el => { el.classList.remove('disabled') })

	window.wasmpeer = wasmpeer;

	// #region executor
	let selectedMeta
	let selectedKey

	const $executionForm = document.querySelector('#executionForm')
	const $targetField = document.querySelector('#serviceTarget')
	const $paramsContainer = document.querySelector('#serviceParams')
	const $idField = document.querySelector('#serviceId')
	const $nameField = document.querySelector('#serviceName')
	const $resultField = document.querySelector('#serviceResult')
	const $serviceInput = document.querySelector('#serviceInput')

	const $executeBtn = document.querySelector('#executeBtn')

	const $closeBtn = document.querySelector('#closeBtn')

	const execute = async () => {
		$resultField.innerHTML = 'Executing...'

		// REMARK: for advance parametering later
		/*
		const inputs = {}
		Object.keys(selectedMeta[selectedKey].paramsType).forEach(x => {
			const a = document.querySelector('#param_' + x)
			inputs[x] = a.value
		})
		*/
		let inputs = {}
		try {
			const raw = $serviceInput.value.trim()
			inputs = raw ? JSON.parse(raw) : {};
		}
		catch (err) {
			throw new Error('Input not in valid JSON format')
		}

		const res = await wasmpeer.invoke($idField.value.trim(), $targetField.value, inputs)

		$resultField.innerHTML = JSON.stringify(res, null, 4);
	}

	const populateParams = (key) => {
		if (Object.keys(selectedMeta[key].paramsType).length === 0) {
			$paramsContainer.style = 'display: none'
		} else {
			$paramsContainer.style = 'display: block'
		}

		// REMARK: for advance parametering later
		/*
		$paramsContainer.innerHTML = '';
		Objxect.keys(selectedMeta[key].paramsType).forEach(x => {
			const row = document.createElement('div')
			row.className = 'form-group mt-2'

			const label = document.createElement('label')
			label.for = 'param_' + x
			label.innerHTML = x

			const textarea = document.createElement('textarea')
			textarea.className = 'form-control'
			textarea.id = 'param_' + x

			row.insertBefore(textarea, row.firstChild)
			row.insertBefore(label, row.firstChild)

			$paramsContainer.insertBefore(row, $paramsContainer.firstChild)
		})
		*/
	}

	const resetExecutor = () => {
		$executionForm.style = 'display: none'
		$idField.value = ''
		$nameField.value = ''
		$targetField.innerHTML = ''
		$targetField.value = ''
		$serviceInput.value = ''
		$resultField.innerHTML = ''
	}

	const openService = async (hash) => {
		resetExecutor()
		$executionForm.style = 'display: block'

		const { meta } = await window.wasmpeer.manager.getService(hash)

		$nameField.value = meta._name
		$idField.value = hash

		$targetField.addEventListener('change', () => {
			populateParams($targetField.value)
		})

		let first = false;
		$targetField.innerHTML = ''
		Object.keys(meta).filter(x => !x.startsWith('_')).forEach(x => {
			const row = document.createElement('option')
			row.innerHTML = x
			row.value = x
			if (!first) {
				row.selected = true
				selectedKey = x
				first = true
			}
			$targetField.insertBefore(row, $targetField.firstChild)
		})

		$targetField.value = selectedKey
		selectedMeta = meta

		populateParams(selectedKey)
	}

	$executeBtn.addEventListener('click', execute)

	$closeBtn.addEventListener('click', () => {
		resetExecutor()
	})
	// #endregion



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
					openService(x.hash)
				}
				link.className = 'btn btn-primary btn-sm'
				link.innerHTML = '>';
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
