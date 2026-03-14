-- CreateEnum
CREATE TYPE "BatchType" AS ENUM ('REGULAR', 'PROMOTIONAL');

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BatchType" NOT NULL DEFAULT 'REGULAR',
    "price" DECIMAL(65,30),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Batch_eventId_idx" ON "Batch"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_eventId_name_key" ON "Batch"("eventId", "name");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
