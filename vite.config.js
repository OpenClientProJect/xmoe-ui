import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/sk-api': {
        target: 'http://api.xmoe.asia/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sk-api/, '')
      },
      '/cloud': {
        target: 'https://cloud.xmoe.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cloud/, '')
      },
      '/video-proxy': {
        target: 'https://xmoe.video',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/video-proxy/, ''),
        configure: (proxy, options) => {
          // 添加自定义处理
          proxy.on('error', (err, req, res) => {
            console.log('视频代理请求失败:', err);
            // 发送错误响应给客户端
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 修改代理请求
            proxyReq.setHeader('Host', 'xmoe.video');
            proxyReq.setHeader('Origin', 'https://xmoe.video');
            proxyReq.setHeader('Referer', 'https://xmoe.video/');
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 添加CORS头部
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length,Content-Range';
          });
        }
      },
      '/cors-proxy': {
        // cors-proxy使用函数方式处理，因为目标是动态的
        bypass: (req, res) => {
          const targetUrl = req.url.replace(/^\/cors-proxy\?url=/, '');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return true;
          }
          
          // 解码URL
          const decodedUrl = decodeURIComponent(targetUrl);
          console.log('代理请求到:', decodedUrl);
          
          // 使用fetch手动代理请求
          import('node-fetch').then(({ default: fetch }) => {
            fetch(decodedUrl, {
              headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Accept': '*/*',
                'Origin': 'https://xmoe.video',
                'Referer': 'https://xmoe.video/'
              }
            })
            .then(response => {
              // 设置状态码和头部
              res.statusCode = response.status;
              
              // 添加CORS头部
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization');
              res.setHeader('Access-Control-Expose-Headers', 'Content-Length,Content-Range');
              
              // 复制原始响应头部
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });
              
              // 返回响应体
              return response.body.pipe(res);
            })
            .catch(error => {
              console.error('代理请求错误:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Proxy Error', message: error.message }));
            });
          }).catch(err => {
            console.error('加载node-fetch失败:', err);
            res.statusCode = 500;
            res.end('Server Error: Could not load fetch module');
          });
          
          // 返回true表示自己处理请求
          return true;
        }
      }
    }
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
