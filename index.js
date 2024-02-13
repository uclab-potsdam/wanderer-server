import { createServer } from "http";
import { Server } from "socket.io";
// import {applyPatch, createPatch} from 'rfc6902'
import { applyPatch, compare } from "fast-json-patch/index.mjs";
import debounce from "debounce";
import { JSONFilePreset } from "lowdb/node";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const defaultData = {
  entities: [
    {
      id: "a",
      x: 400,
      y: 100,
      text: "hello world",
      color: "green",
    },
    {
      id: "b",
      x: 720,
      y: 300,
      text: "good bye world",
      color: "#FFF",
      background: "#000",
    },
  ],
};

const db = await JSONFilePreset("db.json", defaultData);

io.on("connection", (socket) => {
  console.log("connected socket:", socket.id);

  socket.on("fetch", (arg) => {
    socket.emit("data", db.data);
  });

  socket.on("update", async (patch) => {
    // console.log(patch);
    socket.broadcast.emit("update", patch);
    applyPatch(db.data, patch);

    console.log("patch");
    write();
  });
});

const write = debounce(async () => {
  console.log("write");
  await db.write();
}, 1000);

httpServer.listen(3000);
