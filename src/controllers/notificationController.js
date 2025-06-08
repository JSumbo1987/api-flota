const { enviarEmailDocumentosExpirados } = require("../services/emailService");
const { checkDocumentExpirations, listarDocumentosVencidosOuAVencer, obterEmailsPermitidos } = require("../services/notificationService");

const checkDocumentosENotificar = async (req, res) => {
  try {
    await checkDocumentExpirations();

    const documentos = await listarDocumentosVencidosOuAVencer();

    if (!documentos || documentos.length === 0) {
      console.log("Nenhum documento vencido ou a vencer.");
      return res.status(200).json({ message: "Nenhum documento expirado ou a expirar." });
    }

    console.table(documentos);
    // Exemplo de uso
    obterEmailsPermitidos().then(emails => {
        console.log('E-mails permitidos para notificação:', emails);
        enviarEmailDocumentosExpirados(emails, documentos);
    });


    /*return res.status(200).json({
      message: "Verificação concluída, e-mail enviado para documentos expirados ou a expirar.",
      documentos
    });*/
  } catch (error) {
    console.error('Erro no processo completo de verificação e notificação:', error);
    return res.status(500).json({ message: 'Erro ao verificar e notificar documentos.', error });
  }
};

module.exports = {
  checkDocumentosENotificar
};
