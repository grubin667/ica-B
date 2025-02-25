/*
  Warnings:

  - You are about to drop the column `diskFilename` on the `results` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `results` table. All the data in the column will be lost.
  - You are about to drop the column `onDisk` on the `results` table. All the data in the column will be lost.
  - Added the required column `agencyName` to the `results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bucketName` to the `results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectName` to the `results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgName` to the `results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `results` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `results` DROP COLUMN `diskFilename`,
    DROP COLUMN `filename`,
    DROP COLUMN `onDisk`,
    ADD COLUMN `agencyName` VARCHAR(191) NOT NULL,
    ADD COLUMN `bucketName` VARCHAR(191) NOT NULL,
    ADD COLUMN `objectName` VARCHAR(191) NOT NULL,
    ADD COLUMN `orgName` VARCHAR(191) NOT NULL,
    ADD COLUMN `restatus` ENUM('NEW', 'SCORED', 'REJECTED') NOT NULL DEFAULT 'NEW',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
