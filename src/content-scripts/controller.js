import { overlayActions } from '@/modules/overlay/constants'
import { popupActions, recordingControls, isDarkMode } from '@/services/constants'

import storage from '@/services/storage'
import browser from '@/services/browser'

import Capture from '@/modules/capture'

export default class HeadlessController {
  constructor({ overlay, recorder, store }) {
    this.backgroundListener = null

    this.store = store
    this.capture = null
    this.overlay = overlay
    this.recorder = recorder
  }

  async init() {
    const { options } = await storage.get(['options'])

    const darkMode = options && options.extension ? options.extension.darkMode : isDarkMode()
    const { dataAttribute } = options ? options.code : {}

    this.store.commit('setDarkMode', darkMode)
    this.store.commit('setDataAttribute', dataAttribute)

    this.recorder.init(() => this.listenBackgroundMessages())
  }

  listenBackgroundMessages() {
    this.backgroundListener = this.backgroundListener || this.handleBackgroundMessages.bind(this)
    chrome.runtime.onMessage.addListener(this.backgroundListener)
  }

  async handleBackgroundMessages(msg) {
    if (!msg?.action) {
      return
    }

    switch (msg.action) {
      case overlayActions.TOGGLE_SCREENSHOT_MODE:
        this.handleScreenshot(false)
        break

      case overlayActions.TOGGLE_SCREENSHOT_CLIPPED_MODE:
        this.handleScreenshot(true)
        break

      case overlayActions.CLOSE_SCREENSHOT_MODE:
        this.cancelScreenshot()
        break

      case overlayActions.TOGGLE_OVERLAY:
        msg?.value?.open ? this.overlay.mount(msg.value) : this.overlay.unmount()
        break

      case popupActions.STOP:
        this.store.commit('close')
        break

      case popupActions.PAUSE:
        this.store.commit('pause')
        break

      case popupActions.UN_PAUSE:
        this.store.commit('unpause')
        break

      case 'CODE':
        console.log('moo', msg.value)
        await browser.copyToClipboard(msg.value)
        this.store.commit('showCopy')
        break
    }
  }

  handleScreenshot(isClipped) {
    this.recorder.disableClickRecording()
    this.capture = new Capture({ isClipped, store: this.store })

    this.capture.addCameraIcon()

    this.store.state.screenshotMode
      ? this.capture.startScreenshotMode()
      : this.capture.stopScreenshotMode()

    this.capture.on('click', ({ selector }) => {
      this.store.commit('stopScreenshotMode')

      this.capture.showScreenshotEffect()
      this.recorder._sendMessage({ control: recordingControls.GET_SCREENSHOT, value: selector })
      this.recorder.enableClickRecording()
    })
  }

  cancelScreenshot() {
    if (!this.store.state.screenshotMode) {
      return
    }

    this.store.commit('stopScreenshotMode')
    this.recorder.enableClickRecording()
  }
}
