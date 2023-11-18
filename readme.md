# TV Shows

I like to keep track of the TV Shows I watch. I used to do this in a Word Document and manually go to IMDb and check whether the show was running or had been canceled and then add the TV Show to my personal calendar. I decided to build an app that would do this for me.

The app queries the [Episodate API](https://www.episodate.com/api) when you perform a search and stores the added TV Show in a Fauna Database (This is a mocked API call for the public version. No data is saved to Fauna, only in local storage).

You can also directly input the Episodate ID of the TV Show to add it to the Fauna Database.

On initial load, the app queries the API which queries the Fauna Database for all currently watching TV Shows and fetches information on them from the Episodate API. This initial load is stored in Local Storage so as to not run into too many request issues with the Episodate API.

The TV show is green for currently airing. Red for canceled/finished. And has no color for shows that haven't announced new episodes yet.

You can then export all of the episodes set in the future to an iCal file which you can import into any calendar software.

There is also a live calendar link available in the API for calendar software that accepts an iCal URL.

This app is deployed on [Cloudflare Pages](https://pages.cloudflare.com/) and the API uses [Cloudflare Workers](https://workers.cloudflare.com/) and [Workers KV](https://www.cloudflare.com/en-gb/products/workers-kv/).

## Develop

``` pnpm run dev ```
