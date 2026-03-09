# Google Ads Cross-Domain Tracking Setup

## Current property and tags

- GA4 property name: `Fly Away Ballooning`
- GA4 web measurement ID in this app: `G-ZEB9ML78NY`
- Google Ads tag ID in this app: `AW-468929127`
- Booking domain in this repo: `https://flyawayballooning-book.com/`

## What is already implemented in this repo

- The booking app now sets the Google tag linker for:
  - `flyawayballooning.com`
  - `www.flyawayballooning.com`
  - `flyawayballooning-book.com`
  - `www.flyawayballooning-book.com`
- Booking app exits back to the main site no longer wipe all browser storage, so `fab_gclid` is preserved.

## Remaining requirement outside this repo

The source domain `flyawayballooning.com` is not present in this workspace, so cross-domain tracking is not fully complete unless the same GA4 property / Google tag is also installed there.

That source site must use the same cross-domain setup with the same property/tag IDs.

## Google UI steps still required

1. In GA4, open the `Fly Away Ballooning` property and confirm the web stream that uses `G-ZEB9ML78NY`.
2. In that web stream, configure cross-domain measurement for both main and booking domains.
3. In GA4 Admin, link the same property to the target Google Ads account.
4. In Google Ads, import GA4 conversion actions from that linked property.

## Practical answer for Victor

Cross-domain tracking is set up on the `Fly Away Ballooning` GA4 property that uses measurement ID `G-ZEB9ML78NY` on the booking app. The booking-domain code is now configured for cross-domain linking, but the public `flyawayballooning.com` source site still needs to use the same GA4 property and linker settings if it is managed outside this repo.
