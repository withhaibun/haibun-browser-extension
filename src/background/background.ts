import Badge from '../services/badge'
import browser from '../services/browser'
import storage from '../services/storage'
import { popupActions, recordingControls } from '../services/constants'
// import { overlayActions } from '../modules/overlay/constants'
import { headlessActions } from '../modules/code-generator/constants'
import CodeGenerator from '../modules/code-generator/index';
import { IConnectedLogger } from '@haibun/core/build/lib/interfaces/logger';
import { LoggerWebSocketsClient } from '.'
import { TWithContext } from '@haibun/context/build/Context'

const badge = new Badge();

export default class Background {
  private _recording: any[]
  private _boundedMessageHandler: any
  private _boundedNavigationHandler: any
  private _boundedWaitHandler: any
  // overlayHandler: any
  private _badgeState: string
  private _isPaused: boolean
  private _handledGoto: boolean
  private _handledViewPortSize: boolean
  logger: LoggerWebSocketsClient;

  constructor(logger: LoggerWebSocketsClient) {
    this.logger = logger;
    this._recording = []
    this._boundedMessageHandler = null
    this._boundedNavigationHandler = null
    this._boundedWaitHandler = null

    // this.overlayHandler = null

    this._badgeState = ''
    this._isPaused = false

    // Some events are sent double on page navigations to simplify the event recorder.
    // We keep some simple state to disregard events if needed.
    this._handledGoto = false
    this._handledViewPortSize = false
  }

  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => this.handlePopupMessage(request));
    console.log('init');
  }

  async startRecording(toTabIndex: undefined | number) {
    await this.cleanUp()
    await this.logger.connect();

    this._badgeState = ''
    this._handledGoto = false
    this._handledViewPortSize = false

    let switchId = undefined;
    if (toTabIndex) {
      switchId = (await chrome.tabs.query({ index: toTabIndex, }))[0]?.id;
      await browser.injectContentScript(switchId);
      chrome.tabs.update(switchId!, { active: true });
      console.log(`injected and switched to ${switchId}`);
    } else {
      await browser.injectContentScript();
      console.log('injected');
    }

    // this.toggleOverlay({ open: true, clear: true })

    this._boundedMessageHandler = this.handleMessage.bind(this)
    this._boundedNavigationHandler = this.handleNavigation.bind(this)
    this._boundedWaitHandler = () => badge.wait()

    // this.overlayHandler = this.handleOverlayMessage.bind(this)

    // chrome.runtime.onMessage.addListener(this._boundedMessageHandler)
    // chrome.runtime.onMessage.addListener(this.overlayHandler)

    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, function (tab) {
        console.log(':::', tab);
      });
    });
    chrome.webNavigation.onBeforeNavigate.addListener(this._boundedWaitHandler)
    chrome.webNavigation.onCompleted.addListener((what) => {
      this._boundedNavigationHandler(what);
      console.log('xal1', what)
      chrome.tabs.query({ active: true, currentWindow: true }, (where) => {
        console.log('xal', what, where)
      });
    });

    badge.start()
    this.logger.log('startRecording', <TWithContext>{ '@context': '#ambe/control', 'control': 'startRecording' });
  }

  async stop() {
    await this.logger.disconnect();
    this._badgeState = this._recording.length > 0 ? '1' : ''

    chrome.runtime.onMessage.removeListener(this._boundedMessageHandler)
    chrome.webNavigation.onCompleted.removeListener(this._boundedNavigationHandler)
    chrome.webNavigation.onBeforeNavigate.removeListener(this._boundedWaitHandler)

    badge.stop(this._badgeState)

    storage.set({ recording: this._recording })
  }

  pause() {
    badge.pause()
    this._isPaused = true
  }

  unPause() {
    badge.start()
    this._isPaused = false
  }

  cleanUp() {
    this._recording = []
    this._isPaused = false
    badge.reset()

    return new Promise(function (resolve) {
      chrome.storage.local.remove('recording', () => resolve(true))
    })
  }

  recordCurrentUrl(href: string) {
    if (!this._handledGoto) {
      this.handleMessage({
        selector: undefined,
        value: undefined,
        action: headlessActions.GOTO,
        href,
      })
      this._handledGoto = true
    }
  }

  recordCurrentViewportSize(value: { width: number, height: number }) {
    if (!this._handledViewPortSize) {
      this.handleMessage({
        selector: undefined,
        value,
        action: headlessActions.VIEWPORT,
      })
      this._handledViewPortSize = true
    }
  }

  recordNavigation() {
    this.handleMessage({
      selector: undefined,
      value: undefined,
      action: headlessActions.NAVIGATION,
    })
  }

  /*
  recordScreenshot(value: any) {
    this.handleMessage({
      selector: undefined,
      value,
      action: headlessActions.SCREENSHOT,
    })
  }
  */

  handleMessage(msg: any, sender?: any) {
    if (msg.control) {
      return this.handleRecordingMessage(msg /*, sender*/)
    }

    /*
    if (msg.type === 'SIGN_CONNECT') {
      return
    }
    */

    // NOTE: To account for clicks etc. we need to record the frameId
    // and url to later target the frame in playback
    msg.frameId = sender?.frameId;
    msg.frameUrl = sender?.url;

    if (!this._isPaused) {
      // this.logger.log('handleMessage', msg);
      // this._recording.push(msg)
      // storage.set({ recording: this._recording })
    }
  }

  /*
  async handleOverlayMessage({ control }: any) {
    if (!control) {
      return
    }
 
    if (control === overlayActions.RESTART) {
      chrome.storage.local.set({ restart: true })
      chrome.storage.local.set({ clear: false })
      chrome.runtime.onMessage.removeListener(this.overlayHandler)
      this.stop()
      this.cleanUp()
      this.startRecording()
    }
 
    if (control === overlayActions.CLOSE) {
      this.toggleOverlay()
      chrome.runtime.onMessage.removeListener(this.overlayHandler)
    }
 
    if (control === overlayActions.COPY) {
      const options = (await storage.get('options'))?.options || {};
      const generator = new CodeGenerator(options)
      const code = generator.generate(this._recording)
 
      browser.sendTabMessage({
        action: 'CODE',
        value: code.haibun
      })
    }
 
    if (control === overlayActions.STOP) {
      chrome.storage.local.set({ clear: true })
      chrome.storage.local.set({ pause: false })
      chrome.storage.local.set({ restart: false })
      this.stop()
    }
 
    if (control === overlayActions.UNPAUSE) {
      chrome.storage.local.set({ pause: false })
      this.unPause()
    }
 
    if (control === overlayActions.PAUSE) {
      chrome.storage.local.set({ pause: true })
      this.pause()
    }
 
    // TODO: the next 3 events do not need to be listened in background
    // content script controller, should be able to handle that directly from overlay
    if (control === overlayActions.CLIPPED_SCREENSHOT) {
      browser.sendTabMessage({ action: overlayActions.TOGGLE_SCREENSHOT_CLIPPED_MODE })
    }
 
    if (control === overlayActions.FULL_SCREENSHOT) {
      browser.sendTabMessage({ action: overlayActions.TOGGLE_SCREENSHOT_MODE })
    }
 
    if (control === overlayActions.ABORT_SCREENSHOT) {
      browser.sendTabMessage({ action: overlayActions.CLOSE_SCREENSHOT_MODE })
    }
  }
  */

  handleRecordingMessage({ control, href, value, coordinates }: any) {
    if (control === recordingControls.EVENT_RECORDER_STARTED) {
      badge.setText(this._badgeState)
    }

    if (control === recordingControls.GET_VIEWPORT_SIZE) {
      this.recordCurrentViewportSize(coordinates)
    }

    if (control === recordingControls.GET_CURRENT_URL) {
      this.recordCurrentUrl(href)
    }

    /*
    if (control === recordingControls.GET_SCREENSHOT) {
      this.recordScreenshot(value)
    }
    */
  }

  handlePopupMessage(msg: any) {
    console.log('\n\n________\nMESSAGE', msg);

    if (!msg.action) {
      return;
    }

    if (msg.action === popupActions.START_RECORDING) {
      this.startRecording(msg.payload ? parseInt(msg.payload, 10) : undefined)
    } else if (msg.action === popupActions.STOP_RECORDING) {
      browser.sendTabMessage({ action: popupActions.STOP_RECORDING })
      this.stop()
    } else {
      this.logger.log('handlePopupMessage', msg);
    }
  }

  async handleNavigation({ frameId }: any) {
    // await browser.injectContentScript()
    // this.toggleOverlay({ open: true, pause: this._isPaused })

    if (frameId === 0) {
      this.recordNavigation()
    }
  }

  /*
  // TODO: Use a better naming convention for this arguments
  toggleOverlay({ open = false, clear = false, pause = false } = {}) {
    browser.sendTabMessage({ action: overlayActions.TOGGLE_OVERLAY, value: { open, clear, pause } })
  }
  */
}
