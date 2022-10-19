const CONTENT_SCRIPT_PATH = './js/content.js'
// const RUN_URL = 'https://app.checklyhq.com/checks/new/browser'
// const DOCS_URL = 'https://www.checklyhq.com/docs/haibun-browser-extension'
// const SIGNUP_URL = 'https://www.checklyhq.com/product/synthetic-monitoring/?utm_source=Chrome+Extension&utm_medium=Headless+Recorder+Chrome+Extension&utm_campaign=Headless+Recorder&utm_id=Open+Source'
type TTabWithId = chrome.tabs.Tab & { id: number };

export default {
  async getActiveTab(): Promise<TTabWithId> {
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('getActiveTab queryOptions', tab);
    return <TTabWithId>tab[0];
  },

  async sendTabMessage({ action, value = undefined, clean = undefined }: { action: string, value?: any, clean?: undefined | boolean }) {
    const { id: tabId } = await this.getActiveTab()
    chrome.tabs.sendMessage(tabId, { action, value, clean })
  },

  async injectContentScript() {
    const { id: tabId } = await this.getActiveTab();
    const b = await chrome.scripting.executeScript(<any>{
      target: { tabId },
      // allFrames: true,
      injectImmediately: true,
      files: [CONTENT_SCRIPT_PATH]
    }, (injectionResult) => console.log('es', injectionResult));
    console.log('injectContentScript tab.id', tabId, b);

    // return new Promise(function (resolve) {
    //   chrome.tabs.executeScript({ file: CONTENT_SCRIPT_PATH, allFrames: false }, res => {
    //     console.log('moo');

    //     resolve(res)
    //   })
    // })
  },

  copyToClipboard(text: string) {
    return (navigator.permissions.query as any)({ name: 'clipboard-write' }).then((result: any) => {
      if (result.state !== 'granted' && result.state !== 'prompt') {
        return Promise.reject()
      }

      navigator.clipboard.writeText(text)
    })
  },

  /*
  getBackgroundConnector() {
    return chrome.runtime.connect({ name: 'recordControls' })
  },

  getChecklyCookie() {
    return new Promise(function (resolve) {
      chrome.cookies.getAll({}, res =>
        resolve(res.find(cookie => cookie.name.startsWith('checkly_has_account')))
      )
    })
  },

  openOptionsPage() {
    chrome.runtime.openOptionsPage?.()
  },

  openHelpPage() {
    chrome.tabs.create({ url: DOCS_URL })
  },

  openChecklyRunner({ code, runner, isLoggedIn }: any) {
    if (!isLoggedIn) {
      chrome.tabs.create({ url: SIGNUP_URL })
      return
    }

    const script = encodeURIComponent(btoa(code))
    const url = `${RUN_URL}?framework=${runner}&script=${script}`
    chrome.tabs.create({ url })
  },
  */
}
