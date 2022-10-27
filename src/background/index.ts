import { TWithContext } from "@haibun/context/build/Context";
import Background from "./background";
import { KeepAlive } from "./KeepAlive";

// FIXME should use ConenctedLogger, LoggerWebSocketsClient, etc
export class LoggerWebSocketsClient {
  socket: WebSocket;
  keepAlive: KeepAlive;
  constructor(keepAlive: KeepAlive) {
    this.keepAlive = keepAlive;
    this.socket = new WebSocket('ws://localhost:3294');
    this.socket.onmessage = (event) => {
      console.log('e', event);
    };
  }
  async connect() {
    this.keepAlive.start();
  }
  async disconnect() {
  }
  log(args: any, message: TWithContext) {
    this.out('log', args, { ...message, ctime: new Date().getTime() });
  }

  out(level: any, args: any, contexted: TWithContext & { ctime: number }) {
    this.socket.send(JSON.stringify({ level: JSON.stringify(level), contexted }))
  };
}

declare global {
  interface Window { background: Background; }
}

const keepAlive = new KeepAlive();
const webSocketLogger = new LoggerWebSocketsClient(keepAlive);

const background = new Background(webSocketLogger);
background.init();
