[![16/08/2024](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/snPWRHYg)
# Examenopdracht Web Services

- Student: Mona Dierickx
- Studentennummer: 202187997
- E-mailadres: <mailto:mona.dierickx@student.hogent.be>

## Vereisten

Ik verwacht dat volgende software reeds geïnstalleerd is:

- [NodeJS](https://nodejs.org)
- [Yarn](https://yarnpkg.com)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

## Opstarten

1. .env-bestand aanmaken met daarin een geldige DATABASE_URL ([database url](https://www.prisma.io/docs/orm/overview/databases/mysql)), een NODE_ENV (node environment), een AUTH_JWT_SECRET (een willekeurige string die JWT gebruikt als sleutel voor de authenticatie, dit mag random gegenereerd zijn) en een PORT (poortnummer). 
2. Gebruik het commando `yarn install` om de nodige dependencies te installeren. 
3. Voer de commando's `npx prisma migrate deploy reset` en `npx prisma db seed` om de migrations en seeds toe te passen op de databank. 
4. Gebruik het commando `yarn start` of `node src/index.js` om de applicatie te starten. 

## Testen

1. Maak een .env bestand waarin je NODE_ENV definieert als 'test' en DATABASE_URL als de geldige databank url naar je testing databank (typisch eindigd deze in '_test'). 
2. Run enkel de migrations voor de test databank met het commando `npx prisma migrate deploy`. (Geen seeding gebruiken! Testing hoort te beginnen vanaf een lege databank.) 
3. Run alle tests met het commando `yarn test`. 
4. (Optioneel) bekijk de coverage van de testen met het commando `yarn test:coverage`. 
