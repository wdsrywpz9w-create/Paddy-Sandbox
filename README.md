# Paddy's Sandbox 🏖️

A phone-browser sand tray for toddlers. No install, no ads, no text to read. It works offline once it has been opened.

## Play

| Button | What it does |
| --- | --- |
| ✋ | Drag a finger through the sand. It digs a groove and pushes a ridge of sand ahead of it. Flick fast and grains fly. |
| 🪣 | Hold a finger down to pour a stream of sand that builds a cone-shaped pile. |
| 🌊 | A wave washes over the tray, leaves it flat and wet, and re-levels the tilt (see below). |
| 🔊 | Sound on or off. |
| 🐢 ⭐ 🐚 🐟 🦀 ❤️ | Pick a stamp, then tap the sand to press it in. |

**Tilt** the phone and the sand slides downhill, piles against the low wall, and shows the blue floor at the high end. **Shake** the phone and the sand loosens and settles flat.

## The physics

The tray is a grid of sand columns (one cell ≈ 2 screen pixels). Each column stores:

- **height**: how much sand is there
- **grain tint**: carried along with the sand, so you can see the grains move
- **firmness**: sand pressed by a stamp is compacted, so imprints keep sharp walls until loose sand slides over them
- **wetness**: wet sand looks darker, holds steeper slopes and dries over about 20 seconds

On every frame:

1. **Avalanching.** Sand moves to any of its 8 neighbours when the slope between them is steeper than the *angle of repose* (about 36° for still sand, 28° for sand that is already moving, which keeps an avalanche going once it starts). The slope is measured against the phone's real gravity vector, so tilting the phone changes which way is downhill.
2. **Bulk sliding.** Where the slope including tilt is steep enough, a thin surface layer slides as a sheet.
3. **Airborne grains.** Poured and flicked grains are individual particles. They fall under gravity, cast shadows and join the sand where they land.

Sand is conserved: anything dug or stamped out is pushed into ridges and rims, and nothing disappears. The only exception is the 🪣, which adds sand.

The lighting is computed from the surface slope, with light coming from the top-left. That shading is what makes grooves, piles and imprints look 3-D.

Tilt is deliberately about 2× more sensitive than a real sand tray. Real sand needs about 35° of tilt to slide, which is a lot to ask of small hands.

## Grown-up notes

- **Level calibration:** the way the phone is held when you tap the start button (or 🌊) counts as "flat". Hold it the way your child will.
- **Keep them in the app:** add it to the home screen to remove the browser bars. To lock the phone to this one app, use **Guided Access** on iPhone (Settings → Accessibility) or **App pinning** on Android.
- **iPhone motion permission:** iOS asks for permission to use motion sensors the first time. Tilt needs that permission, and it only works over `https://`.
- **Desktop testing:** the arrow keys tilt the tray and `s` shakes it.

## Hosting

It's a static site (`index.html` plus icons, a manifest and a service worker), so any HTTPS static host works. With **GitHub Pages**: repository Settings → Pages → deploy from the branch, root folder. Then open the URL on the phone and choose *Add to Home Screen*.

To try it locally: `python3 -m http.server` and open `http://localhost:8000`. Tilt won't work without HTTPS on a phone.
