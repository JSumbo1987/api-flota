// routes/index.js
const express = require('express');
const router = express.Router();
const sendMail = require('../controllers/emailController');
const { welcomeRoute } = require('../controllers/notificationController');

//Rota Padrão
router.get('/', welcomeRoute);

// Enviar confirmação
router.post("/send-confirmation", sendMail.saveConfirmationEmail);
router.post("/notifications", sendMail.enviarMailNotificacao);
router.post("/reset-password", sendMail.enviarMailResetPassword);

// Confirmar e-mail
router.get("/confirm-email", sendMail.validationEmailConfirmation);

module.exports = router;