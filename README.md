<div align="center">
  <h1>Nurebo Server</h1>
  <p><strong>Repository monorepo che contiene API e Web App dell'ecosistema Nurebo.</strong></p>

<p>
    <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white" alt="Next.js"/>
    <img src="https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white" alt="MySQL"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/>
  </p>
</div>

## 📱 Cos'è Nurebo Server?

**Nurebo Server** è un repository monorepo che ospita due progetti distinti ma correlati:

| Progetto | Cartella | Tecnologia | Scopo |
|----------|----------|------------|-------|
| **nurebo-api** | `src/nurebo-api` | Node.js + Express | Backend API + Socket.IO |
| **nurebo-app** | `src/nurebo-app` | Next.js 14 | Applicazione web |

Insieme formano il backend e il frontend web dell'ecosistema Nurebo (app mobile utenti + app admin).

## 🔀 Dualità del repository

Questo repository contiene **due applicazioni** che vengono deployate insieme tramite AWS CodeDeploy:

```text
nurebo-server/
├── src/
│   ├── nurebo-api/     ← Backend (Node.js/Express)
│   └── nurebo-app/     ← Frontend (Next.js)
├── scripts/            ← Script di deploy
├── appspec.yml         ← Configurazione CodeDeploy
└── deploy-cf.yaml      ← Template CloudFormation
```

- **nurebo-api** espone gli endpoint REST e i socket usati dalle app mobile (`nurebo` e `nurebo_admin`)
- **nurebo-app** è la versione web (o pannello web) che consuma la stessa API

Il file `appspec.yml` copia entrambe le cartelle sul server durante il deploy.

## ✨ Componenti principali

### nurebo-api (Backend)

- API REST con Express
- Socket.IO (con Redis adapter) per real-time
- MySQL + Redis
- Firebase Admin (notifiche)
- JWT + rate limiting
- Route: booking, business, prestazione, event, chat, user, ecc.

### nurebo-app (Frontend)

- Next.js 14 + React 18
- Tailwind CSS

## 📸 Screenshot — nurebo-app (Web)

<div align="center">
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/ristorante1.png" alt="Nurebo Web Dashboard" width="400"/>  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/ristorante6.png" alt="Nurebo Web Dashboard" width="400"/>
  <br/>
  <em>Ristorante</em>
</div>
<br/>

<div align="center">
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/reservation1.png" alt="Nurebo Web Services" width="400"/>
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/reservation2.png" alt="Nurebo Web Services" width="400"/>
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/reservation6.png" alt="Nurebo Web Services" width="400"/>
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/reservation3.png" alt="Nurebo Web Services" width="400"/>
  <br/>
  <em>Prenotazione</em>
</div>
<br/>

<div align="center">
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/store6.png" alt="Nurebo Web Map" width="400"/>
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/store1.png" alt="Nurebo Web Map" width="400"/>
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/store2.png" alt="Nurebo Web Map" width="400"/>
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/store3.png" alt="Nurebo Web Map" width="400"/>
  <br/>
  <em>Store</em>
</div>

## 🏗 Architettura

<div align="center">
  <img src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/architettura1.jpg" alt="Nurebo Server Architecture" width="800"/>
</div>

## 🛠 Tech Stack

**Backend (`nurebo-api`)**
Express · Socket.IO · MySQL · Redis · Firebase Admin · JWT · AWS SDK

**Frontend (`nurebo-app`)**
Next.js 14 · React 18 · Tailwind CSS

**Infrastruttura**
AWS CloudFormation · CodeDeploy · Prometheus + Grafana · Application Load Balancer

## 🚀 Come iniziare

### Backend (nurebo-api)

```bash
cd src/nurebo-api
npm install
# configura il file .env
npm run dev
```

### Frontend (nurebo-app)

```bash
cd src/nurebo-app
npm install
npm run dev
```

L'app web sarà disponibile su `http://localhost:3000`.

### Deployment

Il deploy avviene tramite AWS CodeDeploy usando `appspec.yml`.
L'infrastruttura è definita nel template CloudFormation `nexyra-cf.yaml`.

## 📁 Struttura del progetto

```text
src/
├── nurebo-api/           # API Node.js/Express
│   ├── controllers/
│   ├── routes/
│   ├── database/
│   ├── socket/
│   ├── middleware/
│   └── index.js
└── nurebo-app/           # Web App Next.js
    ├── app/
    ├── components/
    └── package.json
scripts/                  # Script di deploy
appspec.yml               # CodeDeploy
deploy-cf.yaml            # CloudFormation
```

## 🔗 Progetti correlati

- **[nurebo](https://github.com/jacko95/nurebo)** — App mobile utenti
- **[nurebo_admin](https://github.com/jacko95/nurebo_admin)** — App admin business

## 📄 Licenza

Questo progetto è rilasciato sotto la **MIT License**.

Copyright (c) 2026 Domenico Politi

---

<div align="center">
  <p>Realizzato con ❤️ in Node.js e Next.js</p>
  <p><strong>Nurebo Server</strong> — API + Web App in un unico repository.</p>
</div>
