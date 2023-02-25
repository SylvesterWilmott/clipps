'use strict'

const { app, Menu, Tray, nativeImage } = require('electron')

const path = require('path')
const Store = require('electron-store')
const { autoUpdater } = require("electron-updater")
const watchClipboard = require(path.join(__dirname, 'watch-clipboard.js'))
const strings = require(path.join(__dirname, 'strings.js'))

const defaults = {
  pins: [],
  clips: [],
  pref_max_clips: 25,
  pref_open_at_login: true
}

const storage = new Store({ defaults })

let tray = null
let menu = null
const userPrefs = {}
const maxChars = 35 // Maximum number of chartacters for clip titles

app.on('ready', function () {
  app.dock.hide()
  getUserPrefs()
  setupTray()
  buildMenu()
  registerListeners()
  setupAppSettings()
  autoUpdater.checkForUpdatesAndNotify()
})

function getUserPrefs () {
  for (const key in defaults) {
    userPrefs[key] = storage.get(key)
  }
}

function setupTray () {
  tray = new Tray(path.join(__dirname, 'images/ic_Template.png'))
}

function buildMenu () {
  const menuTemplate = []

  const placeholderMenu = [
    {
      label: strings.NO_CLIPS,
      enabled: false
    }
  ]

  const pinsMenu = [
    {
      label: strings.PINNED,
      enabled: false
    },
    ...userPrefs.pins.map(getPinMenuItem),
    { type: 'separator' }
  ]

  const clipsMenu = [
    ...userPrefs.clips.map(getClipMenuItem),
    { type: 'separator' }
  ]

  const clearPinnedMenu = [
    {
      label: strings.CLEAR_PINNED,
      accelerator: 'Option+Command+Backspace',
      click: () => clearPinned()
    }
  ]

  const clearMenu = [
    {
      label: strings.CLEAR_CLIPS,
      accelerator: 'Command+Backspace',
      click: () => clearClips()
    }
  ]

  const preferencesMenu = [
    { type: 'separator' },
    {
      label: strings.PREFERENCES,
      submenu: [
        {
          label: strings.MAX_CLIPS,
          submenu: [
            {
              label: '25',
              type: 'radio',
              checked: true,
              id: 'pref_max_clips_25',
              click: (menuItem) =>
                storage.set('pref_max_clips', parseInt(menuItem.label))
            },
            {
              label: '50',
              type: 'radio',
              id: 'pref_max_clips_50',
              click: (menuItem) =>
                storage.set('pref_max_clips', parseInt(menuItem.label))
            },
            {
              label: '75',
              type: 'radio',
              id: 'pref_max_clips_75',
              click: (menuItem) =>
                storage.set('pref_max_clips', parseInt(menuItem.label))
            },
            {
              label: '100',
              type: 'radio',
              id: 'pref_max_clips_100',
              click: (menuItem) =>
                storage.set('pref_max_clips', parseInt(menuItem.label))
            },
            {
              label: '200',
              type: 'radio',
              id: 'pref_max_clips_200',
              click: (menuItem) =>
                storage.set('pref_max_clips', parseInt(menuItem.label))
            }
          ]
        },
        { type: 'separator' },
        {
          label: strings.OPEN_AT_LOGIN,
          id: 'pref_open_at_login',
          type: 'checkbox',
          checked: false,
          click: (menuItem) =>
            storage.set('pref_open_at_login', menuItem.checked)
        }
      ]
    },
    { type: 'separator' },
    {
      role: 'quit',
      label: strings.QUIT,
      accelerator: 'Command+Q'
    }
  ]

  const isClips = userPrefs.clips.length > 0
  const isPins = userPrefs.pins.length > 0

  if (isPins) menuTemplate.push(pinsMenu)
  if (!isClips) menuTemplate.push(placeholderMenu)
  if (isClips) menuTemplate.push(clipsMenu)
  if (isPins) menuTemplate.push(clearPinnedMenu)
  if (isClips) menuTemplate.push(clearMenu)

  menuTemplate.push(preferencesMenu)

  const finalTemplate = Array.prototype.concat(...menuTemplate)

  menu = Menu.buildFromTemplate(finalTemplate)
  tray.setContextMenu(menu)

  loadPreferences()
}

function loadPreferences () {
  const maxClipsMap = {
    25: 'pref_max_clips_25',
    50: 'pref_max_clips_50',
    75: 'pref_max_clips_75',
    100: 'pref_max_clips_100',
    200: 'pref_max_clips_200'
  }

  menu.getMenuItemById(maxClipsMap[userPrefs.pref_max_clips]).checked = true
  menu.getMenuItemById('pref_open_at_login').checked =
    userPrefs.pref_open_at_login
}

function getClipMenuItem (obj, i) {
  const menuItem = {
    label: obj.title,
    toolTip: obj.text,
    click: (menuItem, win, e) => {
      const writableUnformatted = { text: obj.text }
      const writableFormatted = { text: obj.text }

      if ('html' in obj) {
        writableFormatted.html = obj.html
      } else if ('rtf' in obj) {
        writableFormatted.rtf = obj.rtf
      }

      if (e.shiftKey) {
        addToPins(i)
      } else if (e.altKey) {
        watchClipboard.writeToClipboard(writableUnformatted)
      } else {
        watchClipboard.writeToClipboard(writableFormatted)
      }
    }
  }

  // Apply accelerators to the first 10 items (0-9)
  if (i <= 10) {
    menuItem.accelerator = 'Command+' + i.toString()
  }

  return menuItem
}

function getPinMenuItem (obj, i) {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'images/ic_pin_Template.png')
  )

  const menuItem = {
    label: obj.title,
    toolTip: obj.text,
    icon,
    click: (menuItem, win, e) => {
      const writableUnformatted = { text: obj.text }
      const writableFormatted = { text: obj.text }

      if ('html' in obj) {
        writableFormatted.html = obj.html
      } else if ('rtf' in obj) {
        writableFormatted.rtf = obj.rtf
      }

      if (e.shiftKey) {
        removeFromPins(i)
      } else if (e.altKey) {
        watchClipboard.writeToClipboard(writableUnformatted)
      } else {
        watchClipboard.writeToClipboard(writableFormatted)
      }
    }
  }

  // Apply accelerators to the first 10 items (0-9)
  if (i <= 10) {
    menuItem.accelerator = 'Option+Command+' + i.toString()
  }

  return menuItem
}

function addToPins (i) {
  if (i > -1) {
    const updatedPins = [...userPrefs.pins]
    updatedPins.unshift(userPrefs.clips[i])
    storage.set('pins', updatedPins)
  }
}

function removeFromPins (i) {
  if (i > -1) {
    const updatedPins = [...userPrefs.pins]
    updatedPins.splice(i, 1)
    storage.set('pins', updatedPins)
  }
}

function registerListeners () {
  watchClipboard.startWatching()

  watchClipboard.event.on('clipboardTextChange', (result) => {
    if (!result.text) return

    const truncated = truncate(result.text)

    const clip = { title: truncated, text: result.text }

    if ('html' in result) {
      clip.html = result.html
    } else if ('rtf' in result) {
      clip.rtf = result.rtf
    }

    const updatedClips = [...userPrefs.clips]
    updatedClips.unshift(clip)
    storage.set('clips', updatedClips)
  })

  storage.onDidAnyChange((result) => {
    for (const key in defaults) {
      userPrefs[key] = result[key]
    }
  })

  storage.onDidChange('pins', () => {
    buildMenu()
  })

  storage.onDidChange('clips', () => {
    pruneClips(userPrefs.pref_max_clips)
    buildMenu()
  })

  storage.onDidChange('pref_max_clips', (n) => {
    pruneClips(n)
  })

  storage.onDidChange('pref_open_at_login', (status) => {
    setLoginSettings(status)
  })
}

function truncate (str) {
  const trimmed = str.trim()
  return trimmed.length > maxChars
    ? `${trimmed.slice(0, maxChars)}...`
    : trimmed
}

function pruneClips (n) {
  let wasPruned = false
  let pruned = [...userPrefs.clips]

  // Remove adjacent duplicate clips
  let p

  pruned = pruned.filter((x) => {
    if (x.text === p) {
      wasPruned = true
      return false
    }

    p = x.text

    return true
  })

  // If the number of clips exceeds the maximum, set the length of the array to the maximum
  if (pruned.length > n) {
    pruned.length = n
    wasPruned = true
  }

  if (wasPruned) {
    userPrefs.clips = [...pruned]
    storage.set('clips', pruned)
  }
}

function clearClips () {
  const updatedClips = []
  storage.set('clips', updatedClips)
}

function clearPinned () {
  const updatePins = []
  storage.set('pins', updatePins)
}

function setupAppSettings () {
  const openAtLoginStatus = app.getLoginItemSettings().openAtLogin

  if (openAtLoginStatus !== userPrefs.pref_open_at_login) {
    setLoginSettings(userPrefs.pref_open_at_login)
  }
}

function setLoginSettings (status) {
  app.setLoginItemSettings({
    openAtLogin: status
  })
}
