const { checkDocumentExpirations } = require("../services/notificationService");

const checkDocumentos = async(req, res)=>{
    try {
        await checkDocumentExpirations();
    } catch (error) {
        return res.status(500).json({message: 'Erro ao checar documentos, por favor verifique a console.', error});
    }
};

module.exports = { checkDocumentos };