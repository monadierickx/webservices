/*
  Warnings:

  - A unique constraint covering the columns `[city,street,number]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Location_city_street_number_key` ON `Location`(`city`, `street`, `number`);
