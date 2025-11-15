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

const users = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // When user sets their name
  socket.on("set-username", (name) => {
    users[socket.id] = { name };

    // Notify others
    io.emit("user-connected", {
      id: socket.id,
      name: name,
    });

    // Send updated list to all users
    io.emit("user-list", users);
  });

  // When a user sends location updates
  socket.on("send-location", (data) => {
    io.emit("receive-location", {
      id: socket.id,
      username: users[socket.id]?.name || "Unknown",
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  // When user disconnects
  socket.on("disconnect", () => {
    const name = users[socket.id]?.name || "Unknown";

    // Notify others
    io.emit("user-disconnected", {
      id: socket.id,
      name: name,
    });

    // Remove user
    delete users[socket.id];

    // Update list for everyone
    io.emit("user-list", users);

    console.log("Disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
