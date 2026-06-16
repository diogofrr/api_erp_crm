import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type RawHerb = {
  nome: string;
  nomes_alternativos: string[];
  tipo: string | null;
  classificacao: {
    temperatura: string[];
    sexo: string[];
    elemento: string[];
    sistema_fitoterapico: string[];
    outros: string[];
    descricao: string | null;
  };
  risco: {
    tem_risco: boolean;
    tags: string[];
    descricao: string | null;
  };
  orixas: string[];
  orixas_texto: string | null;
  falanges: string[];
  falanges_texto: string | null;
  propriedades_usos: string | null;
  observacoes: string | null;
};

type RawCatalog = { ervas: RawHerb[] };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’"`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const raw = readFileSync(
    join(__dirname, 'herbs-data.json'),
    'utf-8',
  );
  const parsed: RawCatalog = JSON.parse(raw);
  const ervas = parsed.ervas;

  console.log(`Seed: ${ervas.length} ervas para processar`);

  const seenKeys = new Set<string>();

  for (const e of ervas) {
    let key = slugify(e.nome.split('/')[0]);
    if (!key) key = slugify(e.nome);

    let candidate = key;
    let i = 2;
    while (seenKeys.has(candidate)) {
      candidate = `${key}_${i++}`;
    }
    key = candidate;
    seenKeys.add(key);

    const data = {
      key,
      name: e.nome,
      alternativeNames: e.nomes_alternativos ?? [],
      type: e.tipo,
      temperature: e.classificacao?.temperatura ?? [],
      sex: e.classificacao?.sexo ?? [],
      element: e.classificacao?.elemento ?? [],
      systems: e.classificacao?.sistema_fitoterapico ?? [],
      otherTags: e.classificacao?.outros ?? [],
      classDesc: e.classificacao?.descricao,
      hasRisk: !!e.risco?.tem_risco,
      riskTags: e.risco?.tags ?? [],
      riskDesc: e.risco?.descricao,
      orixas: e.orixas ?? [],
      orixasText: e.orixas_texto,
      falanges: e.falanges ?? [],
      falangesText: e.falanges_texto,
      usage: e.propriedades_usos,
      notes: e.observacoes,
    };

    await prisma.herbCatalog.upsert({
      where: { key },
      update: data,
      create: data,
    });
  }

  console.log(`Seed concluído: ${seenKeys.size} ervas em HerbCatalog`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
