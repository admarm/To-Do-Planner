const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mysqlpassword123",
    database: "to-dolist"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if(err){
            console.error("Query error: ", err);
            return res.json("Error");
        } 
        if(data.length > 0) {
            return res.json("Login Successful")
        }else {
            return res.json("Login Failed")           
        }
    })
});

app.post('/signup', (req, res) => {
    const { email, password } = req.body;

    // Check if the email already exists in the database
    const checkEmailSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkEmailSql, [email], (err, result) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.json("Error");
        }
        if (result.length > 0) {
            return res.json("Email already exists");
        }

        // Insert the new user into the database (plain text password)
        const insertSql = "INSERT INTO users (email, password) VALUES (?, ?)";
        db.query(insertSql, [email, password], (err, data) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.json("Error");
            }
            return res.json("Signup Successful");
        });
    });
});

port = 5000;
app.listen(port, () => 
    {console.log(`Server started and listening on port ${port} ...`)
});