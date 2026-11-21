# Paddy's Sandbox 🏖️

A phone-browser sand tray for toddlers. No install, no ads, no text to read. It works offline once it has been opened.

## Play

A full illustrated guide for grown-ups is built in: press and hold ⚙️ and tap **📖 Help & guide**, or tap **Read the guide** on the start screen. It's also at [`help.html`](help.html).

The toolbar has eight big buttons. Four of them hold a **group** of tools: tapping the button picks the tool it shows and pops the rest of its group open above the bar.

| Button | Tools |
| --- | --- |
| ✋ Finger | Drag through the sand to dig a groove, pushing a ridge ahead. Flick fast and grains fly. |
| **Sand tools** | 🪣 **Bucket:** hold to pour a stream of sand into a cone. **Castle mould:** carry an upside-down bucket and let go to lift off a tower of firm damp sand. It has bucket-ridged sloping sides, six chunky battlements and crumbs around its foot. **Build a big castle:** one tap raises a whole sandcastle: a spring-fed moat, a bridge, a gatehouse, outer and inner crenellated walls with corner towers, a keep with a turret, and fluttering flags that topple if their tower is knocked down. **Castle keepers** (on by default) live in it. These four little builders rebuild anything knocked down, put flags back up and dredge the moat. Each knock makes them crosser: grumpier speech bubbles, red faces, stamping, fist-shaking and flying hats. They calm down when left alone. **Shovel:** press to scoop. Hold still and the scoop grows for about 1.5 s, shown by a dashed ring and a filling progress ring. Drag and let go to tip it out. |
| **Water** | **Hose:** sprays just past the fingertip. Holes and moats fill up, water runs downhill, carves channels and soaks in. **Rain cloud:** hold to rain on the sand around the finger. Drops dimple and wet the sand and pool in hollows. |
| **Colours** | Red, orange, yellow, green, blue, purple, pink or rainbow dye. Rub to stain the grains. Coloured sand keeps its colour wherever it goes, and the wave washes it out. |
| **Stamps** | 🐢 ⭐ 🐚 🐟 🦀 ❤️: drag one off its button, or touch the sand. It follows the finger and presses in on release. **Dinosaur footprints:** drag and a dinosaur walks along, left-right. |
| Toy truck | Touch the sand and the truck drives there, bulldozing a ridge with its blade and leaving tread tracks. |
| Desk fan | **Blow into the microphone** to spin it. Gusty wind blows loose sand downwind into drifts and ripples; wet or packed sand resists. Drag the fan to move it, touch elsewhere to aim it, and drag it off the edge to put it away. |
| 🌊 Wave | Washes the tray smooth and wet, buries a new set of toys, washes out dye, and re-levels the tilt. |

### Dinosaur dig 🦖

Each round, four dinosaurs (T-rex, triceratops, stegosaurus, long-neck, pterodactyl) and two treasures (dino egg, fossil bone, treasure chest, gem or ammonite) are buried. The sand over them is packed down and shows faint lumps in their shapes, unless the depth is set to *Hidden*. The dinosaurs can also be switched off in settings. Uncover them by digging, shovelling, hosing, driving the truck or tilting. When most of a toy is showing, it roars (treasures chime), dances and sparkles, and its slot in the **shelf** at the top-left fills in. Find them all for confetti and a fanfare; the 🌊 button then wiggles to offer a new dig.

**Tilt** the phone and the sand slides downhill, piles against the low wall, and shows the blue floor at the high end. **Shake** the phone and the sand loosens and settles flat.

## The physics

The tray is a grid of sand columns (one cell ≈ 2 screen pixels). Each column stores:

- **height**: how much sand is there
- **grain tint and dye colour**: carried along with the sand, so you can see the grains move and coloured sand stays coloured wherever it goes
- **firmness**: sand pressed by a stamp is compacted, so imprints keep sharp walls until loose sand slides over them
- **wetness**: wet sand looks darker, holds steeper slopes and dries over about 20 seconds
- **water depth**: standing or running water on top of the sand
- **toy height**: the shape of any toy buried underneath, which the sand rests on

On every frame:

1. **Avalanching.** Sand moves to any of its 8 neighbours when the slope between them is steeper than the *angle of repose* (about 36° for still sand, 28° for sand that is already moving, which keeps an avalanche going once it starts). The slope is measured against the phone's real gravity vector, so tilting the phone changes which way is downhill.
2. **Flow with momentum.** The surface layer of each column has a velocity. Gravity along the slope (terrain plus phone tilt) speeds it up, and friction at the angle of repose slows it down. Sand surges downhill, carries on a little, piles against the walls and comes to rest. Sand shoved by a finger or landing from the air brings its momentum with it.
3. **Water.** Water flows toward lower water level, including phone tilt (real tilt, not the exaggerated sand tilt). With the water table on, any spot whose surface is below the table seeps full of water. Moving water drags sand downhill, so it erodes channels. Sand under standing water is saturated and slumps. Water soaks into the sand over time.
4. **Airborne grains and droplets.** Poured and flicked grains, and the hose's droplets, are individual particles. They fall under gravity, cast shadows and join the sand where they land.

Sand is conserved by digging, shovelling, the truck, tilting, water and wind: anything moved is pushed into ridges, rims, piles and drifts, and nothing disappears. Stamps and footprints pack the sand down a little under them (that's what keeps imprints crisp), and the 🪣 and the castle mould add sand.

The lighting is computed from the surface slope, with the sun at the top-left at the height chosen in settings. Piles and ridges cast soft shadows, damp sand has a glossy sheen, and puddle edges are frothy. That shading is what makes grooves, piles and imprints look 3-D.

The fan's wind is an extra push on the loose surface layer. It gusts and sways, and nudges sand into ripples across the wind that creep downwind.

To save battery and keep things smooth, the tray is split into 16×16-cell tiles, and calm tiles sleep. The physics only runs where sand is moving or something has just disturbed it, and every tile gets a check twice a second. On older phones the app also drops to fewer physics passes per frame automatically.

Real sand needs about 35° of tilt to slide. The tilt-sensitivity setting makes the tray steadier than real sand (Low and Medium) or about the same (High), so a toddler's wobbly grip doesn't send everything sliding; water always feels the phone's real tilt.

## Grown-up notes

- **Settings:** press and hold the ⚙️ in the top corner for about a second; a quick tap does nothing, so little fingers won't open it. Settings are remembered on this phone:
  - **Tilt & shake:** turns the motion sensors off, so the sand stays put however the phone is held.
  - **Tilt sensitivity:** *Low* (the default; flat sand starts to slide at about 50° of tilt and only a hard shake counts), *Medium* (about 42°) or *High* (about 34°, close to real sand). Piles and steep walls give way a little sooner.
  - **Buried dinosaurs:** *Off* (no toys), *Shallow* (just under the surface, easy finds), *Medium*, *Deep* (thick sand, faint lumps) or *Hidden* (buried under dead-flat sand with no lumps at all, so finding them is pure exploring). Changing it washes the tray smooth and buries a new set.
  - **Water in low spots (for moats):** *Off*, *Low* or *High*. Like digging near the sea: any hole, trench or moat dug below the water table slowly fills with seep-in water, and drains back if filled in. *Low* needs a deep dig; *High* fills even shallow scrapes and dune hollows. The water stays level with real gravity, so tilting sloshes moats toward the low side.
  - **Castle keepers:** on or off.
  - **Sun:** *Low* (long shadows that make prints and stamps stand out), *Midday* (the default) or *High*.
  - **Background:** *Rocky* (the default: dark pebbles around the sandbox) or *Sky blue*.
  - **Sound:** on or off.

- **Level calibration:** the way the phone is held when you tap the start button (or 🌊) counts as "flat". Hold it the way your child will.
- **Keep them in the app:** add it to the home screen to remove the browser bars. To lock the phone to this one app, use **Guided Access** on iPhone (Settings → Accessibility) or **App pinning** on Android.
- **iPhone motion permission:** iOS asks for permission to use motion sensors the first time. Tilt needs that permission, and it only works over `https://`.
- **Desktop testing:** the arrow keys tilt the tray, `s` shakes it and holding `f` blows the fan.
- **Microphone:** it's only switched on while a fan is on the sand, and it's only used to measure how hard someone is blowing. Nothing is recorded or sent anywhere. On some iPhones, sound from the app plays a little quieter while the microphone is on.

## iPhone app (Capacitor + Sideloadly)

The sandbox is also packaged as a real iPhone app with [Capacitor](https://capacitorjs.com). The native project is in `ios/`. The app runs fully offline, has no status bar, hides the home bar, and needs a second swipe to leave from the screen edges, which helps keep small fingers inside.

### Get the `.ipa`

GitHub builds it automatically on a Mac whenever this branch changes, using `.github/workflows/ios-ipa.yml`:

1. On GitHub, open **Actions**, then **Build iPhone app (.ipa)**, then the latest run with a green tick.
2. Under **Artifacts**, download **PaddysSandbox-ipa**. It's a zip; unzip it to get `PaddysSandbox.ipa`.

The workflow can also be started by hand: **Run workflow** on that page. The `.ipa` is unsigned; Sideloadly signs it with your Apple ID when it installs it.

### Install it with Sideloadly

1. Install [Sideloadly](https://sideloadly.io) on a Mac or Windows PC. On Windows, also install iTunes and iCloud from Apple's website, not the Microsoft Store versions.
2. Plug the iPhone in with a cable, unlock it and tap **Trust**.
3. Drag `PaddysSandbox.ipa` into Sideloadly, enter your Apple ID, and press **Start**. Approve the two-factor code if asked.
4. On the iPhone, the first time:
   - **Settings → Privacy & Security → Developer Mode:** turn it on and restart (needed on iOS 16 and later).
   - **Settings → General → VPN & Device Management:** tap your Apple ID and **Trust** it.
5. Open **Paddy's Sandbox**, tap 🏖️, and allow motion access. The fan asks for the microphone the first time it's used.

**Free Apple ID:** a sideloaded app stops opening after **7 days**. Sideload it again, or turn on Sideloadly's auto-refresh, which re-signs it while the phone is on the same Wi-Fi as the computer. A free account can have up to 3 sideloaded apps at a time. A paid Apple Developer account ($99/year) makes the signature last a year.

**Updating:** download the newest `.ipa` and sideload it again. The app keeps its settings because the app ID (`com.paddysandbox.app`) stays the same.

### Building it yourself on a Mac

```
npm ci
npm run ios:sync      # copies the web app into ios/App/App/public
npx cap open ios      # opens Xcode: pick your phone and press Run
```

After changing the web code, run `npm run ios:sync` again before building.

## Project layout

| Path | What's in it |
| --- | --- |
| `index.html` | The page: the sandbox, the toolbar, the start screen and the settings panel |
| `css/style.css` | All the styling |
| `js/core.js` | Settings, the sand grid, sleeping tiles, and the granular physics (avalanching and momentum flow) |
| `js/motion.js`, `js/particles.js`, `js/water.js` | Tilt and shake; airborne grains and droplets; water flow, the water table and erosion |
| `js/dig.js`, `js/stamps.js`, `js/shovel.js`, `js/mould.js`, `js/prints.js` | Finger digging, stamps, shovel, castle mould, footprints |
| `js/castle.js` | Tower shapes, the big castle, its spring-fed moat and flags |
| `js/keepers.js` | The little castle keepers: repair jobs, walking, frustration, drawing |
| `js/hose.js`, `js/rain.js`, `js/dye.js`, `js/truck.js`, `js/fan.js`, `js/wave.js` | The other tools |
| `js/treasure.js` | Buried toys, finding them, and the shelf |
| `js/render.js`, `js/sound.js`, `js/input.js`, `js/ui.js`, `js/main.js` | Drawing, sound, touch handling, toolbar and settings, the main loop |
| `help.html`, `help/` | The illustrated guide and its pictures |
| `sw.js`, `manifest.webmanifest`, icons | Offline support and home-screen install (website) |
| `ios/`, `capacitor.config.json`, `scripts/build-web.js` | The iPhone app (Capacitor); `www/` is generated by `npm run build:web` |
| `.github/workflows/ios-ipa.yml` | Builds the unsigned `.ipa` on a GitHub Mac |
| `tests/run.js` | Automated checks |

The scripts are plain browser JavaScript that share one global scope and load in the order listed in `index.html`. There's no build step.

## Tests

```
npm install      # once: installs Playwright
npx playwright install chromium   # once, if Playwright has no browser yet
npm test
```

The tests drive the real app in a headless browser and check that:
- it loads without errors on a large and a small phone;
- digging, shovelling, tilting and the fan neither lose nor create sand;
- toys are found when uncovered and the shelf fills in, and the Hidden and Off settings work;
- the castle mould builds a tower; the big castle has its flags, keep and full moat, and doesn't slump; the keepers rebuild a knocked-down tower, get cross and can be switched off; the hose fills a hole; and the truck drives;
- the tilt thresholds match the settings;
- settings are remembered, and Done is reachable on a short screen;
- the guide opens and closes;
- calm sand sleeps.

## Hosting

It's a static site (HTML, CSS, JavaScript, icons, a manifest and a service worker), so any HTTPS static host works. With **GitHub Pages**: repository Settings → Pages → deploy from the branch, root folder. Then open the URL on the phone and choose *Add to Home Screen*.

To try it locally: `python3 -m http.server` and open `http://localhost:8000`. Tilt won't work without HTTPS on a phone.
