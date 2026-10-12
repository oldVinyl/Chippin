CREATE FUNCTION reject_ledger_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are append-only. Record a compensating entry instead.';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ledger_append_only BEFORE UPDATE OR DELETE ON "LedgerEntry"
FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
ALTER TABLE "Contribution" ADD CONSTRAINT contribution_positive CHECK ("amountMinor" > 0 AND "feeMinor" >= 0);
ALTER TABLE "Payout" ADD CONSTRAINT payout_positive CHECK ("amountMinor" > 0);
ALTER TABLE "Refund" ADD CONSTRAINT refund_positive CHECK ("amountMinor" > 0);
CREATE FUNCTION immutable_provider_instruction() RETURNS trigger AS $$
BEGIN
  IF NEW."providerReference" <> OLD."providerReference" OR NEW."amountMinor" <> OLD."amountMinor" THEN
    RAISE EXCEPTION 'Provider reference and amount are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER payout_instruction_immutable BEFORE UPDATE ON "Payout" FOR EACH ROW EXECUTE FUNCTION immutable_provider_instruction();
CREATE TRIGGER refund_instruction_immutable BEFORE UPDATE ON "Refund" FOR EACH ROW EXECUTE FUNCTION immutable_provider_instruction();
CREATE TRIGGER contribution_instruction_immutable BEFORE UPDATE ON "Contribution" FOR EACH ROW EXECUTE FUNCTION immutable_provider_instruction();
CREATE FUNCTION contribution_state_guard() RETURNS trigger AS $$
BEGIN
  IF OLD.status <> NEW.status AND NOT (
    (OLD.status = 'CREATED' AND NEW.status IN ('PENDING','SUCCESSFUL','FAILED')) OR
    (OLD.status = 'PENDING' AND NEW.status IN ('SUCCESSFUL','FAILED','EXPIRED')) OR
    (OLD.status = 'SUCCESSFUL' AND NEW.status = 'REFUNDED')
  ) THEN RAISE EXCEPTION 'Invalid contribution state transition'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER contribution_state_one_way BEFORE UPDATE ON "Contribution" FOR EACH ROW EXECUTE FUNCTION contribution_state_guard();
