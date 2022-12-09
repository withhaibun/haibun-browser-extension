import browser from '../services/browser'
import { popupActions, recordingControls } from '../services/constants'
import { LoggerWebSocketsClient } from "@haibun/context/build/websocket-client/LoggerWebSocketsClient";
import { TWithContext } from '@haibun/context/build/Context'
import AbstractBackground from './AbstractBackground'

export default class Background extends AbstractBackground {
  constructor(logger: LoggerWebSocketsClient) {
    super(logger);
  }

  async startRecording(toTabIndex: undefined | number) {
    super.startRecording(toTabIndex);
    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, function (tab) {
        console.log(':::', tab);
      });
    });
    chrome.webNavigation.onBeforeNavigate.addListener(this._boundWaitHandler)
    chrome.webNavigation.onCompleted.addListener(async (what) => {
      this._boundNavigationHandler(what);
      const where = await chrome.tabs.query({ active: true, currentWindow: true });
      await this.injectContentScript('webNavigation.onComplete', where[0].id!);
    });

    const { url } = (await browser.getActiveTab());
    this.logger.log('startRecording', <TWithContext>{ '@context': '#haibun/control', 'control': 'startRecording', href: url });
  }
  async recordCurrentUrl(href: string) {
    if (!this._handledGoto) {
      this.logger.log('recordCurrentUrl', <TWithContext>{ '@context': '#haibun/control', 'control': 'recordCurrentUrl', href });
      this._handledGoto = true
    }
  }

  async recordCurrentViewportSize(value: { width: number, height: number }) {
    if (!this._handledViewPortSize) {
      this.logger.log('viewportSize', <TWithContext>{ '@context': '#haibun/control', 'control': 'viewportSize', value });
      this._handledViewPortSize = true
    }
  }

  async recordNavigation() {
    this.logger.log('navigation', <TWithContext>{ '@context': '#haibun/control', 'control': 'navigation' });
  }

  handleRecordingMessage({ control, href, value, coordinates }: any) {
    if (control === recordingControls.EVENT_RECORDER_STARTED) {
      this.badge.setText(this._badgeState)
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
      this.logger.log('stopRecording', <TWithContext>{ '@context': '#haibun/control', 'control': 'stopRecording' });
      this.stop()
    } else {
      this.logger.log('handlePopupMessage', msg);
    }
  }

  async handleNavigation({ frameId }: any) {
    console.log('navigatoin', frameId);

    // await browser.injectContentScript()
    // this.toggleOverlay({ open: true, pause: this._isPaused })

    if (frameId === 0) {
      this.recordNavigation();
    }
  }
}
