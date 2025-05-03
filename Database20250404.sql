CREATE DATABASE to_dolist;
USE to_dolist;

CREATE TABLE users (
    idusers INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(idusers) ON DELETE CASCADE
);

CREATE TABLE lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#2c3e50', -- Hex color code
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT unique_list_name_per_board UNIQUE (board_id, name)
);

CREATE TABLE cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT 'orange', -- Hex color code
    column_name VARCHAR(255) NOT NULL, -- References lists.name
    FOREIGN KEY (user_id) REFERENCES users(idusers) ON DELETE CASCADE
);