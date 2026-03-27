-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'HERBMASTER';

-- CreateTable
CREATE TABLE "HerbCatalog" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "energyTemperature" TEXT NOT NULL,
    "allergyRisk" TEXT NOT NULL,
    "warningNote" TEXT NOT NULL DEFAULT '',
    "saintTags" TEXT[],
    "properties" TEXT[],

    CONSTRAINT "HerbCatalog_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "HerbMarker" (
    "id" TEXT NOT NULL,
    "herbKey" TEXT NOT NULL,
    "herbName" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "energyTemperature" TEXT NOT NULL,
    "allergyRisk" TEXT NOT NULL,
    "warningNote" TEXT NOT NULL DEFAULT '',
    "saintTags" TEXT[],
    "properties" TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "addressLabel" TEXT NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HerbMarker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HerbMarker_status_idx" ON "HerbMarker"("status");

-- CreateIndex
CREATE INDEX "HerbMarker_updatedAt_idx" ON "HerbMarker"("updatedAt");

-- CreateIndex
CREATE INDEX "HerbMarker_herbKey_idx" ON "HerbMarker"("herbKey");

-- AddForeignKey
ALTER TABLE "HerbMarker" ADD CONSTRAINT "HerbMarker_herbKey_fkey" FOREIGN KEY ("herbKey") REFERENCES "HerbCatalog"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
