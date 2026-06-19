module.exports = {
    apps: [
        {
            name: 'escrowchain-api',
            script: './server/index.js',
            instances: 'max', // Scale across all available CPU cores
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
