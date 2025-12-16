import { describe, it, beforeEach, expect } from "vitest";
import { initSimnet, tx, type Simnet } from "@stacks/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";

let simnet: Simnet;

beforeEach(async () => {
  simnet = await initSimnet();
});

const getAccount = (name: string) => {
  const account = simnet.getAccounts().get(name);
  if (!account) throw new Error(`missing account: ${name}`);
  return account;
};

describe("airdrop-token", () => {
  it("admin can mint tokens", () => {
    const deployer = getAccount("deployer");
    const amount = 1_000_000n;

    const [receipt] = simnet.mineBlock([
      tx.callPublicFn("micro-fund", "mint", [Cl.uint(amount)], deployer.address),
    ]);

    expect(receipt.result.type).toBe(ClarityType.ResponseOk);
    expect(Cl.prettyPrint(receipt.result)).toBe(`(ok u${amount})`);

    const totalMinted = simnet.getDataVar("micro-fund", "total-minted");
    expect(totalMinted).toEqual(Cl.uint(amount));

    const adminBalance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(deployer.address));
    expect(adminBalance).toEqual(Cl.uint(amount));
  });

  it("admin can airdrop tokens to early adopters", () => {
    const deployer = getAccount("deployer");
    const user1 = getAccount("wallet_1");
    const user2 = getAccount("wallet_2");
    const user3 = getAccount("wallet_3");
    const mintAmount = 1_000_000n;

    // Mint tokens
    simnet.mineBlock([
      tx.callPublicFn("micro-fund", "mint", [Cl.uint(mintAmount)], deployer.address),
    ]);

    // Airdrop to early adopters
    const airdrops = [
      [Cl.standardPrincipal(user1.address), Cl.uint(300_000n)],
      [Cl.standardPrincipal(user2.address), Cl.uint(300_000n)],
      [Cl.standardPrincipal(user3.address), Cl.uint(300_000n)],
    ];

    const results = simnet.mineBlock(
      airdrops.map(([recipient, amount]) =>
        tx.callPublicFn("micro-fund", "airdrop-transfer", [recipient, amount], deployer.address)
      )
    );

    // Check all airdrops succeeded
    for (const result of results) {
      expect(result.result.type).toBe(ClarityType.ResponseOk);
    }

    // Check balances
    const user1Balance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(user1.address));
    expect(user1Balance).toEqual(Cl.uint(300_000n));

    const user2Balance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(user2.address));
    expect(user2Balance).toEqual(Cl.uint(300_000n));

    const user3Balance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(user3.address));
    expect(user3Balance).toEqual(Cl.uint(300_000n));
  });

  it("user can transfer tokens to another user", () => {
    const deployer = getAccount("deployer");
    const user1 = getAccount("wallet_1");
    const user2 = getAccount("wallet_2");
    const mintAmount = 1_000_000n;
    const transferAmount = 100_000n;

    // Mint tokens
    simnet.mineBlock([
      tx.callPublicFn("micro-fund", "mint", [Cl.uint(mintAmount)], deployer.address),
    ]);

    // Transfer from deployer to user1
    simnet.mineBlock([
      tx.callPublicFn("micro-fund", "airdrop-transfer", [Cl.standardPrincipal(user1.address), Cl.uint(transferAmount)], deployer.address),
    ]);

    // Check user1 balance
    const user1Balance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(user1.address));
    expect(user1Balance).toEqual(Cl.uint(transferAmount));

    // Transfer from user1 to user2
    const [receipt] = simnet.mineBlock([
      tx.callPublicFn("micro-fund", "transfer", [Cl.standardPrincipal(user2.address), Cl.uint(50_000n)], user1.address),
    ]);

    expect(receipt.result.type).toBe(ClarityType.ResponseOk);

    const user2Balance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(user2.address));
    expect(user2Balance).toEqual(Cl.uint(50_000n));

    const updatedUser1Balance = simnet.getMapEntry("micro-fund", "token-balances", Cl.standardPrincipal(user1.address));
    expect(updatedUser1Balance).toEqual(Cl.uint(transferAmount - 50_000n));
  });

  it("transfer rejects zero amount", () => {
    const deployer = getAccount("deployer");
    const user1 = getAccount("wallet_1");

    const [receipt] = simnet.mineBlock([
      tx.callPublicFn("micro-fund", "transfer", [Cl.standardPrincipal(user1.address), Cl.uint(0)], deployer.address),
    ]);

    expect(receipt.result.type).toBe(ClarityType.ResponseErr);
    expect(Cl.prettyPrint(receipt.result)).toBe("(err u400)");
  });

  it("transfer rejects insufficient balance", () => {
    const deployer = getAccount("deployer");
    const user1 = getAccount("wallet_1");
    const user2 = getAccount("wallet_2");

    // Give user1 some tokens
    simnet.mineBlock([
      tx.callPublicFn("micro-fund", "mint", [Cl.uint(100_000n)], deployer.address),
    ]);

    simnet.mineBlock([
      tx.callPublicFn("micro-fund", "airdrop-transfer", [Cl.standardPrincipal(user1.address), Cl.uint(50_000n)], deployer.address),
    ]);

    // Try to transfer more than user1 has
    const [receipt] = simnet.mineBlock([
      tx.callPublicFn("micro-fund", "transfer", [Cl.standardPrincipal(user2.address), Cl.uint(60_000n)], user1.address),
    ]);

    expect(receipt.result.type).toBe(ClarityType.ResponseErr);
    expect(Cl.prettyPrint(receipt.result)).toBe("(err u402)");
  });

  it("non-admin cannot mint tokens", () => {
    const user = getAccount("wallet_1");

    const [receipt] = simnet.mineBlock([
      tx.callPublicFn("micro-fund", "mint", [Cl.uint(100_000n)], user.address),
    ]);

    expect(receipt.result.type).toBe(ClarityType.ResponseErr);
    expect(Cl.prettyPrint(receipt.result)).toBe("(err u401)");
  });

  it("non-admin cannot airdrop tokens", () => {
    const user1 = getAccount("wallet_1");
    const user2 = getAccount("wallet_2");

    const [receipt] = simnet.mineBlock([
      tx.callPublicFn("micro-fund", "airdrop-transfer", [Cl.standardPrincipal(user2.address), Cl.uint(100_000n)], user1.address),
    ]);

    expect(receipt.result.type).toBe(ClarityType.ResponseErr);
    expect(Cl.prettyPrint(receipt.result)).toBe("(err u401)");
  });
});
