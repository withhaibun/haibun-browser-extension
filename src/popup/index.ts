import { popupActions } from '../services/constants';

const START = '▶';
const STOP = '■';

const btn = <HTMLButtonElement>document.getElementById('btn');

btn?.addEventListener('click', () => {
  if (btn.innerHTML === START) {
    btn.innerHTML = STOP;
    chrome.runtime.sendMessage({ action: popupActions.START_RECORDING });
  } else {
    btn.innerHTML = START;
    chrome.runtime.sendMessage({ action: popupActions.STOP_RECORDING });
  }
});
