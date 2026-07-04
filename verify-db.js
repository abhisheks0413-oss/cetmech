const db = require('./db');
db.ensureSchema().then(() => {
  console.log('db-ok');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
