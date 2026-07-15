# Gestion de projet - Serveur

API REST pour l'appli de gestion de projet (test technique mentorat Ynov).

## Stack

- Node.js / Express / TypeScript
- Prisma + SQLite
- JWT (jsonwebtoken) + bcrypt pour l'auth

## Installation

```bash
git clone https://github.com/YuJu16/gestion-projet-server.git
cd gestion-projet-server
npm install
```

Créer un fichier `.env` :

```
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=change_moi
```

Puis initialiser la base :

```bash
npx prisma migrate dev
```

## Lancer le serveur

```bash
npm run dev
```

Serveur accessible sur `http://localhost:4000`.

## Organisation

```
src/
  index.ts            -> point d'entrée
  lib/prisma.ts        -> instance Prisma
  middlewares/
    auth.ts             -> vérif du token JWT
    errorHandler.ts      -> gestion des erreurs
  routes/               -> endpoints
  controllers/           -> logique métier
prisma/
  schema.prisma           -> modèle de données
```

Les routes ne font qu'appeler les controllers, toute la logique (vérifications, accès à la BDD) est dans les controllers.

## Endpoints

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | /api/auth/register | Inscription | non |
| POST | /api/auth/login | Connexion | non |
| GET | /api/projects | Liste des projets | oui |
| POST | /api/projects | Créer un projet | oui |
| GET | /api/projects/:id | Détail d'un projet (avec tâches, participants, assignés) | oui |
| PUT | /api/projects/:id | Modifier un projet | oui (owner) |
| DELETE | /api/projects/:id | Supprimer un projet | oui (owner) |
| GET | /api/projects/:id/tasks | Tâches du projet (filtres ?status= et ?search=) | oui |
| POST | /api/projects/:id/tasks | Créer une tâche | oui |
| PUT | /api/projects/:id/tasks/:taskId | Modifier une tâche (titre, description, statut) | oui |
| DELETE | /api/projects/:id/tasks/:taskId | Supprimer une tâche | oui |
| PUT | /api/projects/:id/tasks/:taskId/assignees | Définir les utilisateurs assignés à une tâche (liste complète) | oui |
| GET | /api/projects/:id/participants | Liste des participants | oui |
| POST | /api/projects/:id/participants | Ajouter un participant (email ou pseudo) | oui (owner) |
| DELETE | /api/projects/:id/participants/:participantId | Retirer un participant | oui (owner ou soi-même) |

## Notes

- `dev.db` n'est pas versionné, il se génère avec `prisma migrate dev`.
- Mots de passe hashés avec bcrypt.
- Token JWT à passer en header `Authorization: Bearer <token>`.
- Une tâche peut être assignée à plusieurs participants en même temps (relation many-to-many via la table `TaskAssignee`), pas juste un seul assigné.
- L'ajout d'un participant se fait par email ou par pseudo (champ `identifier` dans le body), au choix.
- Un participant peut se retirer lui-même d'un projet (pas juste le owner).
- Le propriétaire ne peut pas s'ajouter comme participant de son propre projet.