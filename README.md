# Neidrūns

An audio clip sequencer, deployed on Netlify with a shared sequence library.

    public/index.html               the app
    netlify/functions/sequences.mjs the save/load API
    netlify.toml                    build config
    package.json                    one dependency, @netlify/blobs

The mp3s are not in this repo. The app fetches them from the URLs listed in
`AUDIO_BASES` near the top of the script in `public/index.html`.

## Deploying

This project can't be deployed by dragging files onto Netlify Drop, because the
function needs its dependency installed. Netlify has to build it, which means
connecting a Git repository.

1. Put this folder in a GitHub repository.
2. In Netlify: Add new site, Import an existing project, pick the repo.
3. Netlify reads `netlify.toml`, so leave the build settings alone. Publish
   directory is `public`, build command is empty.
4. Deploy. The first build installs `@netlify/blobs` and bundles the function.

Netlify Blobs needs no setup or API keys. A deployed function gets access to its
site's store automatically.

## Checking it worked

Open `https://yoursite.netlify.app/api/sequences` in a browser. You should see
`{}` on a fresh site, or a JSON object of saved sequences. If you get a 404, the
function didn't deploy — check the deploy log for the Functions section.

In the app itself, the text next to the sequences dropdown says where saves are
going: "shared with everyone on this site" or "saved in this browser only".

## Running locally

    npm install
    npx netlify dev

Serves the site and the function together, with a local blob store.

## No access control

Anyone who can reach the site can save, overwrite and delete sequences, and
there is no history. Names are the only key, so saving under an existing name
replaces it. Fine for a small group; not suitable for a public link you don't
control.

## Falling back

If the function is missing or erroring, the app quietly uses browser storage
instead, so `public/index.html` on its own still works on any static host.
