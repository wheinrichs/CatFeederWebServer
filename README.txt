This repo defines the server that runs the front end react application. This server uses Node.js as the
backend server implementation. 

In addition to running the server main functions, it also defines the model, schema, routes, and DAO for
both the user accounts and the user schedules. The user and schedule information is stores in a mongoDB 
database and managed via mongoose. All passwords are encrypted using bcrypt before being stored in the 
database. 