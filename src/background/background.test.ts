import { popupActions } from '../services/constants';
import Background from './background';
import MockChrome  from '../mock-chrome/MockChrome';

declare global {
  interface Window { chrome: typeof chrome; }
}

const mockChrome = <typeof chrome>(new MockChrome() as unknown);
window.chrome = mockChrome;

let bg;

beforeEach(() => {
  // bg = new Background(new LoggerWebsocketsClient());
  // bg.init();
})

describe('pause', () => {
  it('pauses', () => {
    mockChrome.runtime.sendMessage({ action: popupActions.UN_PAUSE, stop })
  });
});

describe('startRecording', () => {
  it('starts recording', () => {
    mockChrome.runtime.sendMessage({ action: popupActions.START_RECORDING })
  });
});

describe('stop', () => {
  it('stops recording', () => {
    mockChrome.runtime.sendMessage({ action: popupActions.STOP_RECORDING })
    // await this.generateCode()
  });
});

describe('cleanup', () => {
  it('cleans up', () => {
    mockChrome.runtime.sendMessage({ action: popupActions.CLEAN_UP, value: stop })
  });
})