# Pet Feeder Backend Server

**Author:** Winston Heinrichs  
**Date:** December 1, 2024  

_This code is deployed on Render and does not need to be cloned to run the application. It is made public here purely for educational and transparency purposes._  

This repository defines the backend server logic that communicates with the front-end React application, which is deployed at:  

[https://petfeeder.netlify.app/](https://petfeeder.netlify.app/)  

The backend is built using **Node.js** and provides functionalities such as token distribution, Google OAuth 2.0 integration, Google Drive interfaces, and login management. It also defines the models, schemas, routes, and DAOs for user accounts and schedules. User and schedule information is stored in a **MongoDB** database and managed via **Mongoose**, with passwords encrypted using **bcrypt**.  

[View my portfolio here](https://www.winstonheinrichs.com)

---

## Table of Contents

1. [Key Features](#key-features)
    - [Google OAuth 2.0](#google-oauth-20)
    - [Google Drive Access](#google-drive-access)
    - [Local Login and JWT Signing](#local-login-and-jwt-signing)
    - [Database Access](#database-access)
2. [Security](#security)
3. [Technologies Used](#technologies-used)

---

## Key Features

### Google OAuth 2.0 (`GoogleServices/GoogleOAuthLoginRoutes.js`)  
- Handles the configuration and authentication process for Google OAuth login.  
- Extracts user data, assigns tokens, and manages redirect information.  

### Google Drive Access (`GoogleServices/GoogleDriveAccessRoutes.js`)  
- Finds the ID of a designated folder in Google Drive.  
- Streams video content in chunks to the front end for efficient playback.  

### Local Login and JWT Signing (`server.js`)  
- Acts as the main script for the server.  
- Manages local login functionality.  
- Configures server settings and handles token distribution.  

### Database Access (`Database/`)  
- Defines the **model**, **schema**, **routes**, and **DAO** for both user accounts and user schedules.  
- Stores user and schedule data in a MongoDB database managed via Mongoose.  
- Encrypts all user passwords using bcrypt for enhanced security.  

---

## Security

- **Password Encryption:** All passwords are hashed using bcrypt before storage in the database.  
- **Token Management:** Secure distribution of JWTs for user authentication.  
- **Google OAuth 2.0:** Safeguards sensitive user information during login using secure OAuth protocols.  

---

## Technologies Used

- **Node.js** for backend server implementation.  
- **Express.js** for building RESTful APIs.  
- **MongoDB** with **Mongoose** for database management.  
- **bcrypt** for password hashing and encryption.  
- **Google APIs** for OAuth 2.0 authentication and Drive access.  

---

For further details or questions, feel free to [reach out via my portfolio](https://www.winstonheinrichs.com).  
