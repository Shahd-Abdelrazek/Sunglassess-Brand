# SUN&PALM — Sunglasses shop

A static website (HTML + CSS + JavaScript, no build step). Open `index.html` in a browser, or serve the folder with any web server.

## Pages

| Page | What it does |
|---|---|
| `index.html` | Home: hero slider, collections, trending, design-your-own banner, today's UV index, bundles, review slider, journal |
| `shop.html` | All products with filters (collection, frame shape, polarized, on sale, wishlist), sorting, search, quick view, the face-shape finder and the family set |
| `designer.html` | Design your own pair from parts in stock (live preview, price, prescription lenses, share/download) + virtual try-on that fits the glasses to your face automatically (camera / photo / model) |
| `lenses.html` | Lens lab: real scenes seen through each lens colour, with a polarized on/off comparison |
| `track.html` | Order tracking from a Google Sheet (see `TRACKING_SETUP_AR.md`) |
| `reviews.html` | Rating summary and a review form |
| `contact.html` | Contact form, store info, map and FAQ |
| `about.html` | Story, values, careers and privacy |
| `news.html` | Journal articles (tips) |

The header, footer, cart, checkout, quick view, style quiz, compare bar and chatbot are added to every page by JavaScript.
Sold-out products show a "Notify me" button that opens WhatsApp with a ready message to the shop.

## Where to change things

| What | File |
|---|---|
| WhatsApp number, currency, brand name, tracking sheet link | `js/store.js` → `SHOP` |
| Products: photo, price, sale price (`was`), stock, shape, polarized | `js/store.js` → `PRODUCTS` |
| Promo codes | `js/store.js` → `COUPONS` |
| Designer options, their prices and workshop stock | `js/store.js` → `DESIGN_OPTIONS` |
| Which frames suit which face | `js/store.js` → `FACE_FIT` |
| Prescription price, family-set discount | `js/store.js` → `RX_PRICE`, `FAMILY_DISCOUNT` |
| Style quiz scoring | `js/quiz.js` |
| Lens lab tints and scenes | `js/lenslab.js` (photos in `images/scenes/`) |
| All texts in English / Arabic / German / Italian / French | `js/i18n.js` |
| Colours and fonts | `css/style.css` → `:root` (dark mode below it) |

When you publish changes, bump `CACHE_VERSION` in `sw.js` so visitors get the new files.

## Notes

- Orders are sent to the shop on WhatsApp; cart, stock, wishlist and reviews are saved in the visitor's browser (there is no server yet).
- The UV index comes from the free Open-Meteo API (no key needed).
- Face tracking in the try-on uses Google MediaPipe, loaded from a CDN and run inside the browser; photos and video are never uploaded.
