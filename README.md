**Author: Winston Heinrichs**

**Date: December 1, 2024**

_This code is deployed on render and does not need to be cloned to run the application. It is made public here purely
for educational and transparency purposes._

This repo defines the back end server logic that communicates with the front end react application at:

https://petfeeder.netlify.app/

This server uses Node.js as the
backend server implementation. It handles token distribution, google OAuth 2.0, google drive interfaces, and all login requests.



In addition to running the server main functions, it also defines the model, schema, routes, and DAO for
both the user accounts and the user schedules. The user and schedule information is stores in a mongoDB 
database and managed via mongoose. All passwords are encrypted using bcrypt before being stored in the 
database. 

[View my portfolio here](www.winstonheinrichs.com)