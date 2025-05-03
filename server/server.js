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
    database: "to_dolist"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

// Login endpoint
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) {
            console.error("Query error:", err);
            return res.json("Error");
        }
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

// Move cards to another list
app.put('/cards/move', (req, res) => {
    const { userId, fromList, toList } = req.body;
    const sql = "UPDATE cards SET column_name = ? WHERE user_id = ? AND column_name = ?";
    db.query(sql, [toList, userId, fromList], (err, data) => {
        if (err) {
            console.error("Error moving cards:", err);
            return res.json("Error");
        }
        return res.json("Cards Moved");
    });
});

// Rename a list (update column_name for all cards in that list)
app.put('/cards/rename', (req, res) => {
    const { userId, oldName, newName } = req.body;
    const sql = "UPDATE cards SET column_name = ? WHERE user_id = ? AND column_name = ?";
    db.query(sql, [newName, userId, oldName], (err, data) => {
        if (err) {
            console.error("Error renaming cards:", err);
            return res.json("Error");
        }
        return res.json("Cards Renamed");
    });
});

// Fetch lists for a user
app.get('/lists/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT name FROM lists WHERE user_id = ?";
    db.query(sql, [userId], (err, data) => {
        if (err) {
            console.error("Error fetching lists:", err);
            return res.json("Error");
        }
        return res.json(data.map(row => row.name));
    });
});

// Add a new list
app.post('/lists', (req, res) => {
    const { userId, name } = req.body;
    const sql = "INSERT INTO lists (user_id, name) VALUES (?, ?)";
    db.query(sql, [userId, name], (err, data) => {
        if (err) {
            console.error("Error adding list:", err);
            return res.json("Error");
        }
        return res.json("List Added");
    });
});

// Delete a list
// DELETE /cards/:id - Delete a card by ID
app.delete('/cards/:id', (req, res) => {
    const cardId = req.params.id;
    const query = 'DELETE FROM cards WHERE id = ?';
    db.query(query, [cardId], (err, result) => {
        if (err) {
            console.error('Error deleting card:', err);
            res.status(500).send("Error");
            return;
        }
        if (result.affectedRows === 0) {
            // No card found with the given ID
            res.status(404).send("Card Not Found");
            return;
        }
        res.send("Card Deleted");
    });
});

// Rename a list
app.put('/lists', (req, res) => {
    const { userId, oldName, newName } = req.body;
    const sql = "UPDATE lists SET name = ? WHERE user_id = ? AND name = ?";
    db.query(sql, [newName, userId, oldName], (err, data) => {
        if (err) {
            console.error("Error renaming list:", err);
            return res.json("Error");
        }
        return res.json("List Renamed");
    });
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}\nListening...`);
});