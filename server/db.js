const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "SmartCoop",
  port: Number(process.env.DB_PORT || 3306),
  dateStrings: ["DATE"]

});

db.connect((err) => {
  if (err) {
    console.log("Database Error:", err);
  } else {
    console.log("Connected to MySQL");
console.log("Database Host:", db.config.host);
console.log("Database Name:", db.config.database);
console.log("Database Port:", db.config.port);
  }
});

module.exports = db;
