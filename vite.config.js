import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import arcadeHandler from './api/arcade.js'

function localArcadeApiPlugin() {
  return {
    name: 'local-arcade-api',
    configureServer(server) {
      server.middlewares.use('/api/arcade', (req, res) => {
        const urlObj = new URL(req.url || '', 'http://localhost');
        req.query = Object.fromEntries(urlObj.searchParams.entries());

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        if (req.method === 'POST') {
          let raw = '';
          req.on('data', (chunk) => { raw += chunk; });
          req.on('end', () => {
            try {
              req.body = raw ? JSON.parse(raw) : {};
            } catch {
              req.body = {};
            }
            arcadeHandler(req, res);
          });
        } else {
          arcadeHandler(req, res);
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.PHANTOM_ADMIN_PASSWORD && !process.env.PHANTOM_ADMIN_PASSWORD) {
    process.env.PHANTOM_ADMIN_PASSWORD = env.PHANTOM_ADMIN_PASSWORD;
  }
  return {
    plugins: [react(), localArcadeApiPlugin()],
  };
})
