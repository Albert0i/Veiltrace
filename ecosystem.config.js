module.exports = {
    apps: [{
      name: "veiltrace",
      script: "src/app.js",
      instances: 4,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    }]
  };
  