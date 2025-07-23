# Menu-Digital-BipCard-v1

Application de menu digital avec frontend React et backend Node.js.

## Structure du projet

- `/frontend` - Application React
- `/backend` - API Node.js

## Installation

```bash
# Installation des dépendances du frontend
cd frontend
npm install

# Installation des dépendances du backend
cd backend
npm install
```

## Configuration

1. Copier les fichiers d'exemple des variables d'environnement :
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Configurer les variables d'environnement dans les fichiers .env

## Démarrage

```bash
# Démarrer le backend
cd backend
npm run dev

# Dans un autre terminal, démarrer le frontend
cd frontend
npm start
```







PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_db
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_ç23ufyyubhjgyutgkhoohnj@$$&^YGU&*&*BHHUY*GVGVTYF$YU&GHGVGTDRVBGHGHV
STRIPE_SECRET_KEY=sk_test_51RdDfpIK2cyKG4vjGaqlu1WwCfPPrIJ7H55Xokb9rLG7e46Uc8aMT5Tt4Y8AvBpAB9TyHcdtezgZmKpSmQyK0vQU00qcpdHoy1
STRIPE_WEBHOOK_SECRET=whsec_8e2c01beca02e14d3edf56d4f2f1dcfe656a3f794b4ba0a0470ad6b911dbd6a1
