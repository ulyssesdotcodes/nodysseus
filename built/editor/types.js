export const isd3NodeNode = (n) => !!n.node_id;
export const expectSharedWorkerMessageResponse = (m) => !!m.messageId;
// const test = <T extends SharedWorkerMessageKind>(m: Omit<TSharedWorkerMessageTo<T>, "messageId">) => {};
// export type NodysseusStoreMessageData = 
//   { kind: "get", graphid: string }
//   | { kind: "keys" }
// export type NodysseusStoreMessage = {id: string} & NodysseusStoreMessageData
// export type NodysseusStoreResponseMessage = 
//   { kind: "get", id: string, graph: Graph }
//   | { kind: "keys", id: string, keys: Array<string> }
//   | { kind: "connect" }
