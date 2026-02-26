import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/ticket_master/classifications", async (req: any, res: any) => {
  try {
    const tmRes = await fetch(
      `https://app.ticketmaster.com/discovery/v2/classifications?apikey=${process.env.TICKETMASTER_API_KEY}`
    );

    if (!tmRes.ok) {
      throw new Error(`Ticketmaster API error: ${tmRes.statusText}`);
    }

    const json: any = await tmRes.json();
    const respJson = 
    Object.entries(json._embedded.classifications).map(([key, classification]: any) => {
      if (!classification.segment) return undefined
      return { id: classification.segment.id, name: classification.segment.name };
    }).filter((item: any) => item);
    res.json(respJson); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ticketmaster fetch failed" });
  }
});

app.get("/api/ticket_master/events", async (req: any, res: any) => {
  try {
    const params = new URLSearchParams({
      ...req.query,
      apikey: `${process.env.TICKETMASTER_API_KEY}`,
      locale: "*",
      unit: "miles",
      test: "false"
    } as Record<string, string>);

    let resp:any = { };
    let eventMap = new Map<string, any[]>() 
    
    while (true) {
      console.log(`https://app.ticketmaster.com/discovery/v2/events?${params.toString()}`); 

      const tmRes = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?${params.toString()}`
      );

      if (!tmRes.ok) {
        break;
      }

      const json:any = await tmRes.json();

      console.log('Fetched data:', json);

      json._embedded?.events
            ?.reduce((acc: Map<string, any[]>, jsonEvent: any) => {
              const venue = jsonEvent._embedded?.venues?.[0];
              if (!venue || !venue.location) return null;

              const key = `${venue.location.latitude}|${venue.location.longitude}`;
              acc.set(key, [...(acc.get(key) || []), jsonEvent]);

              return acc;
            }, eventMap);

          if (!eventMap) return;

          for (const [key, events] of eventMap.entries()) {
            let eventJson = events.map((event: any) => 
              ({
                id: event.id,
                name: event.name,
                dateTime: event.dates.start.dateTime,
                localDate: event.dates.start.localDate,
                localTime: event.dates.start.localTime,
                venue: event._embedded.venues[0].name,
                url: event.url,
                classifications: event.classifications?.map((c: any) => c.segment?.name ?? '').join(', '), 
                genres: event.classifications?.map((c: any) => c.genre?.name ?? '').join(', '),
                subgenres: event.classifications?.map((c: any) => c.subGenre?.name ?? '').join(', ')
              }));
            resp[key] = eventJson 
            console.log(`Processed ${events.length} events for location ${key}`);
          }

          const totalPages = json.page.totalPages;
          const currentPage = json.page.number;
          console.log(`Fetched page ${currentPage} of ${totalPages}`);
          if (currentPage >= totalPages) {
            break;         
          }

          params.set("page", (currentPage + 1).toString());
        }
      res.json(resp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ticketmaster fetch failed" });
  }
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
