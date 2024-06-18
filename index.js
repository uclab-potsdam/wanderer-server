import { createServer } from "http";
import { Server } from "socket.io";
// import {applyPatch, createPatch} from 'rfc6902'
import { applyPatch, compare } from "fast-json-patch/index.mjs";
import debounce from "debounce";
import { JSONFilePreset } from "lowdb/node";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    // origin: "http://localhost:5174",
    origin: "*",
  },
});

const defaultData = {};

// const db = await JSONFilePreset("db.json", defaultData);

io.on("connection", (socket) => {
  let db = null;
  console.log("connected socket:", socket.id);

  socket.on("create", async (data) => {
    const id = crypto.randomUUID();
    db = await JSONFilePreset(`${id}.json`, data ?? defaultData);
    socket.emit("created", id);
  });

  socket.on("open", async (id) => {
    db = await JSONFilePreset(`${id}.json`, null);
    console.log(db);
    socket.emit("data", db.data);
  });

  socket.on("fetch", async (id) => {
    db = await JSONFilePreset(`${id}.json`, null);
    socket.emit("data", db.data);
  });

  socket.on("patch", async (patch) => {
    // console.log(patch);
    socket.broadcast.emit("update", patch);
    applyPatch(db.data, patch);
    console.log("patch");
    write();
  });

  const write = debounce(async () => {
    console.log("write");
    await db.write();
  }, 1000);
});

httpServer.listen(3000);
