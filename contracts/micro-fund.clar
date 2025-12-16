;; Micro Fund - simple community savings pool
;; - Users deposit STX into the vault
;; - Admin can release funds to a recipient (community goal)
;; - Anyone can view balances

(define-constant CONTRACT-OWNER 'SP20YJ8M91WMEK83JXMKR7B85Y2N4YNNF2TBNXXJS) ;; TODO: replace with admin principal
(define-constant MAX-TOKEN-SUPPLY u1000000000) ;; 1,000,000,000 tokens (informational)

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-ZERO-AMOUNT (err u400))
(define-constant ERR-INSUFFICIENT-VAULT (err u402))
(define-constant ERR-TRANSFER-FAILED (err u500))

(define-data-var vault-balance uint u0)             ;; Total STX held in the pool
(define-map balances principal uint)                ;; Tracks contributions per user

(define-read-only (get-admin)
  CONTRACT-OWNER)

(define-read-only (get-balance (who principal))
  (default-to u0 (map-get? balances who)))

(define-read-only (get-vault-balance)
  (var-get vault-balance))

(define-read-only (get-contract-balance)
  (stx-get-balance (as-contract tx-sender)))

(define-public (deposit (amount uint))
  ;; User deposits STX into the contract vault
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (match (stx-transfer? amount tx-sender (as-contract tx-sender))
      transfer-ok
        (let
          (
            (current (default-to u0 (map-get? balances tx-sender)))
            (new-total (+ current amount))
          )
          (map-set balances tx-sender new-total)
          (var-set vault-balance (+ (var-get vault-balance) amount))
          (ok new-total)
        )
      transfer-err ERR-TRANSFER-FAILED)))

(define-public (withdraw (recipient principal) (amount uint))
  ;; Admin-only withdrawal to release funds for community goals
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (>= (var-get vault-balance) amount) ERR-INSUFFICIENT-VAULT)
    (match (stx-transfer? amount (as-contract tx-sender) recipient)
      transfer-ok
        (begin
          (var-set vault-balance (- (var-get vault-balance) amount))
          (ok amount))
      transfer-err ERR-TRANSFER-FAILED)))
