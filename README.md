# Paddy's Sandbox 🏖️

A phone-browser sand tray for toddlers. No install, no ads, no text to read. It works offline once it has been opened.

## Play

| Button | What it does |
| --- | --- |
| ✋ | Drag a finger through the sand. It digs a groove and pushes a ridge of sand ahead of it. Flick fast and grains fly. |
| 🪣 | Hold a finger down to pour a stream of sand that builds a cone-shaped pile. |
| Hose (green coil) | Hold a finger down to spray water just above it. The jet blasts out a crater, the water pools in hollows, runs downhill (tilt the phone to slosh it), carves little channels and slowly soaks in, leaving dark wet sand. |
| 🌊 | A wave washes over the tray, leaves it flat and wet, buries a new set of dinosaurs, and re-levels the tilt (see below). |
| 🐢 (stamp button) | Opens the six stamps (🐢 ⭐ 🐚 🐟 🦀 ❤️). Drag a stamp off its button onto the sand, or pick one and touch the sand. The stamp lifts up and follows the finger, then presses in where the finger lets go. |

### Dinosaur dig 🦖

Five toys are buried under the sand each round: four dinosaurs (T-rex, triceratops, stegosaurus, long-neck, pterodactyl) plus a dino egg or a fossil bone. The sand over them is packed down and shows faint lumps in their shapes. Dig with a finger, blast with the hose, or tilt the sand away. Once most of a toy is showing, it roars (the egg and bone play a chime), does a little happy dance and sparkles. Tap 🌊 to bury a new set.

**Tilt** the phone and the sand slides downhill, piles against the low wall, and shows the blue floor at the high end. **Shake** the phone and the sand loosens and settles flat.

## The physics

The tray is a grid of sand columns (one cell ≈ 2 screen pixels). Each column stores:

- **height**: how much sand is there
- **grain tint**: carried along with the sand, so you can see the grains move
- **firmness**: sand pressed by a stamp is compacted, so imprints keep sharp walls until loose sand slides over them
- **wetness**: wet sand looks darker, holds steeper slopes and dries over about 20 seconds
- **water depth**: standing or running water on top of the sand
- **toy height**: the shape of any toy buried underneath, which the sand rests on

On every frame:

1. **Avalanching.** Sand moves to any of its 8 neighbours when the slope between them is steeper than the *angle of repose* (about 36° for still sand, 28° for sand that is already moving, which keeps an avalanche going once it starts). The slope is measured against the phone's real gravity vector, so tilting the phone changes which way is downhill.
2. **Flow with momentum.** The surface layer of each column has a velocity. Gravity along the slope (terrain plus phone tilt) speeds it up, and friction at the angle of repose slows it down. Sand surges downhill, carries on a little, piles against the walls and comes to rest. Sand shoved by a finger or landing from the air brings its momentum with it.
3. **Water.** Water flows toward lower water level, including phone tilt. Moving water drags sand downhill, so it erodes channels. Sand under standing water is saturated and slumps. Water soaks into the sand over time.
4. **Airborne grains and droplets.** Poured and flicked grains, and the hose's droplets, are individual particles. They fall under gravity, cast shadows and join the sand where they land.

Sand is conserved: anything dug or stamped out is pushed into ridges and rims, and nothing disappears. The only exception is the 🪣, which adds sand.

The lighting is computed from the surface slope, with light coming from a low sun at the top-left. Piles and ridges also cast soft shadows. That shading is what makes grooves, piles and imprints look 3-D.

Tilt is deliberately about 2× more sensitive than a real sand tray. Real sand needs about 35° of tilt to slide, which is a lot to ask of small hands.

## Grown-up notes

- **Settings:** press and hold the ⚙️ in the top corner for about a second; a quick tap does nothing, so little fingers won't open it. Settings are remembered on this phone:
  - **Tilt & shake:** turns the motion sensors off, so the sand stays put however the phone is held.
  - **How deep the dinosaurs are buried:** *Shallow* (toys just under the surface, easy finds), *Medium*, or *Deep* (a thick sand bed and only faint lumps). Changing it washes the tray smooth and buries a new set.
  - **Sound:** on or off.

- **Level calibration:** the way the phone is held when you tap the start button (or 🌊) counts as "flat". Hold it the way your child will.
- **Keep them in the app:** add it to the home screen to remove the browser bars. To lock the phone to this one app, use **Guided Access** on iPhone (Settings → Accessibility) or **App pinning** on Android.
- **iPhone motion permission:** iOS asks for permission to use motion sensors the first time. Tilt needs that permission, and it only works over `https://`.
- **Desktop testing:** the arrow keys tilt the tray and `s` shakes it.

## Hosting

It's a static site (`index.html` plus icons, a manifest and a service worker), so any HTTPS static host works. With **GitHub Pages**: repository Settings → Pages → deploy from the branch, root folder. Then open the URL on the phone and choose *Add to Home Screen*.

To try it locally: `python3 -m http.server` and open `http://localhost:8000`. Tilt won't work without HTTPS on a phone.
