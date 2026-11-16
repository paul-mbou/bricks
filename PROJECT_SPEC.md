# Bricks – Cahier des charges pour Cursor AI

Application de gestion de briqueterie · Document à fournir à Cursor comme contexte projet (à copier dans un fichier `PROJECT_SPEC.md` à la racine du dépôt)

## 1. Instructions pour Cursor

Tu es un développeur full-stack senior. Tu vas construire **Bricks**, une application web (mobile-first, installable en PWA) de gestion d'une briqueterie qui fabrique des parpaings (agglos). Lis ce document en entier avant d'écrire du code. Travaille par phases (section 11), valide chaque phase avant de passer à la suivante, écris des tests sur toutes les règles de calcul (section 6) et ne fais aucune hypothèse silencieuse : si un point est ambigu, note-le dans `OPEN_QUESTIONS.md` et choisis la solution la plus simple et paramétrable.

Langue de l'interface : **français**. Code, noms de variables et commentaires techniques : anglais. Devise par défaut : **FCFA (XAF)**, sans décimales, mais configurable.

## 2. Contexte et objectifs

Le client est une briqueterie qui achète du ciment et des granulats (sable, gravier), fabrique différents types de parpaings, les stocke puis les livre ou les vend. Aujourd'hui le suivi est manuel. Les besoins exprimés lors de l'entretien avec le client :

- connaître le stock en temps réel ;
- suivre les livraisons de granulats et de matériaux (ciment) ;
- suivre la consommation d'électricité (« lumière ») et d'eau ;
- savoir combien de parpaings produit un sac de ciment (rendement) ;
- connaître les pertes pendant la fabrication et pendant la livraison ;
- formaliser le circuit fournisseur de ciment : bordereau de livraison → bordereau de réception → validation direction → paiement du fournisseur ;
- recevoir des alertes de stock (ciment et chaque type de parpaing) ;
- obtenir un récapitulatif hebdomadaire avec le **bénéfice calculé automatiquement** ;
- gérer la paie des employés.

**Objectif produit :** donner au gérant et à la direction une vision fiable, chaque semaine, de ce qui est entré, produit, perdu, vendu, dépensé et gagné.

**Besoins ajoutés après l'entretien.** Le propriétaire doit recevoir sur son téléphone, en temps réel et où qu'il soit, des **notifications push** pour les alertes importantes (stocks, livraisons, validations en attente, etc.) ; une **démonstration de présentation** des fonctionnalités s'affiche à la première ouverture ; la technologie imposée est **Astro + React** pour le frontend et **Appwrite** pour le backend.

## 3. Stack technique imposée

- **Frontend :** **Astro** (mode hybride/SSR, adaptateur Node) pour le squelette, le routage, les layouts et les pages ; **React** pour les îlots interactifs (formulaires, tableaux de bord, saisie de production, mises à jour en direct) via `client:load` ou `client:only="react"`. TypeScript strict.
- **UI :** Tailwind CSS + composants React accessibles (shadcn/ui), mobile-first, gros boutons (usage sur téléphone, parfois en atelier).
- **Backend : Appwrite** (Appwrite Cloud, décision du client ; choisir la région la plus proche des utilisateurs et vérifier les quotas du plan pour les Functions, Messaging et le stockage avant la mise en production) : **Auth** (e-mail + mot de passe, rôles via labels ou teams), **Databases** (collections avec permissions par rôle), **Storage** (photos et PDF des bordereaux), **Functions** (logique métier côté serveur, tâches planifiées, génération de PDF), **Messaging** (push, e-mail, SMS), **Realtime** (stocks et alertes mis à jour en direct).
- **SDK :** `appwrite` dans les îlots React ; `node-appwrite` côté serveur (Functions et endpoints Astro). Aucune clé API dans le code client.
- **Validation :** Zod côté client et dans les Functions. **Formulaires :** React Hook Form. **Graphiques :** Recharts.
- **Export :** PDF (récap hebdo, bulletins de paie, bordereaux) et Excel/CSV.
- **Tâches planifiées :** Appwrite Functions avec planification cron (alertes, récap hebdomadaire, rappels d'échéance).
- **Tests :** Vitest (règles métier) + Playwright (parcours clés).
- **PWA :** manifeste + service worker, installable sur l'écran d'accueil ; consultation et saisie hors ligne pour la production et les réceptions, avec file d'attente de synchronisation (connexion potentiellement instable).
- **Notifications push :** voir la section 5.12 (exigence centrale).

**Principes d'architecture.** Les règles de calcul de la section 6 vivent dans un module TypeScript pur et partagé (`/packages/domain`), utilisé par l'interface et par les Functions. Toute écriture sensible (stock, validation direction, paiement, clôture hebdomadaire, paie) passe par une Appwrite Function qui revérifie le rôle de l'appelant ; l'interface ne se fie jamais à elle-même. Avant d'implémenter une fonction Appwrite (Messaging, Realtime, transactions, Push), Cursor lit la documentation Appwrite à jour et fixe les versions des SDK dans le dépôt.

## 4. Rôles et permissions

- **Direction (DG/PDG) / Propriétaire** : accès total, valide les réceptions et autorise les paiements fournisseurs, voit les bénéfices et la paie.
- **Gérant** : saisie de tout, consultation du récap, pas de validation de paiement ; paie en lecture si autorisé par la direction.
- **Magasinier** : réceptions (granulats, ciment), stocks, sorties, inventaires.
- **Chef de production** : saisie de la production, des consommations de ciment et des pertes de fabrication.
- **Comptable / RH** : paie, paiements fournisseurs exécutés, charges.

Chaque action sensible (validation, paiement, ajustement de stock, modification d'une saisie passée) est tracée dans un **journal d'audit** (qui, quand, avant/après).

**Règle transversale.** Tous les paiements (fournisseurs, paie, autres dépenses) exigent l'accord préalable du DG/PDG, enregistré dans l'application (qui, quand, montant) ; sans cette approbation, aucun paiement ne peut passer au statut payé. Un rôle **Secrétaire** s'ajoute : elle saisit les pointages, prépare la paie et paie les fabricants à la semaine ou au mois, une fois l'accord obtenu. Seul le propriétaire reçoit les notifications push.

## 5. Modules fonctionnels

### 5.1 Référentiels (paramétrage)

- **Matières** : ciment (par sac, avec poids du sac), sable, gravier, autres granulats (unité : tonne, m³, camion, sac). Seuil d'alerte par matière.
- **Types de parpaings** : nom (ex. 10, 15, 20 cm ; plein, creux, etc. – liste libre), dimensions, prix de vente unitaire, seuil d'alerte, **rendement par sac de ciment** (nombre de parpaings attendu par sac, paramétrable par type et modifiable avec historique de dates d'effet).
- **Fournisseurs** (ciment et granulats) : coordonnées, matières fournies, conditions de paiement.
- **Clients** : coordonnées, historique d'achats.
- **Employés** : voir 5.9.
- **Compteurs** : compteur d'électricité et d'eau (identifiant, unité kWh / m³, tarif unitaire configurable).

### 5.2 Stock des matières premières

- Stock actuel par matière, calculé à partir des mouvements : entrées (réceptions validées), sorties (consommation en production), ajustements (inventaire, perte, casse).
- Registre de mouvements consultable et filtrable (date, matière, type, utilisateur).
- **Inventaire physique** : saisie du stock compté, calcul de l'écart avec le stock théorique, ajustement justifié (motif obligatoire).
- Valorisation du stock au coût moyen pondéré.

### 5.3 Livraisons de granulats

- Enregistrement de chaque livraison : date, fournisseur, matière, quantité annoncée, quantité réellement reçue, véhicule/chauffeur, prix, photo du bon.
- Calcul automatique de l'**écart** annoncé/reçu et de la **perte à la livraison** (quantité et valeur).
- À la validation, génération d'une entrée de stock.

Granulats confirmés par le client : **pouzzolane** et **terre noire**, livrés par camion de 20 t, 30 t ou 50 t (la terre noire n'existe pas en 50 t), avec un prix par type et par capacité de camion (valeurs en section 12). La quantité annoncée est la capacité du camion ; le magasinier saisit la quantité réellement reçue. Le circuit de 5.4 (bordereau de livraison, bordereau de réception, facture, direction, paiement) s'applique aussi aux granulats.

### 5.4 Livraisons de ciment et circuit fournisseur

Circuit obligatoire, avec statuts et horodatage :

1. **Bordereau de livraison (BL)** déposé par le fournisseur à la livraison : numéro, date, quantité annoncée (sacs pour le ciment, camion pour les granulats), prix unitaire, pièce jointe (photo ou PDF).
2. **Bordereau de réception (BR)** remis par l'entreprise au fournisseur, établi par le magasinier : quantité réellement reçue, sacs abîmés ou refusés, nom du réceptionnaire, photo.
3. **Dépôt de la facture** : le fournisseur joint sa facture au BR et dépose le dossier à la direction ; la facture est numérisée et rattachée au dossier.
4. **Traitement par la direction (DG/PDG)** : compare BL, BR et facture, voit l'écart, valide ou rejette avec commentaire. Après validation, le fournisseur est prévenu de venir toucher son argent (statut À payer).
5. **Paiement du fournisseur** : possible uniquement après validation et avec l'accord du DG/PDG. Enregistrement du montant, du mode de paiement, de la date et de la référence ; paiement partiel autorisé ; suivi du solde dû.

Statuts : `BL_ENREGISTRÉ → RÉCEPTIONNÉ → FACTURE_DÉPOSÉE → VALIDÉ_DIRECTION (ou REJETÉ) → PAYÉ_PARTIELLEMENT → PAYÉ`.

Règles : le stock de ciment n'est augmenté qu'à la réception (quantité du BR) ; le montant à payer est calculé sur la quantité **reçue** et non annoncée, sauf décision contraire de la direction ; tout écart BL/BR génère une alerte. Vue « Dettes fournisseurs » avec échéances.

### 5.5 Production de parpaings et pertes de fabrication

Saisie par séance de production (journalière, par équipe si besoin) :

- date, type de parpaing, **nombre de sacs de ciment utilisés**, quantités de sable/gravier/eau utilisées (optionnel mais recommandé) ;
- parpaings produits (bons) et parpaings **perdus** (cassés, défectueux) avec motif ;
- chef de production.

Calculs automatiques :

- **Production théorique** = sacs utilisés × rendement du type ;
- **Perte de fabrication** = théorique − bons produits (en nombre, en % et en valeur) ;
- **Rendement réel** par sac, comparé au rendement attendu, avec alerte si l'écart dépasse un seuil paramétrable.

À la validation de la séance : sortie de stock des matières consommées et entrée en stock de parpaings finis (bons uniquement).

### 5.6 Stock des produits finis, ventes et livraisons clients

- Stock par type de parpaing (entrées production, sorties ventes, casse).
- **Vente / bon de livraison client** : client, types et quantités, prix, mode de paiement (comptant / crédit), acompte, solde.
- **Perte lors de la livraison client** : à la livraison, saisie de la quantité cassée en route ; elle est déduite du stock, valorisée et rattachée à la livraison (et au chauffeur/véhicule pour analyse).
- Suivi des créances clients.

**Tarification.** Chaque type de parpaing a deux prix : un prix livré en ville (fixe) et un prix départ, sans livraison (valeurs en section 12). Hors de la ville, le prix livré varie selon la distance : la vente prend le prix départ plus des frais de livraison saisis, selon un barème par distance paramétrable. Le prix appliqué est copié sur la ligne de vente, pour que les anciennes ventes ne changent pas quand les prix changent.

### 5.7 Consommation d'électricité et d'eau

- Relevés de compteurs (quotidiens ou hebdomadaires) : index précédent, nouvel index, consommation calculée.
- Coût = consommation × tarif en vigueur ; possibilité d'enregistrer les factures réelles (le montant facturé prime sur l'estimation).
- Indicateurs : coût par 1 000 parpaings produits, comparaison semaine à semaine.
- Contrôles : un index inférieur au précédent est refusé (sauf remplacement de compteur).

**Factures mensuelles.** Les factures d'eau et d'électricité sont saisies à la fin du mois et soustraites comme dépenses de ce mois. Tant qu'elle n'est pas saisie, l'application estime la charge à partir des relevés et affiche un rappel en fin de mois ; une fois la facture saisie, son montant remplace l'estimation et est réparti sur les semaines du mois au prorata des jours (règle modifiable) pour le bénéfice hebdomadaire.

### 5.8 Alertes

Alertes paramétrables, affichées dans l'app (cloche + page Alertes) et envoyées en notification push (voir 5.12) et par e-mail aux rôles concernés :

- **Stock de ciment bas** (seuil en sacs, avec estimation du nombre de jours restants selon la consommation moyenne) ;
- **Stock bas par type de parpaing** (un seuil par type) ;
- stock bas de sable/gravier ;
- écart BL/BR ciment ; BR en attente de validation depuis plus de N jours ;
- facture fournisseur arrivant à échéance ;
- rendement par sac anormalement bas ; taux de perte de fabrication ou de livraison supérieur au seuil ;
- consommation d'eau/électricité anormale (hausse > X % vs moyenne).

Chaque alerte a un statut (nouvelle, vue, traitée), une gravité (info, attention, critique) et ne doit pas être dupliquée tant qu'elle n'est pas résolue.

### 5.9 Gestion de la paie des employés

- **Fiche employé** : identité, poste, date d'embauche, type de contrat (mensuel, hebdomadaire, journalier, à la tâche/au rendement), salaire de base ou taux, coordonnées de paiement.
- **Présences** : pointage journalier simple (présent, absent, demi-journée, congé, heures supplémentaires).
- **Calcul de la paie** par période (semaine ou mois) : salaire de base ou jours travaillés × taux, heures supplémentaires, primes (y compris prime au rendement liée à la production si configurée), **avances/acomptes** et retenues déduits, net à payer.
- Paramètres de cotisations et retenues légales configurables (pas codés en dur ; le taux et la base sont à valider avec le client/comptable).
- **Bulletin de paie PDF** par employé, **état de paie récapitulatif**, historique des paiements, marquage « payé » avec date et mode.
- Le total de la paie de la semaine alimente automatiquement le calcul du bénéfice (section 5.10).

**Contexte confirmé.** Les fabricants et employés sont payés par semaine ou par mois selon leur contrat ; les secrétaires effectuent les paiements après accord du DG/PDG. Les **avances sur salaire** sont autorisées et déduites de la paie suivante ; des **retenues** s'appliquent (liste à compléter avec le client). **Personne n'est déclaré à la CNPS** pour l'instant : les cotisations CNPS sont désactivées par défaut mais paramétrables (taux, plafond, part salariale et patronale) pour être activées plus tard sans modifier le code.

### 5.10 Récapitulatif hebdomadaire et bénéfice

Généré automatiquement **chaque fin de semaine** (jour et heure paramétrables, par défaut samedi soir) et consultable à tout moment pour la semaine en cours. Disponible en PDF, par e-mail et dans l'app. Contenu :

1. **Production** : parpaings produits par type, sacs consommés, rendement réel vs attendu.
2. **Stocks** : matières et parpaings en début/fin de semaine, variations, alertes actives.
3. **Approvisionnements** : livraisons de granulats et de ciment, écarts, montants à payer / payés.
4. **Pertes** : fabrication et livraison, en quantité, % et valeur.
5. **Ventes** : quantités et chiffre d'affaires par type de parpaing, encaissé vs crédit.
6. **Charges** : matières consommées, électricité, eau, paie, autres charges saisies.
7. **Bénéfice de la semaine** et marge (voir formule en section 6), comparaison avec la semaine précédente et la moyenne des 4 dernières semaines.
8. Graphiques de tendance et liste des points d'attention.

Le récap est **figé** (snapshot) une fois clôturé par la direction ; toute correction ultérieure crée une version corrigée, tracée.

### 5.11 Tableau de bord

Page d'accueil : stock du jour (ciment, granulats, chaque type de parpaing) avec code couleur, alertes actives, production du jour/de la semaine, ventes, dettes fournisseurs, créances clients, bénéfice estimé de la semaine en cours.

### 5.12 Notifications push en temps réel (propriétaire)

Le propriétaire reçoit sur son téléphone, où qu'il soit, une notification push à chaque événement important, sans avoir à ouvrir l'application. C'est une exigence centrale du produit.

Événements qui déclenchent une push (destinataire : uniquement le propriétaire pour l'instant ; gravité et destinataires restent configurables) :

- stock de ciment bas ; stock bas d'un type de parpaing ; stock de granulats bas (critique en cas de rupture) ;
- livraison de ciment ou de granulats enregistrée ou réceptionnée ; écart entre bordereau de livraison et bordereau de réception ;
- bordereau de réception en attente de validation direction (action requise : la notification ouvre directement l'écran de validation) ;
- paiement fournisseur arrivant à échéance ou en retard ;
- perte anormale (fabrication ou livraison) ou rendement par sac anormalement bas ;
- consommation d'eau ou d'électricité anormale ;
- récapitulatif hebdomadaire disponible, avec le bénéfice de la semaine dans le texte de la notification ;
- paie de la période prête à être validée.

Fonctionnement :

1. Après sa connexion, le propriétaire autorise les notifications ; l'appareil est enregistré comme **cible push** dans Appwrite Messaging. Un utilisateur peut avoir plusieurs appareils ; la cible est recréée après chaque connexion.
2. Un événement métier (écriture en base ou tâche planifiée) déclenche une Appwrite Function qui crée l'`Alert`, applique l'anti-doublon, puis envoie le message via Appwrite Messaging aux utilisateurs du rôle concerné (par exemple un topic `owner-alerts`).
3. Un appui sur la notification ouvre l'écran concerné (lien profond).
4. Préférences par utilisateur : catégories activées, heures de silence (les alertes critiques passent toujours).
5. Repli : une alerte critique non ouverte après N minutes (paramétrable) déclenche un e-mail, et un SMS en option.
6. Chaque envoi est tracé dans un `NotificationLog` (envoyée, délivrée, ouverte, en échec).

**Point de vigilance pour Cursor.** Le propriétaire utilise un téléphone **Android** : une PWA installée depuis Chrome peut recevoir des push application fermée grâce à son service worker. Cursor choisit le fournisseur push d'Appwrite Messaging le plus fiable pour ce cas (FCM ou Appwrite Push, selon la documentation à jour) et teste la réception **application fermée, écran verrouillé, économie de batterie activée, sur le téléphone réel du propriétaire**. Le résultat est documenté dans le README ; si la livraison n'est pas fiable, Cursor propose une enveloppe mobile légère (par exemple Capacitor) pour le propriétaire seul, sans refaire le reste de l'application.

### 5.13 Démonstration de présentation à la première ouverture

- À la première connexion de chaque utilisateur, une **visite guidée interactive** (4 à 8 étapes, moins de 2 minutes) présente les fonctions clés selon son rôle : tableau de bord et stocks, circuit ciment, production et pertes, alertes et notifications, récapitulatif hebdomadaire et bénéfice, paie (propriétaire et comptable uniquement).
- Étapes en surbrillance sur l'interface réelle (bulles d'aide) avec Suivant, Précédent et Passer.
- **Mode démonstration** : jeu de données fictives, clairement étiqueté DÉMO, isolé des données réelles, pour que la visite ait du contenu avant les premières saisies ; il disparaît à la fin de la visite ou sur demande.
- Composant léger (bibliothèque légère type driver.js ou composant maison), en français, utilisable au doigt et au clavier.
- Progression enregistrée dans le profil Appwrite (`onboardingCompleted`, étape atteinte, version de la visite) ; bouton Revoir la visite dans les paramètres ; une nouvelle version de la visite s'affiche quand des fonctions sont ajoutées.
- Dernière étape pour le propriétaire : demande d'autorisation des notifications avec une explication claire, puis envoi d'une notification de test.

## 6. Règles de calcul (à tester unitairement)

Tous les calculs sont faits côté serveur, dans un module dédié et pur (`/lib/domain`), avec des tests.

- **Production théorique** = sacs de ciment utilisés × rendement par sac (rendement en vigueur à la date de production).
- **Perte de fabrication (nb)** = production théorique − parpaings bons produits. **Taux** = perte / production théorique.
- **Rendement réel par sac** = parpaings bons produits / sacs utilisés.
- **Perte à la livraison (ciment/granulats)** = quantité annoncée au BL − quantité reçue au BR.
- **Perte à la livraison client** = parpaings cassés pendant le transport (saisie).
- **Coût moyen pondéré** d'une matière = (valeur du stock + valeur de l'entrée) / (quantité du stock + quantité de l'entrée).
- **Coût matières d'un parpaing** = coût des matières consommées par la séance / parpaings bons produits.
- **Coût des pertes** = pertes valorisées au coût de revient du parpaing (fabrication) ou au prix d'achat de la matière (livraison).
- **Chiffre d'affaires de la semaine** = somme des ventes livrées de la semaine (le suivi encaissé/crédit est affiché à part).
- **Charges de la semaine** = coût des matières consommées + électricité + eau + paie de la semaine + autres charges.
- **Bénéfice de la semaine = Chiffre d'affaires − Charges de la semaine** (les pertes sont déjà incluses dans le coût des matières consommées ; elles sont affichées séparément pour information). **Marge %** = bénéfice / chiffre d'affaires.
- Afficher aussi une vue « **trésorerie** » (encaissements − décaissements) distincte du bénéfice comptable.

Les semaines suivent un calendrier configurable (lundi à samedi ou dimanche) ; toutes les dates sont stockées en UTC et affichées dans le fuseau du client.

## 7. Modèle de données (point de départ Appwrite Databases)

Entités principales, à créer comme **collections Appwrite** (à affiner), avec les attributs système `$id`, `$createdAt`, `$updatedAt` et un attribut `createdById` partout :

- `User`, `Role`, `AuditLog`
- `Material` (type : CEMENT, SAND, GRAVEL, OTHER ; unité ; seuil d'alerte)
- `BlockType` (dimensions, prix de vente, seuil d'alerte) et `BlockYield` (blockTypeId, blocksPerBag, effectiveFrom)
- `Supplier`, `Customer`
- `StockMovement` (itemType MATERIAL|BLOCK, itemId, quantité signée, motif : RECEPTION, PRODUCTION, SALE, LOSS, ADJUSTMENT, unitCost, référence source)
- `AggregateDelivery` (granulats : annoncé, reçu, écart, prix)
- `CementDelivery` (BL), `CementReception` (BR), `DirectionApproval`, `SupplierPayment`, avec statut du circuit
- `ProductionRun` et `ProductionLine` (type, sacs, produits, perdus, motif)
- `Sale`, `SaleLine`, `CustomerPayment`, `DeliveryLoss`
- `Meter`, `MeterReading`, `UtilityBill`
- `Expense` (autres charges, catégorie)
- `Employee`, `Attendance`, `PayrollPeriod`, `Payslip`, `PayrollAdjustment` (prime, avance, retenue)
- `AlertRule`, `Alert`
- `WeeklyReport` (période, snapshot JSON, statut : BROUILLON | CLÔTURÉ, version)
- `Setting` (devise, jour de clôture hebdo, seuils)

Précisions propres à Appwrite et entités ajoutées :

- **Utilisateurs et rôles** : natifs Appwrite Auth (labels `owner`, `manager`, `storekeeper`, `production`, `accounting`) ; profil étendu dans une collection `Profile` (rôle, `onboardingCompleted`, `onboardingVersion`, préférences de notification).
- **Notifications** : `PushDevice` (utilisateur, cible push Appwrite, plateforme, dernière connexion), `NotificationPreference`, `NotificationLog`.
- **Permissions** : définies par collection et par document, jamais d'écriture ouverte à tous les utilisateurs ; lecture de la paie et du bénéfice limitée aux labels autorisés.
- **Écriture réservée aux Functions** : `AuditLog`, `StockMovement`, `Alert`, `NotificationLog` et les `WeeklyReport` clôturés ne sont jamais modifiables depuis le client.

* **Multi-sites** (prévu dès la conception) : entité `Site` (nom, ville) et `siteId` sur toutes les données opérationnelles (stocks, production, ventes, relevés, employés, paie). Chaque utilisateur est rattaché à un ou plusieurs sites ; le propriétaire voit chaque site et une vue consolidée. Un seul site au départ, sans changement visible tant qu'il n'y en a qu'un.
* **Hors connexion** : saisie locale avec un identifiant unique par opération et synchronisation idempotente vers les Functions, pour éviter tout doublon de mouvement de stock au retour du réseau.

Principe clé : **le stock n'est jamais saisi directement**, il est toujours dérivé des mouvements (journal immuable ; une correction = un mouvement inverse).

## 8. Écrans principaux

1. Connexion · 2. Tableau de bord · 3. Stocks (matières / parpaings, mouvements, inventaire) · 4. Approvisionnements (granulats ; ciment avec circuit BL → BR → validation → paiement) · 5. Production (saisie rapide en 30 secondes, historique, pertes) · 6. Ventes et livraisons clients · 7. Énergie et eau · 8. Alertes · 9. Paie (employés, présences, période de paie, bulletins) · 10. Récaps hebdomadaires · 11. Fournisseurs / Clients · 12. Paramètres et utilisateurs · 13. Journal d'audit · 14. Préférences de notifications · 15. Visite guidée de démonstration.

Exigences UX : navigation mobile en bas d'écran, formulaires courts avec valeurs par défaut intelligentes, scan/photo des bordereaux, états vides explicites, confirmations avant toute action irréversible.

## 9. Exigences non fonctionnelles

- Sécurité : contrôle d'accès par rôle via les permissions Appwrite sur chaque collection et revérification du rôle dans chaque Function, mots de passe hachés, protection CSRF/XSS, sauvegarde quotidienne de la base.
- Intégrité : transactions Appwrite (ou, à défaut, une Function idempotente) pour toute opération touchant le stock ; interdiction de stock négatif (avertissement + justification).
- Performance : pages principales < 2 s sur réseau mobile moyen.
- Données : export CSV/Excel de chaque liste ; import initial des stocks et des employés.
- Qualité : ESLint, Prettier, typage strict, tests des règles de calcul, jeu de données de démonstration (seed) réaliste.
- Accessibilité et lisibilité : contrastes élevés, tailles de police généreuses.

## 10. Critères d'acceptation globaux

- Un ciment reçu avec un écart BL/BR met à jour le stock avec la quantité du BR, déclenche une alerte et ne peut être payé qu'après validation de la direction.
- Une séance de production met à jour en une seule transaction le stock de ciment, de granulats et de parpaings, et affiche perte et rendement réel.
- Le franchissement d'un seuil de stock (ciment ou type de parpaing) crée une alerte unique, visible et envoyée par e-mail.
- Le récap hebdomadaire est généré automatiquement, en PDF, avec un bénéfice égal à CA − charges, vérifiable ligne par ligne.
- La paie d'une période produit les bulletins et alimente le bénéfice de la semaine.
- Aucune donnée sensible (paie, bénéfice) n'est visible par un rôle non autorisé.

* Une alerte critique (par exemple stock de ciment sous le seuil) fait apparaître une notification push sur le téléphone du propriétaire en moins d'une minute, application fermée, et son appui ouvre l'écran concerné ; les doublons sont évités.
* À la première ouverture, un nouvel utilisateur voit la visite guidée adaptée à son rôle, la termine ou la passe, et peut la revoir depuis les paramètres ; les données de démonstration ne polluent jamais les données réelles.
* L'application fonctionne avec Astro + React côté interface et Appwrite côté backend, sans clé secrète dans le code client.

## 11. Plan de développement par phases (prompts à donner à Cursor)

**Phase 0 – Fondations.** « Initialise le dépôt : Astro + îlots React + TypeScript + Tailwind + shadcn/ui, le projet Appwrite (Auth, Databases, Storage, Functions, Messaging) décrit dans le dépôt, l'authentification et les rôles, le journal d'audit, le layout mobile-first, le module partagé `/packages/domain` et le seed de démonstration, selon PROJECT\_SPEC.md. »

**Phase 1 – Référentiels et stocks.** « Implémente les sections 5.1 et 5.2 : référentiels, mouvements de stock immuables, stock dérivé, inventaire avec ajustement justifié, tests unitaires. »

**Phase 2 – Approvisionnements.** « Implémente 5.3 et 5.4 : granulats, et circuit ciment BL → BR → validation direction → paiement avec statuts, écarts, pièces jointes et dettes fournisseurs. »

**Phase 3 – Production et pertes.** « Implémente 5.5 et 5.6 : séances de production, rendement par sac, pertes de fabrication, stock de parpaings, ventes, pertes à la livraison client. Applique les formules de la section 6 avec tests. »

**Phase 4 – Énergie, eau, alertes et push.** « Implémente 5.7, 5.8 et 5.12 : relevés de compteurs, coûts, moteur d'alertes planifié (Appwrite Functions), notifications dans l'app, push Appwrite Messaging vers le téléphone du propriétaire avec lien profond, préférences et e-mail de repli. Teste la réception application fermée sur un vrai téléphone et documente le résultat. »

**Phase 5 – Paie.** « Implémente 5.9 : employés, présences, calcul de paie paramétrable, bulletins PDF, état de paie. »

**Phase 6 – Récap hebdomadaire et bénéfice.** « Implémente 5.10 et 5.11 : agrégation hebdomadaire, calcul du bénéfice, snapshot clôturable, PDF, e-mail planifié, tableau de bord. »

**Phase 7 – Visite guidée et finitions.** « Implémente 5.13 (visite guidée par rôle et mode démonstration), la PWA et la saisie hors ligne, les exports, le durcissement de la sécurité (permissions Appwrite), les tests Playwright des parcours clés et le README. »

## 12. Données confirmées par le client et points encore ouverts

Les réponses du client sont intégrées ci-dessous. Tout chiffre est une **valeur initiale, modifiable dans l'application** (jamais codée en dur) et chargée dans le seed.

### 12.1 Valeurs confirmées par le client

**Parpaings à corps creux : rendement par sac de ciment et prix (FCFA)**

| Type | Parpaings par sac | Prix livré en ville | Prix départ, sans livraison |
| --- | --- | --- | --- |
| Parpaing de 20 | 70 | 350 | 310 |
| Parpaing de 15 | 80 | 250 | 210 |
| Parpaing de 12 | 90 | 225 | 180 |
| Hourdis | 60 | 350 | 310 |

Le parpaing de 10 est cité parmi les produits, mais ni son rendement ni ses prix n'ont été donnés : le créer comme type paramétrable, à compléter. Le prix livré est fixe dans la ville ; hors de la ville il varie selon la distance (voir 5.6).

**Granulats : prix par camion (FCFA, « mil » compris comme millier)**

| Granulat | Camion 20 t | Camion 30 t | Camion 50 t |
| --- | --- | --- | --- |
| Pouzzolane | 80 000 | 130 000 | 170 000 |
| Terre noire | 125 000 | 170 000 | non proposé |

**Règles confirmées**

- **Circuit fournisseur** (ciment et granulats) : le fournisseur dépose un bordereau de livraison, l'entreprise lui remet un bordereau de réception, il y joint sa facture et dépose le dossier à la direction ; après traitement, la direction le prévient et il vient toucher son argent (5.4).
- **Paiements** : tous exigent l'accord du DG/PDG (section 4).
- **Eau et électricité** : factures saisies en fin de mois et soustraites comme dépenses du mois (5.7).
- **Paie** : paiement à la semaine ou au mois par les secrétaires, avances sur salaire autorisées, retenues à préciser, aucune déclaration CNPS pour l'instant (5.9).
- **Propriétaire** : téléphone Android ; seul destinataire des notifications push, pour la plupart des événements importants (5.12).
- **Architecture** : hébergement sur Appwrite Cloud ; plusieurs utilisateurs, plusieurs sites et fonctionnement hors connexion sont prévus dès le départ (sections 3 et 7).

### 12.2 Points encore ouverts

Ces points ne sont pas tranchés : Cursor les rend **paramétrables et modifiables plus tard**, sans bloquer le développement.

1. Rendement et prix du parpaing de 10, et autres types éventuels.
2. Ventes : comptant ou crédit, acomptes, livraison par la briqueterie ou enlèvement par le client, barème des frais de livraison hors ville.
3. Relevés de compteurs d'eau et d'électricité : fréquence (les factures mensuelles font foi) et règle de répartition sur les semaines.
4. Paie : retenues applicables (liste incomplète), plafond et remboursement des avances, primes, heures supplémentaires, date et taux d'activation de la CNPS.
5. Modes de paiement des fournisseurs et de la paie (espèces, mobile money, virement).
6. Autres charges à suivre : carburant, entretien, loyer, transport, etc.
7. Jour, heure, destinataires et canal du récapitulatif hebdomadaire (par défaut samedi soir, dans l'application et par e-mail).
8. Nombre d'utilisateurs, nombre et noms des sites.
9. Seuils d'alerte de chaque matière et de chaque type de parpaing.
10. Valorisation des pertes : au coût de revient ou au prix de vente.
11. Alertes critiques : délai avant l'e-mail ou le SMS de repli.

## 13. Fichier de règles Cursor suggéré (`.cursor/rules/bricks.mdc`)

- Toujours lire PROJECT\_SPEC.md avant de coder une fonctionnalité.
- Le stock est dérivé de mouvements immuables ; ne jamais modifier un stock directement.
- Toute règle de calcul vit dans `/lib/domain`, pure, testée, et documentée par la formule de la section 6.
- Toute mutation sensible passe par une Appwrite Function validée par Zod, vérifie le rôle et écrit dans AuditLog.
- Aucun seuil, taux ou rendement codé en dur : tout vient de la base (paramètres).
- Interface en français, composants mobile-first, aucun texte en dur hors fichier de traductions.
- Commits petits, un par fonctionnalité, avec tests qui passent.

* Aucune clé API Appwrite dans le code client ; les permissions de chaque collection sont explicites et revues à chaque nouvelle collection.
* Tout événement important crée une `Alert` puis une notification push via une Function ; jamais d'envoi de push depuis le client.
* Avant d'utiliser une fonction Appwrite récente (Push, Realtime, transactions), lire la documentation à jour et noter la version du SDK dans le README.
