# TV Shows

I like to keep track of the TV Shows I watch. I used to do this in a Word Document and manually go to IMDb and check whether the show was running or had been canceled and then add the TV Show to my personal calendar. I decided to build an app that would do this for me.

The app queries the [Episodate API](https://www.episodate.com/api) when you perform a search and stores the added TV Show in a [D1 Database](https://www.cloudflare.com/en-gb/develop-platform/d1/).

The app is built with Nuxt 3, so server functions can be deployed to [Cloudflare Pages](https://pages.cloudflare.com/). Nitro takes care of packaging everything up into Workers.

On initial load, the app queries D1 for all TV Shows associated with your user. We use D1 to cache a response from the Episodate API containing the show's information. We have a cron job set up to fetch the latest info, without spamming the API and hitting rate limits. If the show is not in D1, then we send a request to the Episodate API and store it.

The TV show is green for currently airing. Red for canceled/finished. And has no color for shows that haven't announced new episodes yet.

There is a live calendar link available so you can sync with services like Google Calendar. Google Calendar isn't very reliable when syncing from a URL, so custom functionality is currently being built.

## Preview Deployments

Pull requests automatically deploy to a temporary Cloudflare Worker so reviewers can test changes before merge. The URL is posted as a comment on the PR.

Cloudflare automatically sets `CF_PAGES_URL` during preview deployments.
Ensure this variable or `NUXT_PUBLIC_AUTH_JS_BASE_URL` is available to your worker so Auth JS can validate request origins.


## Develop

``` pnpm run dev ```
