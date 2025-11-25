const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const PostgreSQLModels = require('../models/postgres.db');

// Utility to hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Check if user exists
        const existingUser = await PostgreSQLModels.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Hash password
        const password_hash = hashPassword(password);

        // Create user
        // Mapping 'fullname' to 'username' as per DB schema
        const newUser = await PostgreSQLModels.createUser({
            username: fullname,
            email,
            password_hash
        });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: newUser
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
        }

        // Find user
        const user = await PostgreSQLModels.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verify password
        const inputHash = hashPassword(password);
        if (inputHash !== user.password_hash) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Return user info (excluding password)
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            message: 'Inicio de sesión exitoso',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// UPDATE PHONE
router.put('/update-phone', async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ error: 'Email y teléfono son requeridos' });
        }

        // Update phone
        const updatedUser = await PostgreSQLModels.updateUserPhone(email, phone);

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Return user info (excluding password)
        res.json({
            message: 'Teléfono actualizado exitosamente',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error actualizando teléfono:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
