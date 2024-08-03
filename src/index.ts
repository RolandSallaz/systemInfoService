import http from "http";
import { Server, Socket } from "socket.io";
import { currentLoad, mem, fsSize } from "systeminformation";
require("dotenv").config();

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

io.on("connection", (socket: Socket) => {
  console.log("Client connected");

  socket.on("getSystemInfo", async (client, data) => {
    try {
      const cpuInfo = await currentLoad();
      const memoryInfo = await mem();
      const processMemoryInfo = process.memoryUsage();
      const diskSpaceInfo = await fsSize();
      const diskInfoInGB = diskSpaceInfo.map((partition) => ({
        ...partition,
        sizeInGB: (partition.size / (1024 * 1024 * 1024)).toFixed(2),
        usedInGB: (partition.used / (1024 * 1024 * 1024)).toFixed(2),
        availableInGB: (partition.available / (1024 * 1024 * 1024)).toFixed(2),
      }));

      const systemInfo = {
        cpu: cpuInfo.currentLoad.toFixed(2),
        ram: {
          totalMemory: (memoryInfo.total / (1024 * 1024 * 1024)).toFixed(2),
          freeMemory: (memoryInfo.free / (1024 * 1024 * 1024)).toFixed(2),
          usedMemory: (
            (memoryInfo.total - memoryInfo.free) /
            (1024 * 1024 * 1024)
          ).toFixed(2),
          nodeMemory: (processMemoryInfo.heapUsed / (1024 * 1024)).toFixed(2),
        },
        disk: {
          space: diskInfoInGB,
        },
      };

      // Отправляем информацию о системе обратно клиенту
      socket.emit("systemInfo", systemInfo);
    } catch (error) {
      console.error("Ошибка при получении информации о системе:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
