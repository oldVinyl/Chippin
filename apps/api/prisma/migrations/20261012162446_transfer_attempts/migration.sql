-- CreateTable
CREATE TABLE "TransferAttempt" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "partyEnc" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransferAttempt_providerReference_key" ON "TransferAttempt"("providerReference");

-- CreateIndex
CREATE INDEX "TransferAttempt_jobId_kind_createdAt_idx" ON "TransferAttempt"("jobId", "kind", "createdAt");
