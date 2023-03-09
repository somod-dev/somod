export const subscribe = (
  cb: (message: unknown) => void,
  subProtocols?: string | string[]
): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_PNS_SUBSCRIBE_ENDPOINT,
      subProtocols
    );
    ws.addEventListener("open", () => {
      ws.addEventListener("message", e => {
        cb(e.data);
      });
      resolve(ws);
    });
    ws.addEventListener("error", e => {
      reject(e);
    });
  });
};
