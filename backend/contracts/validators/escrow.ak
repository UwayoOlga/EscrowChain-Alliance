use aiken/transaction.{ScriptContext}

validator {
  fn escrow(_d: Data, _r: Data, _c: ScriptContext) -> Bool {
    True
  }
}

