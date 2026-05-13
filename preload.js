const { contextBridge } = require('electron');
const db = require('./renderer/db');

contextBridge.exposeInMainWorld('api', {
  dbQuery: db.dbQuery,
  initDatabase: db.initDatabase
});
