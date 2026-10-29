CREATE TYPE "SubscriptionPeriod" AS ENUM ('MONTHLY', 'SEMIANNUAL', 'ANNUAL', 'CUSTOM');

ALTER TABLE "UserProductAccess"
ADD COLUMN "period" "SubscriptionPeriod" NOT NULL DEFAULT 'MONTHLY';
