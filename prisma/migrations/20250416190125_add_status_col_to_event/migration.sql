/*
  Warnings:

  - Added the required column `status` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `event` ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'CANCELLED', 'COMPLETED') NOT NULL;
