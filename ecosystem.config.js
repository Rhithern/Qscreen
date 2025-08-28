module.exports = {
  apps: [
    {
      name: "web",
      cwd: "apps/web",
      script: "pnpm",
      args: "start",
      env: { 
        PORT: process.env.WEB_PORT || "3000", 
        NODE_ENV: process.env.NODE_ENV || "production" 
      }
    },
    {
      name: "conductor",
      cwd: "apps/conductor",
      script: "pnpm",
      args: "start",
      env: { 
        CONDUCTOR_PORT: process.env.CONDUCTOR_PORT || "8787", 
        NODE_ENV: process.env.NODE_ENV || "production",
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000"
      }
    }
  ]
}
