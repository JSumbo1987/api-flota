const path = require("path");
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");
const { supabase } = require('../config/supabaseClient');
const { sendMail } = require("../services/emailService");
require('dotenv').config();

  //Carregar Ficheiros HTML.
  let htmlConfirmarEmail = fs.readFileSync(path.join(__dirname, "../upload/confirmar-email.html"), 'utf-8');
  let htmlResetPassword  = fs.readFileSync(path.join(__dirname, "../upload/reset-senha.html"), 'utf-8');
  let htmlNotificacoes   = fs.readFileSync(path.join(__dirname, "../upload/notificacoes.html"), 'utf-8');

  const enviarMailNotificacao = (req, res)=>{
    const { to } = req.body;
    const subject = 'Aviso de Documentos Expirados';

    try {
      sendMail(to, subject, htmlNotificacoes);
      return res.status(200).json({message:"E-mail enviado com sucesso."});
    } catch (error) {
      return res.status(500).json({message:"",error});
    }
  };

  const enviarMailResetPassword = async(req, res) => {
    const { to, nomeUsuario, novaSenha } = req.body;
    const url_login = process.env.URL_LOGIN;
    const subject = 'Sua senha foi resetada - Flota Vista';
  
    const htmlBody = htmlResetPassword
      .replace('{{nomeUsuario}}', nomeUsuario)
      .replace('{{novaSenha}}', novaSenha)
      .replace('{{url_login}}', url_login);
  
    try {
      await sendMail(to, subject, htmlBody); // <- use await se for assíncrono
      return res.status(200).json({ message: "E-mail enviado com sucesso." });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      return res.status(500).json({ message: "Erro ao enviar e-mail.", error });
    }
  };
  
  //Salvar os dados do e-mail de confirmação.
  const saveConfirmationEmail = async(req, res)=>{
      const { to, userid } = req.body;
      const email = to;
      const token = uuidv4();
      const verificationUrl = `${process.env.BASE_URL}/confirm-email?token=${token}`;
      const htmlBody = htmlConfirmarEmail.replace('{{verificationUrl}}', verificationUrl);

      const { error } = await supabase.from("tblemailconfirmacao")
          .insert([{ email, token, userid }]);
    
      if (error) return res.status(500).json({ error: error.message });
      console.log("Depois Aqui...");
    
     try {
        const subject = 'Confirme seu e-mail no Flota Vista';
        sendMail(to, subject, htmlBody);
        res.status(200).json({ message: "E-mail de confirmação enviado com sucesso!" });
      } catch (err) {
        return res.status(500).json({message:" Erro ao enviar o e-mail de confirmação. Por favor verifica a console",err});
      };
  };
    
  //Update validação do e-mail de Confirmação.
  const validationEmailConfirmation = async(req, res)=>{
    const { token } = req.query;
    if (!token) return res.status(400).send("Token não fornecido.");

    try {
      const { data, error } = await supabase.from("tblemailconfirmacao")
        .select("*").eq("token", token).eq("usado", false).single();

      if (error || !data) {
        return res.status(400).send("Token inválido ou expirado.");
      }

      // Atualizar e-mail confirmado no usuário
      await supabase.from("tblusuarios").update({ useremailconfirmed: true }).eq("useremail", data.email);

      // Marcar o token como usado
      await supabase.from("tblemailconfirmacao").update({ usado: true }).eq("id", data.id);

      // Envia a página HTML
      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>E-mail Confirmado</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); max-width: 400px; text-align: center;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASkAAACKCAYAAAD2Zrx2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQA..." alt="Flota Vista Logo" style="width: 64px; height: 64px; margin-bottom: 12px;" />
            <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin-bottom: 24px;">Flota Vista</h1>
            <h2 style="color: #16a34a; font-size: 24px; margin-bottom: 12px;">E-mail confirmado com sucesso!</h2>
            <p style="color: #4b5563; font-size: 16px; margin: 8px 0;">O e-mail <strong>${data.email}</strong> foi verificado.</p>
            <p style="color: #4b5563; font-size: 16px; margin: 8px 0;">Agora você pode acessar sua conta no Flota Vista.</p>
            <a href=${process.env.URL_LOGIN} style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Fazer Login</a>
          </div>
        </body>
        </html>
        `;


      res.send(html);
    } catch (error) {
      res.status(500).json({ error: "Erro ao validar o e-mail." });
    }
  };

   module.exports = { 
      saveConfirmationEmail,
      enviarMailNotificacao,
      enviarMailResetPassword,
      validationEmailConfirmation
  };
   