// prisma.config.ts
import { defineConfig } from '@prisma/config';
import 'dotenv/config'; // <--- ADICIONE ESTA LINHA

export default defineConfig({
  datasource: {
    // Agora process.env.DATABASE_URL terá o valor correto do arquivo .env
    url: process.env.DATABASE_URL,
  },
});