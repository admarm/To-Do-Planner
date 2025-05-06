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
    database: "todolist"
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
            return res.status(500).json("Error");
        }
        if (data.length > 0) {
            return res.json({ message: "Login Successful", userId: data[0].idusers });
        } else {
            return res.status(401).json("Login Failed");
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
            return res.status(500).json("Error");
        }
        if (result.length > 0) {
            return res.status(400).json("Email already exists");
        }
        const insertSql = "INSERT INTO users (email, password) VALUES (?, ?)";
        db.query(insertSql, [email, password], (err, data) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json("Error");
            }
            // Create a default board for the new user
            const userId = data.insertId;
            const insertBoardSql = "INSERT INTO boards (userId, name) VALUES (?, ?)";
            db.query(insertBoardSql, [userId, 'My Board'], (err) => {
                if (err) {
                    console.error("Error creating default board:", err);
                    return res.status(500).json("Error");
                }
                return res.status(201).json("Signup Successful");
            });
        });
    });
});

// Fetch all boards for a user
app.get('/boards/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const sql = "SELECT id, name FROM boards WHERE userId = ?";
    db.query(sql, [userId], (err, data) => {
        if (err) {
            console.error("Error fetching boards:", err);
            return res.status(500).json("Error");
        }
        return res.json(data);
    });
});

// Create a new board
app.post('/boards', (req, res) => {
    const { userId, name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json("Board name cannot be empty");
    }
    const sql = "INSERT INTO boards (userId, name) VALUES (?, ?)";
    db.query(sql, [userId, name.trim()], (err, data) => {
        if (err) {
            console.error("Error creating board:", err);
            return res.status(500).json("Error");
        }
        const boardId = data.insertId;
        // Create default lists for the new board
        const defaultLists = [
            { name: 'Tasks', color: '#2c3e50' },
            { name: 'In Progress', color: '#2c3e50' },
            { name: 'Done', color: '#2c3e50' },
        ];
        const insertListSql = "INSERT INTO lists (board_id, name, color) VALUES (?, ?, ?)";
        const values = defaultLists.map(list => [boardId, list.name, list.color]).flat();
        db.query(
            "INSERT INTO lists (board_id, name, color) VALUES " +
            defaultLists.map(() => "(?, ?, ?)").join(","),
            values,
            (err) => {
                if (err) {
                    console.error("Error creating default lists:", err);
                    return res.status(500).json("Error");
                }
                return res.status(201).json({ message: "Board created", boardId });
            }
        );
    });
});

// Delete a board
app.delete('/boards/:boardId', (req, res) => {
    const boardId = parseInt(req.params.boardId);
    const sql = "DELETE FROM boards WHERE id = ?";
    db.query(sql, [boardId], (err, result) => {
        if (err) {
            console.error("Error deleting board:", err);
            return res.status(500).json("Error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).json("Board Not Found");
        }
        return res.json({ message: "Board deleted" });
    });
});

// Fetch board details (lists) for a specific board
app.get('/boards/:boardId', (req, res) => {
    const boardId = parseInt(req.params.boardId);
    const boardSql = "SELECT name FROM boards WHERE id = ?";
    db.query(boardSql, [boardId], (err, boardData) => {
        if (err) {
            console.error("Error fetching board:", err);
            return res.status(500).json("Error");
        }
        if (boardData.length === 0) {
            return res.status(404).json("Board Not Found");
        }
        const boardName = boardData[0].name;
        const listSql = "SELECT id, name, color FROM lists WHERE board_id = ?";
        db.query(listSql, [boardId], (err, listData) => {
            if (err) {
                console.error("Error fetching lists:", err);
                return res.status(500).json("Error");
            }
            return res.json({ boardName, lists: listData });
        });
    });
});

// Update board name
app.put('/boards/:boardId', (req, res) => {
    const boardId = parseInt(req.params.boardId);
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json("Board name cannot be empty");
    }
    const sql = "UPDATE boards SET name = ? WHERE id = ?";
    db.query(sql, [name.trim(), boardId], (err, result) => {
        if (err) {
            console.error("Error updating board name:", err);
            return res.status(500).json("Error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).json("Board Not Found");
        }
        return res.json({ message: "Board name updated" });
    });
});

// Fetch cards for a user (filtered by board)
app.get('/cards/:userId/board/:boardId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const boardId = parseInt(req.params.boardId);
    const sql = `
        SELECT c.*
        FROM cards c
        JOIN lists l ON c.column_name = l.name
        WHERE c.user_id = ? AND l.board_id = ?
    `;
    db.query(sql, [userId, boardId], (err, data) => {
        if (err) {
            console.error("Error fetching cards:", err);
            return res.status(500).json("Error");
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
            return res.status(500).json("Error");
        }
        console.log("Card inserted, ID:", data.insertId);
        return res.json({ message: "Card Added", cardId: data.insertId, color, column_name: normalizedColumnName });
    });
});

// Move cards to another list
app.put('/cards/move', (req, res) => {
    const { userId, fromList, toList } = req.body;
    const sql = "UPDATE cards SET column_name = ? WHERE user_id = ? AND column_name = ?";
    db.query(sql, [toList, userId, fromList], (err) => {
        if (err) {
            console.error("Error moving cards:", err);
            return res.status(500).json("Error");
        }
        return res.json("Cards Moved");
    });
});

// Rename a list (update column_name for all cards in that list)
app.put('/cards/rename', (req, res) => {
    const { userId, oldName, newName } = req.body;
    console.log("Received /cards/rename request with body:", req.body);
    if (!userId || !oldName || !newName) {
        console.error("Missing required fields in /cards/rename request");
        return res.status(400).json("Missing required fields: userId, oldName, and newName are required");
    }
    const sql = "UPDATE cards SET column_name = ? WHERE user_id = ? AND column_name = ?";
    db.query(sql, [newName, userId, oldName], (err) => {
        if (err) {
            console.error("Error renaming cards:", err);
            return res.status(500).json("Error");
        }
        console.log(`Updated cards: set column_name to ${newName} for userId ${userId} where column_name was ${oldName}`);
        return res.json("Cards Renamed");
    });
});

// Update a card
app.put('/cards/:id', (req, res) => {
    const cardId = req.params.id;
    const { title } = req.body;
    console.log(`Received /cards/${cardId} request with body:`, req.body);
    if (!title || title.trim() === '') {
        console.error(`Validation failed for /cards/${cardId}: Card title cannot be empty`);
        return res.status(400).json("Card title cannot be empty");
    }
    const sql = "UPDATE cards SET title = ? WHERE id = ?";
    db.query(sql, [title.trim(), cardId], (err) => {
        if (err) {
            console.error("Error updating card:", err);
            return res.status(500).json("Error");
        }
        console.log(`Updated card with id ${cardId}`);
        return res.json("Card Updated");
    });
});

// Delete a card
app.delete('/cards/:id', (req, res) => {
    const cardId = req.params.id;
    const query = 'DELETE FROM cards WHERE id = ?';
    db.query(query, [cardId], (err, result) => {
        if (err) {
            console.error('Error deleting card:', err);
            return res.status(500).json("Error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).json("Card Not Found");
        }
        return res.json("Card Deleted");
    });
});

// Add a new list
app.post('/lists', (req, res) => {
    const { boardId, name, color } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json("List name cannot be empty");
    }
    if (!color || color.trim() === '') {
        return res.status(400).json("List color cannot be empty");
    }
    const sql = "INSERT INTO lists (board_id, name, color) VALUES (?, ?, ?)";
    db.query(sql, [boardId, name.trim(), color], (err, data) => {
        if (err) {
            console.error("Error adding list:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json("List name already exists for this board");
            }
            return res.status(500).json("Error");
        }
        return res.json({ message: "List added", listId: data.insertId });
    });
});

// Delete a list
app.delete('/lists/:id', (req, res) => {
    const listId = req.params.id;
    const sql = "DELETE FROM lists WHERE id = ?";
    db.query(sql, [listId], (err, result) => {
        if (err) {
            console.error("Error deleting list:", err);
            return res.status(500).json("Error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).json("List Not Found");
        }
        return res.json({ message: "List deleted" });
    });
});

// Rename a list
app.put('/lists/:id', (req, res) => {
    const listId = req.params.id;
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json("List name cannot be empty");
    }
    const sql = "UPDATE lists SET name = ? WHERE id = ?";
    db.query(sql, [name.trim(), listId], (err, result) => {
        if (err) {
            console.error("Error renaming list:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json("List name already exists for this board");
            }
            return res.status(500).json("Error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).json("List Not Found");
        }
        return res.json({ message: "List renamed" });
    });
});

// Update list color
app.put('/lists/:id/color', (req, res) => {
    const listId = req.params.id;
    const { color } = req.body;
    if (!color || color.trim() === '') {
        return res.status(400).json("List color cannot be empty");
    }
    const sql = "UPDATE lists SET color = ? WHERE id = ?";
    db.query(sql, [color, listId], (err, result) => {
        if (err) {
            console.error("Error updating list color:", err);
            return res.status(500).json("Error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).json("List Not Found");
        }
        return res.json({ message: "List color updated" });
    });
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}\nListening...`);
});