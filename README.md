# Riddles Database Setup

## Introduction
This guide provides steps to set up a database called `riddles` and create two tables: `riddles` and `history`. It also includes instructions to install dependencies and run the project locally.

## Database Setup

### 1. Create a Database
Create the `riddles` database

### 2. Create the following tables

#### a. CREATE TABLE riddle (
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

NOTE: Ensure to change the pg.Client info to match your database!

### 3. Run npm i and node index.js to run locally!

# Who Did What
Jackson: Attempt Tracking, History Page Calling, Database Setup
Nathan: Calling riddles onto main page, Correct/Incorrect checking, Code enviroment setup, Database setup
Jon: Frontend, Clear history button, Checking if answered code
Holden: Frontend, Attempt Tracking bug fixing, Database bug fixing
