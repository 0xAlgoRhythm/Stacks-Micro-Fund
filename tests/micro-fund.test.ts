import { Clarinet, Tx, Chain, Account } from "@hirosystems/clarinet-sdk";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

Clarinet.test({
  name: "deposit increases user and vault balances",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    const amount = 100_000n; // 0.1 STX in microstacks
    const block = chain.mineBlock([
      Tx.contractCall(
        "micro-fund",
        "deposit",
        ["u" + amount.toString()],
        user.address,
        amount // attach matching STX
      ),
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[0].events.expectSTXTransferEvent(amount, user.address, `${deployer.address}.micro-fund`);

    const balance = chain.callReadOnlyFn("micro-fund", "get-balance", [user.address], user.address);
    balance.result.expectUint(amount);

    const vault = chain.callReadOnlyFn("micro-fund", "get-vault-balance", [], user.address);
    vault.result.expectUint(amount);
  },
});

Clarinet.test({
  name: "admin withdraw reduces vault",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_2")!;

    const depositAmount = 200_000n;
    const withdrawAmount = 150_000n;

    const block1 = chain.mineBlock([
      Tx.contractCall(
        "micro-fund",
        "deposit",
        ["u" + depositAmount.toString()],
        deployer.address,
        depositAmount
      ),
    ]);
    block1.receipts[0].result.expectOk();

    const block2 = chain.mineBlock([
      Tx.contractCall(
        "micro-fund",
        "withdraw",
        [recipient.address, "u" + withdrawAmount.toString()],
        deployer.address
      ),
    ]);

    block2.receipts[0].result.expectOk();
    block2.receipts[0].events.expectSTXTransferEvent(withdrawAmount, `${deployer.address}.micro-fund`, recipient.address);

    const vault = chain.callReadOnlyFn("micro-fund", "get-vault-balance", [], deployer.address);
    vault.result.expectUint(depositAmount - withdrawAmount);
  },
});
