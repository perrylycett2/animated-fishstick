# Animated Fishstick

A photoreal-inspired canvas action vignette where the battered hero skims
deep ocean brine, banks combo multipliers, and dodges oil tide surges.

## Running locally

The project is framework-free, so any static file server will work. The
quickest option is Python's built-in server:

```bash
python -m http.server 4173
```

Then visit [http://localhost:4173](http://localhost:4173) in your browser.

## Controls

- Arrow Keys / WASD — Swim
- Space — Dash to pass brine gates and avoid oil surges
- R — Quick restart

## Stats & Systems

- Score + high score persistence
- Combo + peak combo tracking
- Energy bar with passive drain
- Tide warning meter synchronized with oil surge scheduling

## Testing

No automated test suite ships with the project yet; manual playtesting on the
served page is the current validation method.

## Publishing to GitHub

The code lives locally inside this workspace only. To push it to your own
GitHub account:

1. [Create an empty repository](https://github.com/new) named however you'd
   like (for example, `animated-fishstick`).
2. Point this working tree at that remote:
   ```bash
   git remote add origin git@github.com:<your-username>/<repo-name>.git
   ```
   or use the HTTPS form if you prefer tokens.
3. Push the existing history up:
   ```bash
   git push -u origin HEAD
   ```

Once the remote is configured, any further commits you make here can be pushed
with the usual `git push` flow. From there you can enable GitHub Pages (or any
other hosting pipeline) to serve the static site.
