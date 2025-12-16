# Stacks Micro Fund

Simple community micro-savings vault on Stacks.

- Users deposit STX into a shared vault
- Admin can withdraw funds to a recipient for community goals
- Anyone can read balances
- Informational max token supply: 1,000,000,000 (non-transferable placeholder)

## Contract

File: contracts/micro-fund.clar

### Public functions
- `deposit(amount)` — user deposits STX (must be > 0)
- `withdraw(recipient, amount)` — **admin-only**, releases STX from the vault
- `get-balance(who)` — view a user’s contributed balance
- `get-vault-balance()` — view total vault balance
- `get-contract-balance()` — on-chain STX held by the contract
- `get-admin()` — returns admin principal

### Admin setup
Set your admin principal in `CONTRACT-OWNER` at the top of `contracts/micro-fund.clar`.

## Quick start
```bash
cd stacks-micro-fund
clarinet --version # use Clarinet 4.x
clarinet console  # optional: inspect
clarinet check    # type check contract
```

## Deploy

### Configure network (Testnet recommended first)
Edit `settings/Testnet.toml` and add your mnemonic under `[accounts.deployer]`.

### Deploy to testnet
```bash
clarinet deployments apply --testnet
```

### Deploy to mainnet
```bash
clarinet deployments apply --mainnet
```
Budget: keep at least 2 STX. Estimated deploy fee ~0.1 STX; 100 tx (~0.5–1 STX) fits under 2 STX.

## Using the contract

### Deposit (attach STX amount)
Call `deposit` with `amount` and attach the same STX in the transaction.

### Withdraw (admin only)
Call `withdraw(recipient, amount)` to release funds.

### Read balances
- `get-balance(who)`
- `get-vault-balance()`
- `get-contract-balance()`

## Cost notes
- Deploy: ~0.08–0.12 STX (varies with fee rate)
- Each `deposit`/`withdraw`: standard STX transfer fee (~0.005–0.02 STX depending on mempool); fits well within 2 STX for ~100 tx.

## Testing suggestions (simnet)
```bash
clarinet console
;; inside console
(contract-call? .micro-fund deposit u100000)
(contract-call? .micro-fund get-balance tx-sender)
```

## Security notes
- Admin-only withdraw guarded by `CONTRACT-OWNER`
- Validates amount > 0 and sufficient vault balance
- Tracks vault balance; uses on-chain balance for external verification

## Checklist before mainnet
- [ ] Set `CONTRACT-OWNER` to your principal
- [ ] Fund deployer account
- [ ] Run `clarinet check`
- [ ] Deploy with `--testnet`, then `--mainnet`
