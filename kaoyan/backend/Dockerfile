FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json core.mjs auth.mjs server.mjs ./
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "fetch('http://127.0.0.1:8787/health',{headers:{Authorization:'Bearer '+process.env.APP_ACCESS_TOKEN}}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
