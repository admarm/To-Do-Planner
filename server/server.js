const express = require('express');
const mysql = require('mysql');
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

// Login endpoint (return user ID on success)
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) {
            console.error("Query error:", err);
            return res.json("Error");
        }
        console.log("Login query result:", data); // Debug the query result
        if (data.length > 0) {
            return res.json({ message: "Login Successful", userId: data[0].idusers });
        } else {
            return res.json("Login Failed");
        }
    });
});

// Signup endpoint
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    const checkEmailSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkEmailSql, [email], (err, result) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.json("Error");
        }
        if (result.length > 0) {
            return res.json("Email already exists");
        }
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

// Fetch cards for a user
app.get('/cards/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM cards WHERE user_id = ?";
    db.query(sql, [userId], (err, data) => {
        if (err) {
            console.error("Error fetching cards:", err);
            return res.json("Error");
        }
        return res.json(data);
    });
});

// Add a new card
app.post('/cards', (req, res) => {
    const { userId, title, color = 'orange', column_name = 'Tasks' } = req.body;
    // Normalize column_name to match frontend values
    const normalizedColumnName = column_name.trim();
    console.log("Inserting card with data:", { userId, title, color, column_name: normalizedColumnName });
    const sql = "INSERT INTO cards (user_id, title, color, column_name) VALUES (?, ?, ?, ?)";
    db.query(sql, [userId, title, color, normalizedColumnName], (err, data) => {
        if (err) {
            console.error("Error adding card:", err);
            return res.json("Error");
        }
        console.log("Card inserted, ID:", data.insertId);
        return res.json({ message: "Card Added", cardId: data.insertId, color, column_name: normalizedColumnName });
    });
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}\nListening...`);
});