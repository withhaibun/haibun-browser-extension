import ContentController from './content-controller'
import { Store } from '../services/Store';
// // import Overlay from '@/modules/overlay'
import Recorder from '../modules/recorder'

declare global {
  interface Window { contentController: ContentController }
  interface Window { pptRecorderAddedControlListeners: any; }
}
wtw(this);
function wtw(t: any) {
  return new Promise((resolve, reject) => {

    document.body.style.backgroundColor = 'orange';
    setTimeout(() => { document.body.style.backgroundColor = 'white'; }, 1000);
    chrome.runtime.sendMessage({ action: 'contentController', value: 'contentController' });
    console.log('OOOOOOOOOOOOOOOOOOOOOOOO');
    const store = new Store();
    window.contentController = new ContentController({
      // overlay: new Overlay({ store }),
      recorder: new Recorder({ store }).init(),
      store
    });

  });
}


// console.log('init headlessController');

// window.contentController.init();