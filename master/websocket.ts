import { ee, secondariesIdList } from './utils.ts';

const webSocketInstance = Bun.serve({
  fetch(req, server) {
    const serverId = crypto.randomUUID();
    const success = server.upgrade(req, { data: { serverId } });
    return success
      ? undefined
      : new Response("WebSocket upgrade error", { status: 400 });
  },
  websocket: {
    open(ws) {
      ws.subscribe("replication");
      // @ts-ignore
      const { serverId } = ws.data;
      secondariesIdList.push(serverId)
      console.log(`new client [${serverId}] connected to websocket`)
    },
    message(ws, message) {
      // @ts-ignore
      const { serverId } = ws.data;
      console.log(`new message from ${serverId}:`, message);
      ee.emit(`ack-${serverId}`, message);
    },
    close(ws) {
      ws.unsubscribe('replication');
      // @ts-ignore
      const { serverId } = ws.data;
      const index = secondariesIdList.findIndex((item) => item === serverId);
      secondariesIdList.splice(index, 0);
      console.log(`client [${serverId}] disconnected from websocket`)
    }
  },
  port: 8000,
});

console.log(`Websocket is live on ws://localhost:${webSocketInstance.port}`);

export { webSocketInstance };
