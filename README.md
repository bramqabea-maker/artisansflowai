# ArtisanFlow AI

Application React/Vite pour centraliser les demandes clients et préparer des devis pour les artisans.

## Ce qui est inclus

- Tableau de bord calculé à partir des demandes réellement saisies (aucune fausse demande préchargée).
- Gestion des demandes : ajout, recherche, filtre, changement de statut, suppression et export CSV.
- Création de devis avec lignes modifiables, calcul HT/TVA/TTC et impression en PDF depuis le navigateur.
- Paramètres de l'entreprise.
- Page Abonnement avec trois offres configurables : Découverte (gratuit), Pro (19 €/mois) et Équipe (39 €/mois).
- Limite de 5 demandes sur l'offre Découverte.
- Liens Stripe configurables pour ouvrir une page de paiement hébergée.
- Connexion et création de compte par e-mail/mot de passe avec Supabase Auth.
- Chaque compte a un espace local séparé ; les demandes en base Supabase sont protégées par RLS.

## Démarrage sous Windows

1. Installe Node.js LTS depuis https://nodejs.org/.
2. Décompresse le ZIP puis ouvre le dossier `artisanflow-ai` dans VS Code ou CMD.
3. Exécute :

```powershell
npm install
npm run dev
```

4. Ouvre http://localhost:5173.

## Abonnements et Stripe

La page Abonnement est intégrée, mais le paiement réel n'est pas activé par défaut.

1. Crée un compte Stripe et configure deux produits avec prix récurrents mensuels (Pro et Équipe).
2. Crée un Payment Link Stripe pour chaque prix.
3. Copie `.env.example` vers `.env` et renseigne :

```env
VITE_STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/ton_lien_pro
VITE_STRIPE_PAYMENT_LINK_BUSINESS=https://buy.stripe.com/ton_lien_equipe
```

4. Redémarre Vite après modification du fichier `.env`.

Important : ce branchement ouvre les liens Stripe, mais ne confirme pas automatiquement le paiement et ne synchronise pas l'état d'abonnement. Pour vendre en production, il faut ajouter un backend sécurisé avec webhooks Stripe, vérification des paiements et association de l'abonnement au compte utilisateur. Ne considère pas un forfait choisi dans le navigateur comme une preuve de paiement.

## Connexion et mots de passe (obligatoire pour utiliser l'application)

L'écran de connexion est maintenant intégré. Il n'existe pas de mot de passe universel codé dans le projet : chaque entreprise utilise son propre e-mail et son propre mot de passe. Supabase vérifie les identifiants ; les mots de passe ne sont ni écrits dans le code ni stockés dans le navigateur par l'application. Un mauvais mot de passe bloque la connexion.

1. Crée un projet sur https://supabase.com/.
2. Dans Project Settings > API, copie l'URL du projet et la clé publique anon/publishable.
3. Dans le dossier du projet, copie `.env.example` et nomme la copie `.env`. Remplis `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
4. Dans Supabase > SQL Editor, exécute `supabase/schema.sql`.
5. Dans Authentication > URL Configuration, ajoute l'adresse de ton site dans les URL autorisées (en local : `http://localhost:5173`).
6. Redémarre le serveur avec `npm run dev`.
7. Sur l'écran ArtisanFlow, choisis « Créer un compte entreprise », inscris l'e-mail et un mot de passe d'au moins 8 caractères, puis confirme l'e-mail si Supabase le demande.

Pour donner un accès à une entreprise précise sans laisser tout le monde s'inscrire, désactive les inscriptions publiques dans Supabase Authentication > Providers > Email, puis crée/invite les utilisateurs depuis Supabase Authentication > Users. Transmets à chaque entreprise son adresse e-mail et un mot de passe temporaire par un canal privé, et demande-lui de le changer. Ne partage jamais un mot de passe commun entre plusieurs entreprises.

**Important :** les politiques RLS du schéma isolent les demandes dans la base par utilisateur. Ne désactive jamais RLS et ne mets jamais la clé `service_role` dans `.env` côté navigateur.

## Supabase

1. Crée un projet Supabase.
2. Copie `.env.example` vers `.env`.
3. Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec la clé publique anon/publishable uniquement.
4. Exécute `supabase/schema.sql` dans l'éditeur SQL Supabase.
5. Configure une authentification avant toute mise en production.

Ne mets jamais la clé `service_role` dans une variable `VITE_` ni dans le navigateur.

## Limites connues avant commercialisation

- Les abonnements affichés et leurs limites restent une maquette locale : ils ne sont pas encore vérifiés côté serveur et ne doivent pas être considérés comme des paiements reçus.
- Les données locales ne sont pas synchronisées entre appareils.
- Stripe n'est pas encore relié à un backend de confirmation des abonnements.
- L'assistance client prépare un texte local : elle n'appelle pas réellement une IA et n'envoie pas de message.
- Vérifie les mentions légales, les règles de TVA, le RGPD et les conditions de vente avant de commercialiser.
"# artisansflowai" 
