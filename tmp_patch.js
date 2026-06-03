import { query } from './backend/server/db.js';
query("UPDATE leases SET status = 'requested' WHERE status = 'pending'")
    .then(res => { console.log("Fixed"); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
