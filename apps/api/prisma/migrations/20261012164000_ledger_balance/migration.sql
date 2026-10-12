ALTER TABLE "LedgerEntry" ADD CONSTRAINT ledger_amount_direction CHECK (
  (type IN ('CONTRIBUTION','RECOVERY','PAYOUT_REVERSAL') AND "amountMinor" > 0) OR
  (type IN ('FEE','PAYOUT','REFUND') AND "amountMinor" < 0)
);
CREATE FUNCTION ledger_nonnegative() RETURNS trigger AS $$
DECLARE total BIGINT;
BEGIN
  PERFORM id FROM "Pot" WHERE id = NEW."potId" FOR UPDATE;
  SELECT COALESCE(SUM("amountMinor"),0) INTO total FROM "LedgerEntry" WHERE "potId" = NEW."potId";
  IF total < 0 THEN RAISE EXCEPTION 'Ledger balance cannot be negative'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ledger_balance_guard AFTER INSERT ON "LedgerEntry" FOR EACH ROW EXECUTE FUNCTION ledger_nonnegative();
