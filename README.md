# Nearmee

This is a little experiment I used to learn React. It allows users to search a radius for events on a given date and save them 
to a calendar. 

- The only source currently supported is Ticketmaster. 

Quick start:

create `.env` with:

```
TICKETMASTER_API_KEY=<API_KEY>
```

`docker run -d -p "27017:27017" mongodb/mongodb-community-server:latest`

```bash
cd nearmee/server
npm install
npm run dev
```

```bash
cd nearmee/client
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```
