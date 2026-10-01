import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // In-memory persistent church config cache on server
  let serverChurchConfig: any = {
    churchName: "Igreja Parque do Sol",
    districtName: "Distrito de Cohab",
    logoUrl: "",
    logoSize: 100,
    churchNameSize: 52,
    districtSize: 22,
    clockSize: 105,
    showRings: true,
  };

  app.get("/api/church-config", (req, res) => {
    res.json(serverChurchConfig);
  });

  app.post("/api/church-config", (req, res) => {
    serverChurchConfig = { ...serverChurchConfig, ...req.body };
    io.emit("church-config-updated", serverChurchConfig);
    res.json({ success: true, config: serverChurchConfig });
  });

  // Socket.io logic for remote projection
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Immediately send the latest church config to newly connected clients
    socket.emit("church-config-updated", serverChurchConfig);

    socket.on("get-church-config", () => {
      socket.emit("church-config-updated", serverChurchConfig);
    });

    socket.on("update-church-config", (config) => {
      serverChurchConfig = { ...serverChurchConfig, ...config };
      io.emit("church-config-updated", serverChurchConfig);
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("update-slide", ({ roomId, slideIndex, song, isPlaying, currentTime }) => {
      // Broadcast to everyone in the room except the sender
      socket.to(roomId).emit("slide-updated", { slideIndex, song, isPlaying, currentTime });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
