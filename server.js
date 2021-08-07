const express = require('express');
const fs = require('fs')
const path = require('path');
const { clog } = require('./middleware/clog');
const uuid = require('./helpers/uuid');
const db = require('./db/db.json')
const PORT = process.env.PORT || 3001;

const {
    readFromFile,
    readAndAppend,
    writeToFile,
} = require('./helpers/fsUtils');

const app = express();

// Import custom middleware, "cLog"
app.use(clog);

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// GET Route for homepage
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/index.html'))
);
// GET Route for notes
app.get('/notes', (req, res) =>
    res.sendFile(path.join(__dirname, '/public/notes.html'))
);

app.get('/api/notes', (req, res) =>
    res.sendFile(path.join(__dirname, '/db/db.json'))
);


// POST request to add a note
app.post('/api/notes', (req, res) =>
{
    // Log that a POST request was received
    console.info(`${req.method} request received to add a note`);

    // Destructuring assignment for the items in req.body
    const { title, text } = req.body;

    // If all the required properties are present
    if (title && text) {
        // Variable for the object we will save
        const newNote = {
            id: uuid(),
            title,
            text,
        };

        // Obtain existing notes
        fs.readFile('./db/db.json', 'utf8', (err, data) =>
        {
            if (err) {
                console.error(err);
            } else {
                // Convert string into JSON object
                const parsedNote = JSON.parse(data);

                // Add a new note
                parsedNote.push(newNote);

                // Write updated notes back to the file
                fs.writeFile(
                    './db/db.json',
                    JSON.stringify(parsedNote, null, 4),
                    (writeErr) =>
                        writeErr
                            ? console.error(writeErr)
                            : console.info('Successfully added your note!')
                );
            }
        });

        const response = {
            status: 'success',
            body: newNote,
        };

        console.log(response);
        res.json(response);
    } else {
        res.json('Error in posting your note');
    }
});

// DELETE Route 
app.delete('/api/notes/:id', (req, res) =>
{
    const noteId = req.params.id;
    readFromFile('./db/db.json')
    .then((data) => JSON.parse(data))
    .then((json) =>
    {
            // Make a new array of all songs except the one with the ID provided in the URL
            const result = json.filter((note) => note.id !== noteId);

            // Save that array to the filesystem
            writeToFile('./db/db.json', result);

            // Respond to the DELETE request
            res.json(`Item ${noteId} has been deleted 🗑️`);
        });
});


// Open up port for local host
app.listen(PORT, () =>
    console.log(`App listening at http://localhost:${PORT} 🚀`)
);
