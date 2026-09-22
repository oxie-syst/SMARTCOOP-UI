const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "SmartCoop123",
    database: "SmartCoop",
    port: 3306
});


db.connect((err) => {
    if (err) {
        console.log("Database Error:", err);
    } else {
        console.log("Connected to MySQL");
    }
});

module.exports = db;