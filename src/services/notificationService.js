// services/notifications.js
const { supabase } = require('../config/supabaseClient');

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

   /**
   * Insere uma notificação na tabela tblnotificacoes
   * @param {string} titulo
   * @param {string} descricao
   * @param {string} tipo
   * @param {string} rota
   */
   async function saveNotification(titulo, descricao, tipo, rota) {
    // Verifica se já existe notificação igual
    const { data: existentes, error: fetchError } = await supabase
      .from('tblnotificacoes')
      .select('id')
      .eq('titulo', titulo)
      .eq('descricao', descricao)
      .eq('tipo', tipo)
      .eq('rota', rota);
  
    if (fetchError) {
      console.error('Erro ao verificar notificação existente:', fetchError);
      return null;
    }
  
    if (existentes && existentes.length > 0) {
      console.log(`Notificação já existe: "${titulo}"`);
      return null;
    }
  
    // Se não existe, insere
    const { data, error } = await supabase
      .from('tblnotificacoes')
      .insert([{ titulo, descricao, lido: false, tipo, rota }]);
  
    if (error) {
      console.error('Erro ao inserir notificação:', error);
      return null;
    }
  
    console.log(`Notificação criada: "${titulo}"`);
    return data;
  };

  async function checkDocumentExpirations() {
    console.log("Executando verificação de documentos...");
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
  
    const data15Dias = new Date();
    data15Dias.setDate(hoje.getDate() + 15);
    const data15DiasStr = data15Dias.toISOString().split('T')[0];
  
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const tables = [
      { table: 'tblfuncionarios',fieldNumber: 'cartadeconducaonr', field: 'datavalidade', idField: 'funcionarioid', rota: '/funcionarios', label: 'Carta de condução' },
      { table: 'tblcertificadoinspeccao',fieldNumber: 'numerocertificado', field: 'proximainspeccao', idField: 'id', rota: '/certificados', label: 'Certificado de inspeção' },
      { table: 'tbllicencapublicidade',fieldNumber: 'licencanumero', field: 'datavencimento', idField: 'id', rota: '/licenca-publicidade', label: 'Licença de publicidade' },
      { table: 'tbllicencatransportacao',fieldNumber: 'licencanumero', field: 'datavencimento', idField: 'id', rota: '/licenca-transporte', label: 'Licença de transportação' },
    ];
  
    for (const { table, fieldNumber, field, idField, rota, label } of tables) {
      const { data, error } = await supabase.from(table).select(`${fieldNumber}, ${idField}, ${field}`);
      if (error || !data) continue;
  
      for (const item of data) {
        const validade = item[field];
        if (!validade) continue;
  
        const dataVal = new Date(validade);
        const dataStr = dataVal.toISOString().split('T')[0];
        const tituloBase = `${label} (Nº ${item[fieldNumber]})`;

        //Calcular diferença de dias.
        const diffDias = Math.ceil((dataVal - hoje) / (1000 * 60 * 60 * 24));
  
        // Expira hoje
        if (formatDate(dataStr) === formatDate(hojeStr)) {
          await saveNotification(
            `${tituloBase} expira hoje`,
            `Vencimento em ${dataStr}`,
            'error',
            `${rota}/${idField}`
          );
        }
        // Expira em 15 dias
        else if (diffDias === 15 || diffDias === 5) {
          await saveNotification(
            `${tituloBase} expira em ${diffDias} dias`,
            `Vencimento em ${dataStr}`,
            'warning',
            `${rota}/${idField}`
          );
        }
        // Expira neste mês
        else if (dataVal >= formatDate(primeiroDia) && dataVal <= formatDate(ultimoDia)) {
          await saveNotification(
            `${tituloBase} expira este mês`,
            `Vencimento em ${dataStr}`,
            'info',
            `${rota}/${idField}`
          );
        }
      }
    }
  };

  // exportando as funções
  module.exports = {
    saveNotification,
    checkDocumentExpirations,
  };
