import getSelector from '../../services/selector'
import { recordingControls } from '../../services/constants'
import { overlaySelectors } from '../overlay/constants'
import { eventsToRecord } from '../code-generator/constants'
import { Store } from '../../services/Store';


declare global {
  interface Window { pptRecorderAddedControlListeners: any; }
  interface Document { pptRecorderAddedControlListeners: any; }
}


export default class Recorder {
  _eventLog: any[]
  _previousEvent: any
  _isTopFrame: boolean
  _isRecordingClicks: boolean
  store: Store
  constructor({ store }: any) {
    // this._boundedMessageListener = null
    this._eventLog = []
    this._previousEvent = null

    this._isTopFrame = window.location === window.parent.location
    this._isRecordingClicks = true

    this.store = store
  }

  init(cb?: () => void) {
    const events = Object.values(eventsToRecord)

    if (!window.pptRecorderAddedControlListeners) {
      this._addAllListeners(events)
      cb && cb();
      window.pptRecorderAddedControlListeners = true
    }

    if (!window.document.pptRecorderAddedControlListeners && chrome.runtime?.onMessage) {
      window.document.pptRecorderAddedControlListeners = true
    }

    if (this._isTopFrame) {
      this._sendMessage({ control: recordingControls.EVENT_RECORDER_STARTED })
      this._sendMessage({ control: recordingControls.GET_CURRENT_URL, href: window.location.href })
      this._sendMessage({
        control: recordingControls.GET_VIEWPORT_SIZE,
        coordinates: { width: window.innerWidth, height: window.innerHeight },
      })
    }
    return this;
  }

  _addAllListeners(events: any) {
    const boundedRecordEvent = this._recordEvent.bind(this)
    events.forEach((type: any) => window.addEventListener(type, boundedRecordEvent, true));
  }

  _sendMessage(msg: any) {
    // filter messages based on enabled / disabled features
    if (msg.action === 'click' && !this._isRecordingClicks) {
      return;
    }

    try {
      chrome.runtime.sendMessage(msg);
    } catch (err) {
      console.debug('caught error', err)
    }
  }

  _recordEvent(e: any) {
    if (this._previousEvent && this._previousEvent.timeStamp === e.timeStamp) {
      return
    }
    this._previousEvent = e

    // we explicitly catch any errors and swallow them, as none node-type events are also ingested.
    // for these events we cannot generate selectors, which is OK
    try {
      const selector = getSelector(e, { dataAttribute: this.store.state.dataAttribute })

      if (selector.includes('#' + overlaySelectors.OVERLAY_ID)) {
        return
      }

      this.store.commit('showRecorded')

      this._sendMessage({
        selector,
        value: e.target.value,
        tagName: e.target.tagName,
        action: e.type,
        keyCode: e.keyCode ? e.keyCode : null,
        href: e.target.href ? e.target.href : null,
        coordinates: Recorder._getCoordinates(e),
      })
    } catch (err) {
      console.error(err)
    }
  }

  _getEventLog() {
    return this._eventLog
  }

  _clearEventLog() {
    this._eventLog = []
  }

  disableClickRecording() {
    this._isRecordingClicks = false
  }

  enableClickRecording() {
    this._isRecordingClicks = true
  }

  static _getCoordinates(evt: any) {
    const eventsWithCoordinates: any = {
      mouseup: true,
      mousedown: true,
      mousemove: true,
      mouseover: true,
    }

    return eventsWithCoordinates[evt.type] ? { x: evt.clientX, y: evt.clientY } : null
  }
}
