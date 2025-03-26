# Riddles Database Setup

## Introduction
This guide provides steps to set up a database called `riddles` and create two tables: `riddles` and `history`. It also includes instructions to install dependencies and run the project locally.

## Database Setup

### 1. Create a Database
Create the `riddles` database

### 2. Create the following tables

#### a. CREATE TABLE riddles (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    date DATE NOT NULL
);

#### b. CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    riddle TEXT NOT NULL,
    status BOOLEAN
);

### 3. Run npm i and node index.js to run locally!
