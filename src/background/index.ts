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
  log(args: any, ctx: any) {
    this.out('log', args, ctx);
  }
  out(level: any, args: any, ctx: any) {
    this.socket.send(JSON.stringify({ level: JSON.stringify(level), args, ctx }))
  };
}

declare global {
  interface Window { background: Background; }
}

const keepAlive = new KeepAlive();
const webSocketLogger = new LoggerWebSocketsClient(keepAlive);

const background = new Background(webSocketLogger);
background.init();