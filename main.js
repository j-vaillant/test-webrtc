const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const peers = new Map(); // Utilisation d'une Map pour stocker les pairs avec leur socket

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  peers.set(socket.id, socket);

  // Écouter l'événement start-call
  socket.on("start-call", () => {
    console.log("Start call event received from:", socket.id);
    socket.broadcast.emit("new-peer", socket.id); // Émettre à tous sauf l'expéditeur
  });

  socket.on("offer", (data) => {
    console.log("Offering to:", data.to);
    socket.to(data.to).emit("offer", { from: socket.id, offer: data.offer });
  });

  socket.on("answer", (data) => {
    console.log("Answering:", data.to);
    socket.to(data.to).emit("answer", { from: socket.id, answer: data.answer });
  });

  socket.on("candidate", (data) => {
    console.log("Candidate received from:", data.from);
    socket
      .to(data.to)
      .emit("candidate", { from: socket.id, candidate: data.candidate });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    peers.delete(socket.id);
    // Informer les autres utilisateurs de la déconnexion
    socket.broadcast.emit("peer-disconnected", socket.id); // Émettre la déconnexion
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
