;; Airdrop Token Contract
;; - Admin mints and airdrops tokens to early adopters
;; - Users can transfer tokens peer-to-peer
;; - No STX required for token transfers (only gas fees)
;; - Minimal on-chain cost for testnet experiments

(define-constant CONTRACT-OWNER 'SP20YJ8M91WMEK83JXMKR7B85Y2N4YNNF2TBNXXJS)
(define-constant TOKEN-NAME "Airdrop Token")
(define-constant TOTAL-SUPPLY u1000000000) ;; 1 billion tokens

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-ZERO-AMOUNT (err u400))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))
(define-constant ERR-TRANSFER-FAILED (err u500))
(define-constant ERR-INVALID-ADDRESS (err u403))

;; Token state
(define-data-var total-minted uint u0)
(define-map token-balances principal uint)

(define-read-only (get-admin)
  CONTRACT-OWNER)

(define-read-only (get-token-name)
  TOKEN-NAME)

(define-read-only (get-total-supply)
  TOTAL-SUPPLY)

(define-read-only (get-total-minted)
  (var-get total-minted))

(define-read-only (get-balance (who principal))
  (default-to u0 (map-get? token-balances who)))

;; Admin mints tokens (only once, for airdrop distribution)
(define-public (mint (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let
      (
        (current-minted (var-get total-minted))
        (new-total (+ current-minted amount))
      )
      (asserts! (<= new-total TOTAL-SUPPLY) ERR-INSUFFICIENT-BALANCE)
      (map-set token-balances CONTRACT-OWNER amount)
      (var-set total-minted new-total)
      (ok new-total)
    )
  )
)

;; Admin distributes tokens to single recipient
(define-public (airdrop-transfer (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (not (is-eq recipient CONTRACT-OWNER)) ERR-INVALID-ADDRESS)
    (let
      (
        (sender-balance (get-balance CONTRACT-OWNER))
      )
      (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
      (map-set token-balances CONTRACT-OWNER (- sender-balance amount))
      (map-set token-balances recipient (+ (get-balance recipient) amount))
      (ok true)
    )
  )
)

;; Users can transfer tokens peer-to-peer
(define-public (transfer (to principal) (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (not (is-eq tx-sender to)) ERR-INVALID-ADDRESS)
    (let
      (
        (from-balance (get-balance tx-sender))
      )
      (asserts! (>= from-balance amount) ERR-INSUFFICIENT-BALANCE)
      (map-set token-balances tx-sender (- from-balance amount))
      (map-set token-balances to (+ (get-balance to) amount))
      (ok true)
    )
  )
)
