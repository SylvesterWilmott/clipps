'use strict'

const { clipboard } = require('electron')
const events = require('events')
const event = new events.EventEmitter()
const sanitizeHtml = require('sanitize-html')

let suspend = false
let interval
let previousText = clipboard.readText()

function handleChange () {
  const newText = clipboard.readText()

  if (newText && isDiffText(previousText, newText)) {
    const HTML = clipboard.readHTML()
    const RTF = clipboard.readRTF()

    const cleanHTML = sanitizeHtml(HTML, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: {
        a: ['href']
      }
    })

    if (!suspend) {
      event.emit('clipboardTextChange', {
        text: newText,
        html: cleanHTML,
        rtf: RTF
      })
    } else {
      event.emit('clipboardChangeInternal')
    }

    previousText = newText
  }
}

function isDiffText (str1, str2) {
  if (str1 !== str2) return true
  return false
}

function startWatching () {
  if (!interval) {
    interval = setInterval(handleChange, 500)
  }
}

function stopWatching () {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function writeToClipboard (result) {
  suspend = true
  clipboard.write(result)
}

event.on('clipboardChangeInternal', function () {
  suspend = false
})

module.exports = {
  startWatching,
  stopWatching,
  writeToClipboard,
  event
}
