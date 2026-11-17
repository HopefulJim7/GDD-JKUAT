# GDD-JKUAT

## Local configuration

Copy `.env.example` to `.env.local` and fill in the Firebase web app settings
from your Firebase console. Vite loads `.env.local` for the browser. For the
server, set `DOTENV_CONFIG_PATH=.env.local` before running `npm run dev`, or
supply these variables through your hosting environment. Alternatively use
`.env`, which both Vite and dotenv load by default. Environment files are ignored
by Git. Never commit a populated Firebase configuration file.

Set the same `VITE_FIREBASE_PROJECT_ID` for the browser and server. Firebase
Admin uses Application Default Credentials; configure those separately in the
server environment, never in a `VITE_` variable.

Run `npm install`, `npm run lint`, and `npm run build`. Supply the variables in your
build environment before building, and rebuild after changing the web config.

## Previously committed Firebase configuration

The old configuration was removed from the current source, but remains in Git
history and any existing clones. The project owner should review the exposed
API key in Google Cloud Console, replace or restrict it as appropriate, review
usage, and verify Firebase Security Rules and authentication settings.

Firebase web configuration is delivered to browsers: environment variables keep
project values out of source control, but do not make the web API key secret.
Never put service account credentials in browser configuration.

Removing the original values from all Git history requires a separately
coordinated history rewrite and force push. Existing clones, forks, and cached
commit pages may retain copies even after a rewrite.
