# TV Shows

I like to keep track of the TV Shows I watch. I used to do this in a Word Document and manually go to IMDb and check whether the show was running or had been canceled and then add the TV Show to my personal calendar. I decided to build an app that would do this for me.

The app queries the [Episodate API](https://www.episodate.com/api) when you perform a search and stores the added TV Show in a [D1 Database](https://www.cloudflare.com/en-gb/develop-platform/d1/).

The app is built with Nuxt 3, so server functions can be deployed to [Cloudflare Pages](https://pages.cloudflare.com/). Nitro takes care of packaging everything up into Workers.

On initial load, the app queries D1 for all TV Shows associated with your user. Only the show ID is stored in D1. We use some middleware that searches [Workers KV](https://www.cloudflare.com/en-gb/develop-platform/workers-kv/) for the key of the Show. Stored along with that key is a response from the Episodate API containing the show's information. The KV store has a TTL of 8 hours, which ensures we periodically fetch the latest info, without spamming the API and hitting rate limits. If the show is not in KV, then we send a request to the Episodate API and store it.

The TV show is green for currently airing. Red for canceled/finished. And has no color for shows that haven't announced new episodes yet.

There is a live calendar link available so you can sync with services like Google Calendar.

## Develop

``` pnpm run dev ```

## ToDo

- Use the Nitro Cloudflare Plugin rather than the hacky cf-bindings one
