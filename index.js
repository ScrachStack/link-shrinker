import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import ejs from 'ejs';
import path from 'path';
import { nanoid } from 'nanoid';
import mysql from 'mysql';
const app = express();
const PORT = process.env.PORT || 3000;
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'short'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database.');
    }
});
app.set('view engine', 'ejs');
app.set('views', path.join('./views')); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); 

app.get('/', (req, res) => {
    const userId = req.cookies.user_id; 
    if (!userId) {
        const newUserId = nanoid();
        res.cookie('user_id', newUserId, { httpOnly: true });
        return res.redirect('/');
    }
    const query = 'SELECT * FROM urls WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error retrieving URLs:', err);
            return res.status(500).send('Error retrieving URLs');
        }
        res.render('index', { redirects: results });
    });
});

app.post('/shorten', (req, res) => {
    const longUrl = req.body.url;
    const userId = req.cookies.user_id;

    if (!longUrl) {
        return res.status(400).send('URL is required');
    }

    if (!userId) {
        return res.status(400).send('User ID is required');
    }
    const shortUrl = nanoid(6);

    const query = 'INSERT INTO urls (user_id, short_url, long_url) VALUES (?, ?, ?)';
    db.query(query, [userId, shortUrl, longUrl], (err, result) => {
        if (err) {
            console.error('Error storing URL:', err);
            return res.status(500).send('Error storing URL');
        }
        res.redirect('/');
    });
});

app.get('/:shortUrl', (req, res) => {
    const shortUrl = req.params.shortUrl;
    const query = 'SELECT * FROM urls WHERE short_url = ?';
    db.query(query, [shortUrl], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send('URL not found');
        }

        const longUrl = results[0].long_url;
        res.redirect(longUrl);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
