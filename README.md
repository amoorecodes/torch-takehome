# torch-takehome

This is a takehome assesment for Torch Dental.

To start the application, create a `.env` file in the root directory and insert your MTA api key under `API_KEY` variable.

Then run "npm install".
After all packages are installed you can start the server by running `npm run dev`.

It would monitor whenever a line is delayed or goes back to normal service.
There are several endpoints that are exposed:

- `/status/<line>` which would return a message whether a line is in service or delayed
- `/uptime/<line>` which returns how much time the line was delayed since starting the app
