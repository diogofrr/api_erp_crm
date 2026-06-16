-- DropForeignKey + drop old denormalized data
ALTER TABLE "HerbMarker" DROP CONSTRAINT IF EXISTS "HerbMarker_herbKey_fkey";

-- Wipe markers (denormalized columns no longer compatible)
TRUNCATE TABLE "HerbMarker";

-- Drop denormalized columns from HerbMarker
ALTER TABLE "HerbMarker"
  DROP COLUMN IF EXISTS "herbName",
  DROP COLUMN IF EXISTS "classification",
  DROP COLUMN IF EXISTS "energyTemperature",
  DROP COLUMN IF EXISTS "allergyRisk",
  DROP COLUMN IF EXISTS "warningNote",
  DROP COLUMN IF EXISTS "saintTags",
  DROP COLUMN IF EXISTS "properties";

-- Rewrite HerbCatalog to match data.json schema
DROP TABLE IF EXISTS "HerbCatalog" CASCADE;

CREATE TABLE "HerbCatalog" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alternativeNames" TEXT[],
    "type" TEXT,
    "temperature" TEXT[],
    "sex" TEXT[],
    "element" TEXT[],
    "systems" TEXT[],
    "otherTags" TEXT[],
    "classDesc" TEXT,
    "hasRisk" BOOLEAN NOT NULL DEFAULT false,
    "riskTags" TEXT[],
    "riskDesc" TEXT,
    "orixas" TEXT[],
    "orixasText" TEXT,
    "falanges" TEXT[],
    "falangesText" TEXT,
    "usage" TEXT,
    "notes" TEXT,

    CONSTRAINT "HerbCatalog_pkey" PRIMARY KEY ("key")
);

-- Recreate FK
ALTER TABLE "HerbMarker"
  ADD CONSTRAINT "HerbMarker_herbKey_fkey"
  FOREIGN KEY ("herbKey") REFERENCES "HerbCatalog"("key")
  ON DELETE RESTRICT ON UPDATE CASCADE;
