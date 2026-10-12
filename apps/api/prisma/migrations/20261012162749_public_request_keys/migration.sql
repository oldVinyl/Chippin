-- CreateTable
CREATE TABLE "PublicRequest" (
    "id" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicRequest_pkey" PRIMARY KEY ("id")
);
