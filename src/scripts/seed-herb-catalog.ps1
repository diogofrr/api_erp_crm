# Script para popular o catalogo de ervas no banco de dados
Write-Host "Populando catalogo de ervas..." -ForegroundColor Green

if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js/npx nao encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Gerando cliente Prisma..." -ForegroundColor Yellow
    npx prisma generate

    Write-Host "Executando seed do catalogo de ervas..." -ForegroundColor Yellow

    $seedScript = @'
require('dotenv/config');
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const catalog = [
  { key: 'alecrim', label: 'Alecrim', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: evitar uso interno para hipertensos.', saintTags: ['Oxal\u00e1','Ox\u00f3ssi','Ibeji','Preto-Velho','Caboclo','Er\u00ea'], properties: ['Abertura de Caminhos','Expans\u00e3o','Limpeza','Equil\u00edbrio Emocional'] },
  { key: 'alfazema', label: 'Alfazema', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanj\u00e1','Oxum','Oxal\u00e1','Caboclo','Ibeji'], properties: ['Acalmar','Atrativo Feminino','Harmonia','Fortalecer Mediunidade'] },
  { key: 'alho', label: 'Alho (e Cascas)', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: o consumo pode causar dermatite ou irrita\u00e7\u00e3o no est\u00f4mago.', saintTags: ['Exu','Ossain'], properties: ['Descarrego Forte','Consumir Negatividade','Antibi\u00f3tico Astral'] },
  { key: 'anis_estrelado', label: 'Anis-Estrelado', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanj\u00e1','Oxum','Cigano','Marinheiro'], properties: ['Sorte','Energias Positivas','Equil\u00edbrio Medi\u00fanico','Amor'] },
  { key: 'aroeira', label: 'Aroeira', classification: 'arvore', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: risco de alergia na pele. N\u00e3o usar para banho (na coroa) em algumas casas.', saintTags: ['Exu','Ogum','Ox\u00f3ssi'], properties: ['Limpeza Pesada','Descarrego','Quebra Feiti\u00e7o'] },
  { key: 'arruda', label: 'Arruda', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'Aten\u00e7\u00e3o: erva agressiva. Pode ser t\u00f3xica/abortiva. N\u00e3o usar para banho na coroa.', saintTags: ['Exu','Ogum','Preto-Velho','Boiadeiro'], properties: ['Descarrego','Defesa','Consumidora de Negatividade','Quebra Feiti\u00e7o'] },
  { key: 'babosa', label: 'Babosa', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: uso externo recomendado. Pode causar irrita\u00e7\u00f5es g\u00e1stricas.', saintTags: ['Exu','Omolu'], properties: ['Prote\u00e7\u00e3o','Sorte','Cicatrizante','Regenerador'] },
  { key: 'beladona', label: 'Beladona', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: erva altamente t\u00f3xica. N\u00e3o ingerir.', saintTags: ['Exu'], properties: ['Sacudimento','Limpeza Densa','Afastar M\u00e1s Vibra\u00e7\u00f5es'] },
  { key: 'benjoim', label: 'Benjoim', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro para defuma\u00e7\u00e3o.', saintTags: ['Oxal\u00e1','Oxum'], properties: ['Purifica\u00e7\u00e3o','Prosperidade','Viagem Astral','Destruir Larvas Astrais'] },
  { key: 'bico_de_papagaio', label: 'Bico-de-Papagaio', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'alto', warningNote: 'ALTO RISCO: l\u00e1tex provoca coceira, queima\u00e7\u00e3o, diarreia e les\u00f5es oculares.', saintTags: ['Uso Ornamental'], properties: ['Est\u00e9tica'] },
  { key: 'boldo', label: 'Boldo (Tapete de Oxal\u00e1)', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: em excesso (ingerido), pode ser t\u00f3xico.', saintTags: ['Oxal\u00e1','Xang\u00f4'], properties: ['Limpeza Coron\u00e1ria','Equil\u00edbrio','Purifica\u00e7\u00e3o'] },
  { key: 'calendula', label: 'Cal\u00eandula', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanj\u00e1','Oxum','Oy\u00e1'], properties: ['Energizador Astral','Purificador de Chacras','Amor'] },
  { key: 'camomila', label: 'Camomila', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: pode causar n\u00e1useas ou dermatites em pessoas sens\u00edveis.', saintTags: ['Oxal\u00e1','Oxum','Cigano'], properties: ['Acalmar','Ado\u00e7amento','Paz'] },
  { key: 'cana_de_acucar', label: 'Cana-de-A\u00e7\u00facar', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'baixo', warningNote: 'Seguro. (Usa-se as folhas/baga\u00e7o para banhos/defuma\u00e7\u00e3o).', saintTags: ['Ew\u00e1','Exu','Oxumar\u00ea'], properties: ['Limpeza B\u00e1sica','Consumir Astrais','Atrair Dinheiro'] },
  { key: 'capim_cidreira', label: 'Capim Cidreira/Santo', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ogum','Oxum','Ox\u00f3ssi'], properties: ['Acalmar','Bons Fluidos','Sono'] },
  { key: 'comigo_ninguem_pode', label: 'Comigo-Ningu\u00e9m-Pode', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: altamente t\u00f3xica (oxalato de c\u00e1lcio). Causa asfixia e les\u00f5es oculares. N\u00e3o banhar a coroa.', saintTags: ['Exu','Ogum'], properties: ['Defesa','Afastar Energias Negativas','Quebrar Mandinga'] },
  { key: 'copo_de_leite', label: 'Copo-de-Leite', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'alto', warningNote: 'ALTO RISCO: extrema toxicidade (oxalato de c\u00e1lcio), causa dificuldade de degluti\u00e7\u00e3o e asfixia.', saintTags: ['Uso Ornamental'], properties: ['Est\u00e9tica'] },
  { key: 'cravo_da_india', label: 'Cravo da \u00cdndia', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro. (Pode causar leve sensibilidade se esfregado puro).', saintTags: ['Ob\u00e1','Xang\u00f4','Cigano'], properties: ['Energia','Poder','Prote\u00e7\u00e3o contra M\u00e1 Inten\u00e7\u00e3o','Descarrego Sexual'] },
  { key: 'dama_da_noite', label: 'Dama da Noite', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'O aroma forte pode incomodar pessoas sens\u00edveis.', saintTags: ['Ew\u00e1','Nan\u00e3','Pombo-Gira'], properties: ['Intui\u00e7\u00e3o','Atrativo Feminino'] },
  { key: 'erva_doce', label: 'Erva Doce', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1','Oxum'], properties: ['Ado\u00e7amento','Romance','Acalmar','Harmonizar'] },
  { key: 'erva_santa_luzia', label: 'Erva de Santa Luzia', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ew\u00e1','Iemanj\u00e1','Oxum','Oy\u00e1'], properties: ['Cristalizar','Prover','Cura'] },
  { key: 'eucalipto', label: 'Eucalipto', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1'], properties: ['Cura Espiritual','Prote\u00e7\u00e3o','Sa\u00fade','Descarrego Forte'] },
  { key: 'folha_de_fogo', label: 'Folha de Fogo', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: pode causar queima\u00e7\u00e3o/alergia cut\u00e2nea.', saintTags: ['Exu','Xang\u00f4'], properties: ['Quebra Feiti\u00e7o','Limpeza','Transforma\u00e7\u00e3o'] },
  { key: 'girassol', label: 'Girassol', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxum','Oy\u00e1','Cigano'], properties: ['Anuladora de Eguns','Cristalizar','Intui\u00e7\u00e3o'] },
  { key: 'guine', label: 'Guin\u00e9', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: erva t\u00f3xica/agressiva; pode causar irrita\u00e7\u00f5es e \u00e9 t\u00f3xica se ingerida.', saintTags: ['Omolu','Ox\u00f3ssi','Preto-Velho','Caboclo','Boiadeiro'], properties: ['Cortar Baixo Astral','Barrar Mal','Quebra Feiti\u00e7o','Descarrego'] },
  { key: 'hortela', label: 'Hortel\u00e3', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1','Ox\u00f3ssi','Oxum','Oy\u00e1'], properties: ['Mudan\u00e7as','Animar','Elevar Astral','Abertura de Caminhos'] },
  { key: 'jasmim', label: 'Jasmim', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ibeji','Iemanj\u00e1','Er\u00ea'], properties: ['Amor','Sensualidade','Paz','Espiritualidade'] },
  { key: 'levante', label: 'Levante', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ox\u00f3ssi','Xang\u00f4'], properties: ['Elevar Vibra\u00e7\u00f5es','For\u00e7a','Lideran\u00e7a','Bons Fluidos'] },
  { key: 'louro', label: 'Louro', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ob\u00e1','Ox\u00f3ssi','Oxumar\u00ea','Oy\u00e1','Cigano'], properties: ['Prosperidade','Vit\u00f3ria','Atrair Dinheiro','Fartura'] },
  { key: 'maca', label: 'Ma\u00e7\u00e3 (Folha/Casca)', classification: 'arvore', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ob\u00e1','Oxum','Oy\u00e1'], properties: ['Amor','Magnetismo','Prover','Paz no Lar'] },
  { key: 'macela', label: 'Macela', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1'], properties: ['Acalmar','Atrair Amizades','Proteger Lar','Equilibrar'] },
  { key: 'malva', label: 'Malva', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanj\u00e1','Oxum'], properties: ['Acalmar','Paz','Auto-Estima','Equil\u00edbrio Mental'] },
  { key: 'mamona', label: 'Mamona', classification: 'arvore', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: suas sementes cont\u00eam ricina e s\u00e3o letais se ingeridas. Pode agredir fisicamente na pele.', saintTags: ['Exu','Omolu','Ossain','Bahiano'], properties: ['Limpeza de Caminhos','Quebra Demanda','Descarrego Pesado'] },
  { key: 'manjericao', label: 'Manjeric\u00e3o', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Nan\u00e3','Omolu','Oxal\u00e1','Oxum','Preto-Velho'], properties: ['Eleva\u00e7\u00e3o Espiritual','Prote\u00e7\u00e3o','Afastar Pessimismo','Dinheiro'] },
  { key: 'manjerona', label: 'Manjerona', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ob\u00e1','Oy\u00e1','Xang\u00f4'], properties: ['Amor Pr\u00f3prio','Proteger Casa','Revigorar'] },
  { key: 'mirra', label: 'Mirra', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'baixo', warningNote: 'Seguro (em resina para queima).', saintTags: ['Xang\u00f4'], properties: ['Limpeza Duradoura','Destruir Larvas Astrais','Purifica\u00e7\u00e3o'] },
  { key: 'patchouly', label: 'Patchouly', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1'], properties: ['Amor','Sensualidade','Intui\u00e7\u00e3o','Magnetismo'] },
  { key: 'pata_de_vaca', label: 'Pata de Vaca', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanj\u00e1','Nan\u00e3','Ob\u00e1'], properties: ['Aterramento','Materializa\u00e7\u00e3o','Equil\u00edbrio'] },
  { key: 'peregun', label: "Peregun (Pau d'\u00c1gua)", classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Logun-Ed\u00e9','Nan\u00e3','Ob\u00e1','Ogum','Ossain','Ox\u00f3ssi','Oy\u00e1'], properties: ['Limpeza','Abertura','Defesa','Descarrego'] },
  { key: 'picao_preto', label: 'Pic\u00e3o Preto', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Erva agressiva para banhos.', saintTags: ['Exu','Omolu'], properties: ['Aterramento','Consumir Negatividade','Limpeza'] },
  { key: 'pinhao_roxo', label: 'Pinh\u00e3o Roxo/Branco', classification: 'arvore', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: muito agressiva/t\u00f3xica. N\u00e3o usar para banho (na cabe\u00e7a).', saintTags: ['Ogum'], properties: ['Quebra Magia Negra','Defesa','Descarrego Forte','Paralisa Fluxos'] },
  { key: 'pitanga', label: 'Pitanga (Folha)', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oy\u00e1'], properties: ['Prosperidade','Movimenta\u00e7\u00e3o Espiritual'] },
  { key: 'quebra_pedra', label: 'Quebra Demanda / Quebra Pedra', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Exu','Ogum','Xang\u00f4'], properties: ['Desmanchar Feiti\u00e7os','Quebrar Inveja','Aterramento'] },
  { key: 'roma', label: 'Rom\u00e3 (Folha/Casca)', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ogum','Oy\u00e1'], properties: ['Prote\u00e7\u00e3o contra Inveja','Renova\u00e7\u00e3o','Limpeza','Prosperidade'] },
  { key: 'rosas', label: 'Rosas', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ibeji','Yab\u00e1s','Oxal\u00e1','Pombo-Gira'], properties: ['Amor','Pureza','Paz','Harmonia','Sensualidade','Atra\u00e7\u00e3o'] },
  { key: 'saiao', label: 'Sai\u00e3o / Folha da Costa', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ox\u00f3ssi','Oxal\u00e1'], properties: ['Equil\u00edbrio','Limpeza','Calmante','Restaurar Energias'] },
  { key: 'salsa', label: 'Salsa / Sals\u00e3o', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Exu','Ox\u00f3ssi'], properties: ['Afastar Obsessores','Defesa','Proteger'] },
  { key: 'salvia', label: 'S\u00e1lvia', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1'], properties: ['Prote\u00e7\u00e3o','Sabedoria','Purifica\u00e7\u00e3o','Limpeza'] },
  { key: 'samambaia', label: 'Samambaia', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ox\u00f3ssi','Caboclo'], properties: ['Restabelecer','Purificar','Equilibrar'] },
  { key: 'sao_goncalinho', label: 'S\u00e3o Gon\u00e7alinho', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ogum','Ox\u00f3ssi'], properties: ['Limpeza','Quebra Demanda','Aterramento'] },
  { key: 'trombeteira', label: 'Trombeteira (Saia Branca)', classification: 'flor', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO/LETAL: alcaloides causam taquicardia, boca seca, alucina\u00e7\u00f5es e podem levar \u00e0 morte.', saintTags: ['Magia Torta'], properties: ['Alucina\u00e7\u00f5es','Morte'] },
  { key: 'urtiga', label: 'Urtiga', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: pelos urticantes causam severa irrita\u00e7\u00e3o, coceira e queima\u00e7\u00e3o. N\u00e3o usar para banho de corpo/cabe\u00e7a.', saintTags: ['Exu'], properties: ['Ataque','Quebra Feiti\u00e7o','Limpeza Densa'] },
  { key: 'abre_caminho', label: 'Abre-Caminho', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: verificar composi\u00e7\u00e3o; algumas vers\u00f5es cont\u00eam ervas agressivas.', saintTags: ['Exu','Ogum'], properties: ['Abertura de Caminhos','Destravamento','Prosperidade','Movimento'] },
  { key: 'acoita_cavalo', label: 'A\u00e7oita-Cavalo', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Caboclos','Ox\u00f3ssi'], properties: ['Resist\u00eancia','Firmeza','For\u00e7a','Estrutura'] },
  { key: 'alfavaca', label: 'Alfavaca', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ox\u00f3ssi','Oxum'], properties: ['Harmonia','Equil\u00edbrio','Bem-Estar','Limpeza Suave'] },
  { key: 'amora', label: 'Amora', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxum','Ibeji'], properties: ['Afeto','Vitalidade','Equil\u00edbrio','Do\u00e7ura'] },
  { key: 'cana_do_brejo', label: 'Cana-do-Brejo', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Nan\u00e3','Obaluai\u00ea'], properties: ['Purifica\u00e7\u00e3o','Desintoxica\u00e7\u00e3o','Al\u00edvio','Equil\u00edbrio'] },
  { key: 'carqueja', label: 'Carqueja', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Obaluai\u00ea','Nan\u00e3'], properties: ['Limpeza','Equil\u00edbrio','Purifica\u00e7\u00e3o','Resist\u00eancia'] },
  { key: 'coentro', label: 'Coentro', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ox\u00f3ssi','Ogum'], properties: ['For\u00e7a','Movimento','Abertura','Vitalidade'] },
  { key: 'confrei', label: 'Confrei', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Aten\u00e7\u00e3o: uso interno prolongado pode ser hepatot\u00f3xico.', saintTags: ['Obaluai\u00ea','Nan\u00e3'], properties: ['Regenera\u00e7\u00e3o','Cuidado','Prote\u00e7\u00e3o','Reparo'] },
  { key: 'espada_de_sao_jorge', label: 'Espada-de-S\u00e3o-Jorge', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Seguro. N\u00e3o ingerir.', saintTags: ['Ogum','Ians\u00e3'], properties: ['Prote\u00e7\u00e3o','Barreira Energ\u00e9tica','Defesa','Firmeza'] },
  { key: 'espinheira_santa', label: 'Espinheira-Santa', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Ox\u00f3ssi','Nan\u00e3'], properties: ['Prote\u00e7\u00e3o','Equil\u00edbrio','Resguardo','Cuidado'] },
  { key: 'jurema_preta', label: 'Jurema Preta', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Caboclos','Ox\u00f3ssi','Ossain'], properties: ['Firmeza','Ancestralidade','Defesa','Conex\u00e3o Espiritual'] },
  { key: 'jurubeba', label: 'Jurubeba', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Ogum','Exu'], properties: ['Descarrego','For\u00e7a','Resist\u00eancia','Movimento'] },
  { key: 'lirio_branco', label: 'L\u00edrio Branco', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1','Nan\u00e3'], properties: ['Serenidade','Purifica\u00e7\u00e3o','Respeito','Equil\u00edbrio'] },
  { key: 'melissa', label: 'Melissa', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxum','Oxal\u00e1'], properties: ['Calma','Suavidade','Bem-Estar','Equil\u00edbrio'] },
  { key: 'rosa_vermelha', label: 'Rosa Vermelha', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ibeji','Yab\u00e1s','Pombo-Gira'], properties: ['Amor','Sensualidade','Atra\u00e7\u00e3o','Vitalidade'] },
  { key: 'rosas_brancas', label: 'Rosas Brancas', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxal\u00e1','Iemanj\u00e1','Oxum'], properties: ['Paz','Pureza','Eleva\u00e7\u00e3o','Harmonia'] },
];

async function seed() {
  try {
    console.log('Populando catalogo com ' + catalog.length + ' ervas...');
    for (const herb of catalog) {
      await prisma.herbCatalog.upsert({
        where: { key: herb.key },
        update: herb,
        create: herb,
      });
    }
    console.log('Catalogo populado com sucesso! (' + catalog.length + ' ervas)');
  } catch (error) {
    console.error('Erro ao popular catalogo:', error);
  } finally {
    await prisma.$disconnect();
  }
}
seed();
'@

    $seedScript | Out-File -FilePath "temp-seed-herbs.ts" -Encoding UTF8
    npx tsx temp-seed-herbs.ts
    Remove-Item "temp-seed-herbs.ts" -ErrorAction SilentlyContinue

    Write-Host "Seed do catalogo de ervas concluido!" -ForegroundColor Green

} catch {
    Write-Host "Erro ao popular catalogo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
