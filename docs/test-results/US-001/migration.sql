-- CreateEnum
CREATE TYPE "Vehicle" AS ENUM ('MOTO', 'BICI', 'EBIKE', 'MONOPATTINO');

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "vehicle" "Vehicle" NOT NULL DEFAULT 'MOTO';

