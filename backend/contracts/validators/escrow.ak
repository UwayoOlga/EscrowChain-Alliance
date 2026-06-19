use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{Transaction, ScriptContext}
use aiken/transaction/credential.{VerificationKey}

type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>

type Datum {
  lease_id: ByteArray,
  landlord: VerificationKeyHash,
  tenant: VerificationKeyHash,
  arbitrator: VerificationKeyHash,
  rent_amount: Int,
  deposit_amount: Int,
}

type Redeemer {
  CollectRent
  RefundDeposit
  CompleteLease
  DisputeResolution
}

validator {
  fn escrow(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool {
    let Transaction { extra_signatories, .. } = context.transaction

    // Helper: Checks if at least 2 of the 3 parties signed
    let landlord_signed = list.has(extra_signatories, datum.landlord)
    let tenant_signed = list.has(extra_signatories, datum.tenant)
    let arbitrator_signed = list.has(extra_signatories, datum.arbitrator)

    when redeemer is {
      CollectRent ->
        // Usually Landlord + Tenant, or Landlord + Arbitrator if tenant refuses
        (landlord_signed && tenant_signed) || (landlord_signed && arbitrator_signed)

      RefundDeposit ->
        // Usually Tenant + Landlord, or Tenant + Arbitrator if landlord refuses
        (tenant_signed && landlord_signed) || (tenant_signed && arbitrator_signed)

      CompleteLease ->
        // Standard exit requires consensus
        landlord_signed && tenant_signed

      DisputeResolution ->
        // Arbitrator overrules and decides based on evidence
        // Requires Arbitrator + either party
        arbitrator_signed && (landlord_signed || tenant_signed)
    }
  }
}
