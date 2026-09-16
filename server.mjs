import { preview } from "vite";

const port = Number(process.env.PORT) || 5173;

await preview({
  preview: {
    host: true,
    port,
    allowedHosts: true,
  },
});

console.log(`เปิดเว็บได้ที่พอร์ต ${port}`);
