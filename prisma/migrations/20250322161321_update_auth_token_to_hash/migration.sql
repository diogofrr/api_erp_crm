/*
  Warnings:

  - You are about to drop the column `token` on the `authtoken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `AuthToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `AuthToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `AuthToken_token_key` ON `authtoken`;

-- AlterTable
ALTER TABLE `authtoken` DROP COLUMN `token`,
    ADD COLUMN `tokenHash` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AuthToken_tokenHash_key` ON `AuthToken`(`tokenHash`);
