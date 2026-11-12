const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "SmartCoop",
  port: Number(process.env.DB_PORT || 3306),

  dateStrings: ["DATE"],

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database Error:", err);
  } else {
    console.log("Connected to MySQL");
    console.log("Database Host:", db.config.connectionConfig.host);
    console.log("Database Name:", db.config.connectionConfig.database);
    console.log("Database Port:", db.config.connectionConfig.port);

    connection.release();
  }
});

module.exports = db;