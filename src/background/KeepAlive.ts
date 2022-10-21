// https://www.youtube.com/watch?v=xlJddufkgJg

import { ILoggerKeepAlive } from "@haibun/core/build/lib/interfaces/logger";

export class KeepAlive implements ILoggerKeepAlive {
    lifeline: chrome.runtime.Port | undefined;
    async start() {
        this.keepAlive();

        chrome.runtime.onConnect.addListener(port => {
            if (port.name === 'keepAlive') {
                this.lifeline = port;
                setTimeout(this.keepAliveForced, 295e3); // 5 minutes minus 5 seconds
                port.onDisconnect.addListener(this.keepAliveForced);
            }
        });
    }
    async stop() {

    }

    keepAliveForced() {
        this.lifeline?.disconnect();
        this.lifeline = undefined;
        this.keepAlive();
    }

    async keepAlive() {
        if (this.lifeline) return;
        for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id! },
                    func: () => chrome.runtime.connect({ name: 'keepAlive' }),
                });
                chrome.tabs.onUpdated.removeListener(this.retryOnTabUpdate);
                return;
            } catch (e) { }
        }
        chrome.tabs.onUpdated.addListener(this.retryOnTabUpdate);
    }

    async retryOnTabUpdate(tabId: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
        if (info.url && /^(file|https?):/.test(info.url)) {
            this.keepAlive();
        }
    }
}