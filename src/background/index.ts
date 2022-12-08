import { DEFAULT_PORT } from "..";
import Background from "./background";
import { LoggerWebSocketsClient } from "@haibun/context/build/websocket-client/LoggerWebSocketsClient";
import { ExtensionKeepAlive } from "@haibun/context/build/websocket-client/ExtensionKeepAlive";

declare global {
  interface Window { background: Background; }
}

const port = DEFAULT_PORT;
const keepAlive = new ExtensionKeepAlive();

const webSocketLogger = new LoggerWebSocketsClient(port, keepAlive);
const background = new Background(webSocketLogger);
background.init();

loggerConnect(webSocketLogger);

async function loggerConnect(logger: LoggerWebSocketsClient) {
  const errorHandler = (error: any) => {
    background.handleMessage({ action: 'ERROR', value: `Could not connect to websocket on port ${port} ${JSON.stringify(error)}.` });
  }
  await logger.connect(errorHandler);
}
