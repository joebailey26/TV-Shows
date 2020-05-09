# TV Shows

I like to keep track of the TV Shows I watch. I used to do this in a Word Document and manually go to IMDb and check whether the show was running or had been cancelled and then add the TV Show to my calendar. I decided to build an app that would do this for me.

It queries the [episodate API](https://www.episodate.com/api) when you perform a search and stores the added TV Show in a Fauna Database.

It queries the Fauna Database for all currently watching TV Shows and fetches information on them from the episodate API. The TV show is green for currently airing. Red for cancelled/finished. And has no colour for shows that haven't announced new episodes yet.

It then exports all of the episodes set in the future to an iCal file which you can import into any calendar software.

## Develop

``` npm run start ```

## Build

``` npm run build ```

## Future

- [ ] Make the calendar a live link for Google Calendar to ping
