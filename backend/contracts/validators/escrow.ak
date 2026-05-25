use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{Transaction, ScriptContext, Spend}
use aiken/transaction/credential.{VerificationKey}

type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>

type Datum {
  landlord: VerificationKeyHash,
  tenant: VerificationKeyHash,
  rent_amount: Int,
  deposit_amount: Int,
}

type Redeemer {
  CollectRent
  RefundDeposit
  CompleteLease
}

validator {
  fn escrow(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool {
    let Transaction { extra_signatories, .. } = context.transaction

    when redeemer is {
      CollectRent ->
        // Landlord collects rent; requires both signatures for security in this model
        list.has(extra_signatories, datum.landlord) && list.has(
          extra_signatories,
          datum.tenant,
        )
      RefundDeposit ->
        // Tenant gets deposit back; requires landlord approval
        list.has(extra_signatories, datum.tenant) && list.has(
          extra_signatories,
          datum.landlord,
        )
      CompleteLease ->
        // Normal completion; both agree to release all funds as per agreement
        list.has(extra_signatories, datum.landlord) && list.has(
          extra_signatories,
          datum.tenant,
        )
    }
  }
}
