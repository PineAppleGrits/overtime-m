-- CreateIndex
CREATE INDEX "profiles_deletedAt_name_idx" ON "profiles"("deletedAt", "name");

-- CreateIndex
CREATE INDEX "profiles_deletedAt_email_idx" ON "profiles"("deletedAt", "email");

-- CreateIndex
CREATE INDEX "profiles_deletedAt_createdAt_idx" ON "profiles"("deletedAt", "createdAt");
