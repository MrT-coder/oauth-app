require('dotenv').config();
const express = require('express');
const session = require('express-session'); // Importar express-session
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));

// Configuración de express-session
app.use(session({
    secret: 'una-clave-secreta-para-firmar-la-sesion', // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a `true` si usas HTTPS
}));

// Inicializar Passport y restaurar la sesión
app.use(passport.initialize());
app.use(passport.session());

// Configuración de Passport con Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Aquí puedes guardar el perfil del usuario en tu base de datos si lo deseas
    return done(null, profile);
}));

// Serializar y deserializar el usuario
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Rutas
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Iniciar autenticación con Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de Google
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);

// Página de perfil del usuario
app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Perfil de Usuario</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container profile-container">
                <h1>Bienvenido, ${req.user.displayName}!</h1>
                <p><strong>Email:</strong> ${req.user.emails[0].value}</p>
                <a href="/logout" class="logout-button">Cerrar sesión</a>
            </div>
        </body>
        </html>
    `);
});

// Cerrar sesión
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});