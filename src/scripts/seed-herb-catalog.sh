#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "Populando catalogo de ervas..."

if ! command -v npx >/dev/null 2>&1; then
  echo "Node.js/npx nao encontrado. Instale o Node.js primeiro."
  exit 1
fi

echo "Gerando cliente Prisma..."
npx prisma generate

echo "Executando seed do catalogo de ervas..."

npx tsx <<'EOF'
require('dotenv/config');
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const catalog = [
  { key: 'alecrim', label: 'Alecrim', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Atenção: evitar uso interno para hipertensos.', saintTags: ['Oxalá','Oxóssi','Ibeji','Preto-Velho','Caboclo','Erê'], properties: ['Abertura de Caminhos','Expansão','Limpeza','Equilíbrio Emocional'] },
  { key: 'alfazema', label: 'Alfazema', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanjá','Oxum','Oxalá','Caboclo','Ibeji'], properties: ['Acalmar','Atrativo Feminino','Harmonia','Fortalecer Mediunidade'] },
  { key: 'alho', label: 'Alho (e Cascas)', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Atenção: o consumo pode causar dermatite ou irritação no estômago.', saintTags: ['Exu','Ossain'], properties: ['Descarrego Forte','Consumir Negatividade','Antibiótico Astral'] },
  { key: 'anis_estrelado', label: 'Anis-Estrelado', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanjá','Oxum','Cigano','Marinheiro'], properties: ['Sorte','Energias Positivas','Equilíbrio Mediúnico','Amor'] },
  { key: 'aroeira', label: 'Aroeira', classification: 'arvore', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Atenção: risco de alergia na pele. Não usar para banho (na coroa) em algumas casas.', saintTags: ['Exu','Ogum','Oxóssi'], properties: ['Limpeza Pesada','Descarrego','Quebra Feitiço'] },
  { key: 'arruda', label: 'Arruda', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'Atenção: erva agressiva. Pode ser tóxica/abortiva. Não usar para banho na coroa.', saintTags: ['Exu','Ogum','Preto-Velho','Boiadeiro'], properties: ['Descarrego','Defesa','Consumidora de Negatividade','Quebra Feitiço'] },
  { key: 'babosa', label: 'Babosa', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Atenção: uso externo recomendado. Pode causar irritações gástricas.', saintTags: ['Exu','Omolu'], properties: ['Proteção','Sorte','Cicatrizante','Regenerador'] },
  { key: 'beladona', label: 'Beladona', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: erva altamente tóxica. Não ingerir.', saintTags: ['Exu'], properties: ['Sacudimento','Limpeza Densa','Afastar Más Vibrações'] },
  { key: 'benjoim', label: 'Benjoim', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro para defumação.', saintTags: ['Oxalá','Oxum'], properties: ['Purificação','Prosperidade','Viagem Astral','Destruir Larvas Astrais'] },
  { key: 'bico_de_papagaio', label: 'Bico-de-Papagaio', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'alto', warningNote: 'ALTO RISCO: látex provoca coceira, queimação, diarreia e lesões oculares.', saintTags: ['Uso Ornamental'], properties: ['Estética'] },
  { key: 'boldo', label: 'Boldo (Tapete de Oxalá)', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Atenção: em excesso (ingerido), pode ser tóxico.', saintTags: ['Oxalá','Xangô'], properties: ['Limpeza Coronária','Equilíbrio','Purificação'] },
  { key: 'calendula', label: 'Calêndula', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanjá','Oxum','Oyá'], properties: ['Energizador Astral','Purificador de Chacras','Amor'] },
  { key: 'camomila', label: 'Camomila', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Atenção: pode causar náuseas ou dermatites em pessoas sensíveis.', saintTags: ['Oxalá','Oxum','Cigano'], properties: ['Acalmar','Adoçamento','Paz'] },
  { key: 'cana_de_acucar', label: 'Cana-de-Açúcar', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'baixo', warningNote: 'Seguro. (Usa-se as folhas/bagaço para banhos/defumação).', saintTags: ['Ewá','Exu','Oxumarê'], properties: ['Limpeza Básica','Consumir Astrais','Atrair Dinheiro'] },
  { key: 'capim_cidreira', label: 'Capim Cidreira/Santo', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ogum','Oxum','Oxóssi'], properties: ['Acalmar','Bons Fluidos','Sono'] },
  { key: 'comigo_ninguem_pode', label: 'Comigo-Ninguém-Pode', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: altamente tóxica (oxalato de cálcio). Causa asfixia e lesões oculares. Não banhar a coroa.', saintTags: ['Exu','Ogum'], properties: ['Defesa','Afastar Energias Negativas','Quebrar Mandinga'] },
  { key: 'copo_de_leite', label: 'Copo-de-Leite', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'alto', warningNote: 'ALTO RISCO: extrema toxicidade (oxalato de cálcio), causa dificuldade de deglutição e asfixia.', saintTags: ['Uso Ornamental'], properties: ['Estética'] },
  { key: 'cravo_da_india', label: 'Cravo da Índia', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro. (Pode causar leve sensibilidade se esfregado puro).', saintTags: ['Obá','Xangô','Cigano'], properties: ['Energia','Poder','Proteção contra Má Intenção','Descarrego Sexual'] },
  { key: 'dama_da_noite', label: 'Dama da Noite', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'O aroma forte pode incomodar pessoas sensíveis.', saintTags: ['Ewá','Nanã','Pombo-Gira'], properties: ['Intuição','Atrativo Feminino'] },
  { key: 'erva_doce', label: 'Erva Doce', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá','Oxum'], properties: ['Adoçamento','Romance','Acalmar','Harmonizar'] },
  { key: 'erva_santa_luzia', label: 'Erva de Santa Luzia', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ewá','Iemanjá','Oxum','Oyá'], properties: ['Cristalizar','Prover','Cura'] },
  { key: 'eucalipto', label: 'Eucalipto', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá'], properties: ['Cura Espiritual','Proteção','Saúde','Descarrego Forte'] },
  { key: 'folha_de_fogo', label: 'Folha de Fogo', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Atenção: pode causar queimação/alergia cutânea.', saintTags: ['Exu','Xangô'], properties: ['Quebra Feitiço','Limpeza','Transformação'] },
  { key: 'girassol', label: 'Girassol', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxum','Oyá','Cigano'], properties: ['Anuladora de Eguns','Cristalizar','Intuição'] },
  { key: 'guine', label: 'Guiné', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Atenção: erva tóxica/agressiva; pode causar irritações e é tóxica se ingerida.', saintTags: ['Omolu','Oxóssi','Preto-Velho','Caboclo','Boiadeiro'], properties: ['Cortar Baixo Astral','Barrar Mal','Quebra Feitiço','Descarrego'] },
  { key: 'hortela', label: 'Hortelã', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá','Oxóssi','Oxum','Oyá'], properties: ['Mudanças','Animar','Elevar Astral','Abertura de Caminhos'] },
  { key: 'jasmim', label: 'Jasmim', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ibeji','Iemanjá','Erê'], properties: ['Amor','Sensualidade','Paz','Espiritualidade'] },
  { key: 'levante', label: 'Levante', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxóssi','Xangô'], properties: ['Elevar Vibrações','Força','Liderança','Bons Fluidos'] },
  { key: 'louro', label: 'Louro', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Obá','Oxóssi','Oxumarê','Oyá','Cigano'], properties: ['Prosperidade','Vitória','Atrair Dinheiro','Fartura'] },
  { key: 'maca', label: 'Maçã (Folha/Casca)', classification: 'arvore', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Obá','Oxum','Oyá'], properties: ['Amor','Magnetismo','Prover','Paz no Lar'] },
  { key: 'macela', label: 'Macela', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá'], properties: ['Acalmar','Atrair Amizades','Proteger Lar','Equilibrar'] },
  { key: 'malva', label: 'Malva', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanjá','Oxum'], properties: ['Acalmar','Paz','Auto-Estima','Equilíbrio Mental'] },
  { key: 'mamona', label: 'Mamona', classification: 'arvore', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: suas sementes contêm ricina e são letais se ingeridas. Pode agredir fisicamente na pele.', saintTags: ['Exu','Omolu','Ossain','Bahiano'], properties: ['Limpeza de Caminhos','Quebra Demanda','Descarrego Pesado'] },
  { key: 'manjericao', label: 'Manjericão', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Nanã','Omolu','Oxalá','Oxum','Preto-Velho'], properties: ['Elevação Espiritual','Proteção','Afastar Pessimismo','Dinheiro'] },
  { key: 'manjerona', label: 'Manjerona', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Obá','Oyá','Xangô'], properties: ['Amor Próprio','Proteger Casa','Revigorar'] },
  { key: 'mirra', label: 'Mirra', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'baixo', warningNote: 'Seguro (em resina para queima).', saintTags: ['Xangô'], properties: ['Limpeza Duradoura','Destruir Larvas Astrais','Purificação'] },
  { key: 'patchouly', label: 'Patchouly', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá'], properties: ['Amor','Sensualidade','Intuição','Magnetismo'] },
  { key: 'pata_de_vaca', label: 'Pata de Vaca', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Iemanjá','Nanã','Obá'], properties: ['Aterramento','Materialização','Equilíbrio'] },
  { key: 'peregun', label: 'Peregun (Pau d\'Água)', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Logun-Edé','Nanã','Obá','Ogum','Ossain','Oxóssi','Oyá'], properties: ['Limpeza','Abertura','Defesa','Descarrego'] },
  { key: 'picao_preto', label: 'Picão Preto', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Erva agressiva para banhos.', saintTags: ['Exu','Omolu'], properties: ['Aterramento','Consumir Negatividade','Limpeza'] },
  { key: 'pinhao_roxo', label: 'Pinhão Roxo/Branco', classification: 'arvore', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: muito agressiva/tóxica. Não usar para banho (na cabeça).', saintTags: ['Ogum'], properties: ['Quebra Magia Negra','Defesa','Descarrego Forte','Paralisa Fluxos'] },
  { key: 'pitanga', label: 'Pitanga (Folha)', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oyá'], properties: ['Prosperidade','Movimentação Espiritual'] },
  { key: 'quebra_pedra', label: 'Quebra Demanda / Quebra Pedra', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Exu','Ogum','Xangô'], properties: ['Desmanchar Feitiços','Quebrar Inveja','Aterramento'] },
  { key: 'roma', label: 'Romã (Folha/Casca)', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ogum','Oyá'], properties: ['Proteção contra Inveja','Renovação','Limpeza','Prosperidade'] },
  { key: 'rosas', label: 'Rosas', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ibeji','Yabás','Oxalá','Pombo-Gira'], properties: ['Amor','Pureza','Paz','Harmonia','Sensualidade','Atração'] },
  { key: 'saiao', label: 'Saião / Folha da Costa', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxóssi','Oxalá'], properties: ['Equilíbrio','Limpeza','Calmante','Restaurar Energias'] },
  { key: 'salsa', label: 'Salsa / Salsão', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Exu','Oxóssi'], properties: ['Afastar Obsessores','Defesa','Proteger'] },
  { key: 'salvia', label: 'Sálvia', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá'], properties: ['Proteção','Sabedoria','Purificação','Limpeza'] },
  { key: 'samambaia', label: 'Samambaia', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxóssi','Caboclo'], properties: ['Restabelecer','Purificar','Equilibrar'] },
  { key: 'sao_goncalinho', label: 'São Gonçalinho', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ogum','Oxóssi'], properties: ['Limpeza','Quebra Demanda','Aterramento'] },
  { key: 'trombeteira', label: 'Trombeteira (Saia Branca)', classification: 'flor', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO/LETAL: alcaloides causam taquicardia, boca seca, alucinações e podem levar à morte.', saintTags: ['Magia Torta'], properties: ['Alucinações','Morte'] },
  { key: 'urtiga', label: 'Urtiga', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'alto', warningNote: 'ALTO RISCO: pelos urticantes causam severa irritação, coceira e queimação. Não usar para banho de corpo/cabeça.', saintTags: ['Exu'], properties: ['Ataque','Quebra Feitiço','Limpeza Densa'] },
  // Legado
  { key: 'abre_caminho', label: 'Abre-Caminho', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Atenção: verificar composição; algumas versões contêm ervas agressivas.', saintTags: ['Exu','Ogum'], properties: ['Abertura de Caminhos','Destravamento','Prosperidade','Movimento'] },
  { key: 'acoita_cavalo', label: 'Açoita-Cavalo', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Caboclos','Oxóssi'], properties: ['Resistência','Firmeza','Força','Estrutura'] },
  { key: 'alfavaca', label: 'Alfavaca', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxóssi','Oxum'], properties: ['Harmonia','Equilíbrio','Bem-Estar','Limpeza Suave'] },
  { key: 'amora', label: 'Amora', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxum','Ibeji'], properties: ['Afeto','Vitalidade','Equilíbrio','Doçura'] },
  { key: 'cana_do_brejo', label: 'Cana-do-Brejo', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Nanã','Obaluaiê'], properties: ['Purificação','Desintoxicação','Alívio','Equilíbrio'] },
  { key: 'carqueja', label: 'Carqueja', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Obaluaiê','Nanã'], properties: ['Limpeza','Equilíbrio','Purificação','Resistência'] },
  { key: 'coentro', label: 'Coentro', classification: 'erva', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxóssi','Ogum'], properties: ['Força','Movimento','Abertura','Vitalidade'] },
  { key: 'confrei', label: 'Confrei', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Atenção: uso interno prolongado pode ser hepatotóxico.', saintTags: ['Obaluaiê','Nanã'], properties: ['Regeneração','Cuidado','Proteção','Reparo'] },
  { key: 'espada_de_sao_jorge', label: 'Espada-de-São-Jorge', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Seguro. Não ingerir.', saintTags: ['Ogum','Iansã'], properties: ['Proteção','Barreira Energética','Defesa','Firmeza'] },
  { key: 'espinheira_santa', label: 'Espinheira-Santa', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Oxóssi','Nanã'], properties: ['Proteção','Equilíbrio','Resguardo','Cuidado'] },
  { key: 'jurema_preta', label: 'Jurema Preta', classification: 'arvore', energyTemperature: 'morna', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Caboclos','Oxóssi','Ossain'], properties: ['Firmeza','Ancestralidade','Defesa','Conexão Espiritual'] },
  { key: 'jurubeba', label: 'Jurubeba', classification: 'erva', energyTemperature: 'quente', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Ogum','Exu'], properties: ['Descarrego','Força','Resistência','Movimento'] },
  { key: 'lirio_branco', label: 'Lírio Branco', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'medio', warningNote: 'Seguro.', saintTags: ['Oxalá','Nanã'], properties: ['Serenidade','Purificação','Respeito','Equilíbrio'] },
  { key: 'melissa', label: 'Melissa', classification: 'erva', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxum','Oxalá'], properties: ['Calma','Suavidade','Bem-Estar','Equilíbrio'] },
  { key: 'rosa_vermelha', label: 'Rosa Vermelha', classification: 'flor', energyTemperature: 'morna', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Ibeji','Yabás','Pombo-Gira'], properties: ['Amor','Sensualidade','Atração','Vitalidade'] },
  { key: 'rosas_brancas', label: 'Rosas Brancas', classification: 'flor', energyTemperature: 'fria', allergyRisk: 'baixo', warningNote: 'Seguro.', saintTags: ['Oxalá','Iemanjá','Oxum'], properties: ['Paz','Pureza','Elevação','Harmonia'] },
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
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
EOF

echo "Seed do catalogo de ervas concluido!"
