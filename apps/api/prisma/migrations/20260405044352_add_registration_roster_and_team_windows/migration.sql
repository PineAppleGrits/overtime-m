-- CreateEnum
CREATE TYPE "RegistrationRosterEntryType" AS ENUM ('INITIAL', 'ADDITION');

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "teamOperationsCloseAt" TIMESTAMP(3),
ADD COLUMN     "teamOperationsOpenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "registration_roster_entries" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "RegistrationRosterEntryType" NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedByProfileId" TEXT,

    CONSTRAINT "registration_roster_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_roster_entries_registrationId_idx" ON "registration_roster_entries"("registrationId");

-- CreateIndex
CREATE INDEX "registration_roster_entries_profileId_idx" ON "registration_roster_entries"("profileId");

-- CreateIndex
CREATE INDEX "registration_roster_entries_addedByProfileId_idx" ON "registration_roster_entries"("addedByProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_roster_entries_registrationId_profileId_key" ON "registration_roster_entries"("registrationId", "profileId");

-- AddForeignKey
ALTER TABLE "registration_roster_entries" ADD CONSTRAINT "registration_roster_entries_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_roster_entries" ADD CONSTRAINT "registration_roster_entries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_roster_entries" ADD CONSTRAINT "registration_roster_entries_addedByProfileId_fkey" FOREIGN KEY ("addedByProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
