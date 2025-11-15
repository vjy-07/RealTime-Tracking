const express = require("express");
const app = express();
const path = require("path");

const http = require("http");
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const users = {}; // { socketId: username }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("set-username", (name) => {
    socket.username = name;
    users[socket.id] = name;

    io.emit("user-connected", { id: socket.id, name });
    io.emit("user-list", users);
  });

  socket.on("send-location", (data) => {
    io.emit("receive-location", {
      id: socket.id,
      username: socket.username,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  socket.on("disconnect", () => {
    io.emit("user-disconnected", {
      id: socket.id,
      name: socket.username,
    });

    delete users[socket.id];
    io.emit("user-list", users);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
