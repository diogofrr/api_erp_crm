/*
  Warnings:

  - Added the required column `totalTickets` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `event` ADD COLUMN `totalTickets` INTEGER NOT NULL;
