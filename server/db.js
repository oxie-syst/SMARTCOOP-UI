const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "SmartCoop123",
  database: process.env.DB_NAME || "SmartCoop",
  port: Number(process.env.DB_PORT || 3306)
});

db.connect((err) => {
  if (err) {
    console.log("Database Error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

module.exports = db;