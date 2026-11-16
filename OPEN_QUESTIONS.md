# Bricks — points ouverts (paramétrables)

Ces points du cahier des charges §12.2 restent ouverts. Valeurs par défaut simples dans le seed / `settings` — modifiables sans changer le code métier.

1. **Parpaing de 10** — rendement et prix absents → type créé avec `blocksPerBag: 0` et prix 0.
2. **Ventes** — comptant/crédit, acomptes, livraison usine vs client, barème hors ville → UI présente ; barème distance = frais saisis (pas de grille fixe encore).
3. **Relevés** — fréquence libre ; facture mensuelle prime ; répartition hebdo au prorata des jours (`allocateMonthlyBillToWeek`).
4. **Paie** — retenues liste incomplète ; CNPS off (`cnpsEnabled: false`) ; avances déduites.
5. **Modes de paiement** — espèces / mobile money / virement à saisir en texte libre pour l’instant.
6. **Autres charges** — catégorie libre (`Expense.category`).
7. **Récap hebdo** — défaut samedi soir (`weekEndsOn: saturday`).
8. **Sites / utilisateurs** — un site seed ; multi-sites via `siteId`.
9. **Seuils d’alerte** — seed initiaux modifiables.
10. **Valorisation pertes** — coût de revient (fabrication) / prix d’achat matière (livraison).
11. **Repli push** — `pushFallbackMinutes: 30`.
