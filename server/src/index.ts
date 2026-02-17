import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/ticket_master", async (req: any, res: any) => {
  try {
    const params = new URLSearchParams({
      ...req.query,
      apikey: "XgA5FIqeWKjUegq2BoG9W1k7HMqrGFn4",
      locale: "*",
      page: "1",
    } as Record<string, string>);

    let resp:any = { };
    let eventMap = new Map<string, any[]>() 

    while (true) {
      const tmRes = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?${params.toString()}`
      );

      if (!tmRes.ok) {
        break;
      }

      const json:any = await tmRes.json();

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
            let eventHtml = events.map((event: any) => `<b>${event.name}</b><br>${event.dates.start.dateTime}<br>${event._embedded.venues[0].name}`).join('<hr>');
            resp[key] = eventHtml;
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
