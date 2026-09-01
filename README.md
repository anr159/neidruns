# Neidrūns

A browser-based audio clip sequencer. Drag clips from a library onto a
multi-track timeline, arrange and trim them, play the result back, and save
arrangements to share.

Built as a single HTML file with no framework, no dependencies and no build
step. Deployed on Netlify, optionally with a small function that gives everyone
on the site a shared library of saved sequences.

---

## Using it

**Placing clips.** Drag a clip from the library onto a track. Clips stay in the
library, so the same one can be used any number of times. Click a clip in the
library to preview it; the preview stops on its own when you start a drag or
begin playback.

**Arranging.** Drag a clip on the timeline sideways to move it in time, or up
and down to change track. Drag its left or right edge to trim. With Snap on,
clips pull to the grid and to the edges of their neighbours. Select a clip and
press Delete to remove it, or use the × in its corner.

**Cutting.** Toggle the razor (✂ button or `C`) and click anywhere on a clip to
cut it into two independent clips at that point, each keeping its own trim.
The razor stays on until you toggle it off again, so you can make several cuts
in a row.

**Playing.** Space plays and pauses. Click the ruler to move the playhead or
scrub. With Follow on, the view scrolls to keep the playhead visible.

**Volume.** Each track has a slider and a mute button next to its name; the
master slider is top right.

**Tracks.** "Add track" appends one, up to 10. The × next to a track's name
removes it, along with anything placed on it; the last remaining track can't be
removed.

**Exporting.** "Export mix" renders the arrangement offline and downloads it as
a WAV.

### Keyboard

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `Delete` / `Backspace` | Remove the selected clip |
| `Ctrl`/`Cmd` + `D` | Duplicate the selected clip, placed right after itself |
| `C` | Toggle the razor tool |
| `←` `→` | Nudge the selected clip by 0.1s (hold Shift for 1s) |
| `Esc` | Deselect |
| `−` `+` | Zoom out / in |
| `0` | Fit everything |
| `Z` | Zoom to the selected clip |
| scroll | Zoom at the pointer (`Ctrl`/pinch also works) |
| `Shift` + scroll | Pan vertically between tracks |
| trackpad horizontal swipe | Pan sideways |

---

## Project layout

    public/index.html                 the entire app
    public/audio/                     the mp3 clips
    netlify/functions/sequences.mjs   shared-sequence API
    netlify.toml                      build config
    package.json                      one dependency, @netlify/blobs

The mp3s are bundled in `public/audio/`.

---

## Where the audio comes from

Near the top of the script in `public/index.html`:

```js
const AUDIO_BASES = [
  "https://cdn.jsdelivr.net/gh/anr159/neidruns@main/",
  "https://raw.githubusercontent.com/anr159/neidruns/main/",
  "audio/",
];
```

Each entry is tried in order until one responds, and the app then sticks with
whichever answered. This survives a CDN being blocked by an ad blocker or a
network filter, and `audio/` means a folder sitting next to the page, so the
same file also works fully offline.

Any host you add must send an `Access-Control-Allow-Origin` header. jsDelivr,
GitHub raw and the Internet Archive do. Dropbox and Google Drive share links do
not.

Note that jsDelivr caches `@main` URLs for around 12 hours. Replacing a file
under the same name will not take effect immediately; uploading under a new name
avoids the wait.

If every source fails, the app shows what it tried and offers a file picker so
you can select the mp3s from disk and keep working.

### Changing the clips

The clip list is hardcoded in the `CLIPS` array, as filename and duration pairs,
plus an optional third element to override the display label (otherwise it's
"Clip 01", "Clip 02", …). Add, remove or rename entries there. The durations
are only estimates used to draw the library before anything is decoded — the
app measures each file when it loads and corrects itself, including fixing up
anything already on the timeline whose length no longer fits.

---

## Saving sequences

Two modes, chosen automatically at startup by probing the API.

**Shared.** If the Netlify Function is deployed, sequences are stored server-side
in Netlify Blobs and everyone on the site sees the same list.

**Local.** Otherwise they go to browser storage, private to each person and each
device.

The text next to the sequences dropdown says which mode is active. Whichever it
is, your in-progress arrangement is also autosaved locally, so a refresh doesn't
lose work.

---

## Deploying

Because the function needs its dependency installed, this cannot be deployed by
dragging files onto Netlify Drop. Netlify has to build it, which means connecting
a Git repository.

1. Push this project to a GitHub repository.
2. In Netlify: **Add new site → Import an existing project → GitHub**, and pick
   the repo.
3. Netlify reads `netlify.toml`, so leave the build settings alone. Publish
   directory is `public`, build command is empty.
4. Deploy. The first build installs `@netlify/blobs` and bundles the function.

Netlify Blobs needs no keys or configuration; a deployed function gets access to
its site's store automatically.

After this, every push to `main` rebuilds and republishes on its own. Blobs are
separate from the deploy, so saved sequences survive rebuilds.

### Checking it worked

Open `https://yoursite.netlify.app/api/sequences`. A fresh site returns `{}`. A
404 means the function didn't deploy — check the Functions section of the deploy
log.

### Static-only deployment

`public/index.html` on its own works on any static host, including Netlify Drop.
You lose shared sequences and nothing else.

---

## Running locally

```
npm install
npx netlify dev
```

Serves the site and the function together with a local blob store.

Without the Netlify CLI, any static server works, though the API won't exist:

```
cd public
python3 -m http.server 8000
```

Opening `index.html` directly from disk will not load audio from a local
`audio/` folder, because browsers block file reads from `file://` pages. The
remote sources still work, and the file picker is there as a fallback.

---

## How it's built

No framework, no libraries, no build step. The page loads two fonts from Google
Fonts and works without them.

- **Web Audio API** for playback. Each mp3 is decoded to an `AudioBuffer`, and
  playback schedules one `BufferSourceNode` per clip at an exact context time,
  through a gain node per track into a master gain. Scheduling this way is what
  keeps clips in sync instead of drifting.
- **`OfflineAudioContext`** for export, rendering faster than real time, with the
  WAV header written by hand.
- **Canvas 2D** for waveforms. Peaks are cached per clip; past a certain zoom the
  app reads the decoded samples directly for the visible window instead, so
  trimming stays accurate. Clips wider than 3000px only paint what's on screen,
  since a fully zoomed long clip would exceed the browser's canvas limit.
- **Pointer Events** for dragging, rather than HTML5 drag-and-drop, so mouse,
  trackpad and touch all use the same code path.
- **Plain DOM** rendering. No virtual DOM; a few `render` functions rebuild what
  changed.

The function is equally plain: a standard `Request` in, `Response` out.

---

## Limitations

**No access control.** Anyone who can reach the site can save, overwrite and
delete shared sequences. Names are the only key, so saving under an existing name
replaces it, for everyone, with no history. Fine for a small group; not suitable
for a public link you don't control.

**Sequences don't migrate.** Deploying the shared version doesn't move anything
already saved in a browser. The shared library starts empty.

**Clips are referenced by index.** A saved sequence stores clip numbers, not
audio. Reordering or replacing files in the `CLIPS` array will change what old
sequences play back.

**First load is heavy.** The full clip set is around 42 MB. Clips are fetched in
the background two at a time and decoded on demand, but a slow connection will
notice.
