use aiken/transaction.{ScriptContext, Transaction}
use aiken/transaction/credential.{VerificationKeyCredential}
use aiken/transaction/value
use aiken/list
use aiken/hash.{Blake2b_224, Hash}

// ── Types ──────────────────────────────────────────────────────────────────

type PubKeyHash =
  Hash<Blake2b_224, VerificationKey>

/// The datum locked with every escrow UTXO.
/// All amounts are in Lovelace (1 ADA = 1_000_000 Lovelace).
type EscrowDatum {
  lease_id: ByteArray,
  landlord_pkh: PubKeyHash,
  tenant_pkh: PubKeyHash,
  arbitrator_pkh: PubKeyHash,
  rent_amount: Int,
  deposit_amount: Int,
}

/// The redeemer that dictates how escrow funds are unlocked.
type EscrowRedeemer {
  /// index 0 — Landlord collects monthly rent
  CollectRent
  /// index 1 — Landlord refunds security deposit to tenant (lease ended cleanly)
  RefundDeposit
  /// index 2 — Both parties co-sign: rent→landlord, deposit→tenant (mutual completion)
  CompleteLease
  /// index 3 — Either party raises a dispute; all funds route to arbitrator
  Dispute
}

// ── Helpers ────────────────────────────────────────────────────────────────

/// Returns True if the given public key hash is in the transaction's required signatories.
fn signed_by(tx: Transaction, pkh: PubKeyHash) -> Bool {
  list.has(tx.extra_signatories, pkh)
}

/// Sums all lovelace paid to outputs whose payment credential matches the given PKH.
fn lovelace_to(tx: Transaction, pkh: PubKeyHash) -> Int {
  let cred = VerificationKeyCredential(pkh)
  list.foldl(
    tx.outputs,
    0,
    fn(output, acc) {
      if output.address.payment_credential == cred {
        acc + value.lovelace_of(output.value)
      } else {
        acc
      }
    },
  )
}

// ── Validator ──────────────────────────────────────────────────────────────

validator {
  fn escrow(datum: EscrowDatum, redeemer: EscrowRedeemer, ctx: ScriptContext) -> Bool {
    let tx = ctx.transaction

    when redeemer is {
      // ── CollectRent ────────────────────────────────────────────────────
      // Only the landlord may spend this redeemer.
      // The landlord must receive at least rent_amount in this transaction.
      CollectRent -> {
        let landlord_signed = signed_by(tx, datum.landlord_pkh)
        let landlord_receives = lovelace_to(tx, datum.landlord_pkh) >= datum.rent_amount
        landlord_signed && landlord_receives
      }

      // ── RefundDeposit ─────────────────────────────────────────────────
      // Landlord initiates deposit refund at lease end (no dispute).
      // Landlord must sign; the tenant must receive at least deposit_amount.
      RefundDeposit -> {
        let landlord_signed = signed_by(tx, datum.landlord_pkh)
        let tenant_receives = lovelace_to(tx, datum.tenant_pkh) >= datum.deposit_amount
        landlord_signed && tenant_receives
      }

      // ── CompleteLease ─────────────────────────────────────────────────
      // Mutual lease completion: requires BOTH parties' signatures.
      // Rent is released to landlord; deposit is returned to tenant.
      CompleteLease -> {
        let landlord_signed = signed_by(tx, datum.landlord_pkh)
        let tenant_signed = signed_by(tx, datum.tenant_pkh)
        let landlord_receives = lovelace_to(tx, datum.landlord_pkh) >= datum.rent_amount
        let tenant_receives = lovelace_to(tx, datum.tenant_pkh) >= datum.deposit_amount
        landlord_signed && tenant_signed && landlord_receives && tenant_receives
      }

      // ── Dispute ───────────────────────────────────────────────────────
      // Either party may raise a dispute.
      // All escrow funds (rent + deposit) must route to the arbitrator's address.
      // The arbitrator will resolve off-chain and release accordingly.
      Dispute -> {
        let raised_by_landlord = signed_by(tx, datum.landlord_pkh)
        let raised_by_tenant = signed_by(tx, datum.tenant_pkh)
        let total = datum.rent_amount + datum.deposit_amount
        let arbitrator_receives = lovelace_to(tx, datum.arbitrator_pkh) >= total
        (raised_by_landlord || raised_by_tenant) && arbitrator_receives
      }
    }
  }
}
