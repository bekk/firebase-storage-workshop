# Firebase Storage Workshop

Velkommen til ein liten workshop om Firebase Cloud Storage! Det er ikkje meininga at du skal klone dette repoet, men sjekk gjerne koden for løsningsforslag.

## Del 1: Oppsett

Lag ein splitter ny React-app ved namn `firebase-storage-workshop`:

```
npx create-react-app firebase-storage-workshop --template typescript
```

Lag Firebase-prosjekt på https://console.firebase.google.com ved namn firebase-storage-workshop.
Gå til Build -> Storage og trykk Get Started. Start in test mode. Velg ein europeisk region, f.eks. eur3 (europe-west).

Installer firebase-tools om du ikkje har det:

```
npm i -g firebase-tools@latest
```

Logg inn:

```
firebase login
```

Om du allerede er logga inn på feil konto, bruk `firebase logout` først.

Initialiser prosjektet:

```
firebase init
```

Velg Storage.

Gå i firebase-konsollen igjen, framsida for prosjektet ditt. Legg til web-app. Kall den firebase-storage-workshop.
Følg instruksane for å installere Firebase SDK-en (npm install firebase) og kopier konfigurasjonen inn i App.tsx mellom dei eksisterande import-linjene og `function App() {`

## Del 2: Vise manuelt opplasta bilde

Importer følgande frå firebase/storage:

```
import { getStorage, ref, getDownloadURL } from "firebase/storage";
```

Lag ein referanse til bildet du lasta opp:

```diff
// Initialize Firebase
const app = initializeApp(firebaseConfig);

+const storage = getStorage();
+const imageRef = ref(storage, "Snø.jpg");

function App() {
```

Deretter bruk `getDownloadUrl` for å få tak i ein URL som kan brukast i `<img>`-elementet:

```diff
function App() {
+  const [imageUrl, setImageUrl] = React.useState("");
+
+  useEffect(() => {
+    getDownloadURL(imageRef).then(setImageUrl);
+  }, []);

  return (
    <div className="App">
      <header className="App-header">
-        <img src={logo} className="App-logo" alt="logo" />
+        <img src={imageUrl} height="200" width="200" />
        <p>
```

Flott! Du har vist fram eit bilde. Logg gjerne ut URLen og ta ein kikk på den. Den bør ha eit token i seg.

Last opp biletet ditt på nytt i Firebase-konsollen og sjekk at tokenet i URLen endrar seg, sjølv om bildet er likt.

Når man lastar opp eit bilete på nytt, vil nemleg dette tokenet bli endra. Så ver forsiktig men lagring av fulle URLar, dei kan bli utdaterte.

Kopier URLen og hardkod denne inn i `src`. Fjern token-delen av URLen og refresh sida. Det skal fortsatt gå fint. Det er fordi me har fullstendig åpne Security Rules, som gjer at alle bilete er offentlege.

## Del 3: Opplasting

Legg til eit input-element for opplasting av filer i App.tsx:

```typescript
<input
  type="file"
  id="file-upload"
  name="file-upload"
  accept="image/png, image/jpeg"
  onChange="{uploadFile}"
/>
```

Legg også til funksjonen `uploadFile` som tar seg av opplastinga:

```typescript
const uploadFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const uploadedImageRef = ref(storage, file.name);

  uploadBytes(uploadedImageRef, file).then((snapshot) => {
    alert("Uploaded file successfully!");
  });
};
```

Bruk den nye knappen din til å laste opp eit bilete. Sjekk i Firebase-konsollen etterpå at biletet ditt vart lasta opp.

### Bonusoppgåver:

- Bruk `uploadBytesResumable` og listeners til å lage "progress bar" for opplasting. (https://firebase.google.com/docs/storage/web/upload-files#monitor_upload_progress)
- Bruk `listAll` til å liste ut og vise alle bileta du har lasta opp (https://firebase.google.com/docs/storage/web/list-files#list_all_files)

## Del 4: Autentisering

Før me ser på Security Rules bør me ha implementert autentisering. Me gjer det enkelt med Anonynmous Authentication.

Gå til Firebase Console -> Authentication og aktiver Anonymous authentication.

Importer nødvendig kode frå Firebase Authentication:

```diff
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
+import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import "./App.css";
```

Legg til referance til `auth` ein plass etter `initializeApp`:

```diff
const app = initializeApp(firebaseConfig);

const storage = getStorage();
+const auth = getAuth();
```

Legg til slutt denne useEffecten til i App-komponenten:

```diff

function App() {
  const [imageUrl, setImageUrl] = React.useState("");
+  const [uid, setUid] = React.useState<string | undefined>();
+
+  useEffect(() => {
+    return onAuthStateChanged(auth, (user) => {
+      if (!user) {
+        signInAnonymously(auth).catch(console.error);
+      }
+      console.log("uid", user?.uid);
+      setUid(user?.uid);
+    });
+  }, []);
```

Denne vil logge deg inn anonymt dersom du ikkje allerede er logga inn.
Sjekk gjerne i Authentication i Firebase Console at det er blitt oppretta ein brukar.

## Del 5: Stuktur og Security Rules

Målet vårt no blir at berre eigaren av eit bilete kan slette og endre det, men at alle andre kan sjå det. For å få dette til, bør me endre litt på filstrukturen vår.

Bruk `user.uid` for å lage ei slags "mappe" for kvar brukar, som me legg bileta i.

```diff
const uploadFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
+
+  if (!uid) {
+    return alert("uid manglar!");
+  }

-  const uploadedImageRef = ref(storage, file.name);
+  const uploadedImageRef = ref(storage, `${uid}/${file.name}`);

  uploadBytes(uploadedImageRef, file).then((snapshot) => {
    alert("Uploaded file successfully!");
  });
};
```

Prøv å laste opp eit bilete igjen no. Sjekk at det legg seg riktig i Firebase Console.

No kan me oppdatere Security Rules til å sikre at ingen andre brukarar kan endre eller slette våre eigne bilete. Bytt ut innhalder i `storage.rules` med dette:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{uid} {
      match /{allPaths=**} {
        allow write: if request.auth.uid == uid;
      }
    }
    match /{allPaths=**} {
      allow read: if true;
    }
  }
}
```

Deploy dette med `firebase deploy --only storage` eller lim inn det same innhaldet under Storage -> Rules i Firebase Console.

Desse reglane gir skrivetilgang til alle filer under `uid` dersom brukaren som gjer kallet (`request.auth.uid`) matcher prefiksen på mappa!

Alle andre får lesetilgang til alle filer, sjølv dei som ikkje er logga inn.

### Bonusoppgåver:

- La kun innlogga brukarar få lesetilgang.

## Del 6: Emulering

Dette går jo susande bra. Men å teste rett mot "prod" er ikkje optimalt. La oss derfor ta i bruk _Firebase Emulator Suite_.

Kjør denne badboyen igjen:

```
firebase init
```

Velg **Emulators** på spørsmålet «Which Firebase features ...»

Velg Authentication og Storage på spørsmålet «Which Firebase emulators do you want to set up?»

Når dette er gjort, kan du starte emulatorane med:

```
firebase emulators:start
```

I `App.tsx` må du så legge til følgande kode for å be Firebase bruke emulatorane:

```diff
const storage = getStorage();
const auth = getAuth();

+if (window.origin.startsWith("http://localhost")) {
+  connectStorageEmulator(storage, "localhost", 9199);
+  connectAuthEmulator(auth, "http://localhost:9099");
+}
```

Du må nok lukke utviklingsserveren og starte den på nytt (`npm start`).

Last opp eit bilete i appen din og sjekk emulator-konsollen på http://127.0.0.1:4000 at fila er lasta opp.

## Del 7: Lage thumbnail med Cloud Functions

Det hadde vore kult å kunne vise små previews eller _thumbnails_ av alle opplasta bilete, og så la brukaren trykke på eit for å sjå det på stort format. Dette kan me sjølvsagt gjere med bileta som er lasta opp, som dei er. Men å laste ned kjempestore bilete berre for å vise bittesmå versjonar av dei, er sløsing av bandbreidde. Og det betalar du for! Så la oss lage ein _Cloud Function_ som lagar små thumbnail-versjonar av bileta som blir lasta opp.

Det me ønsker å lage er ein funksjon som:

1. Blir automatisk kjørt når ein brukar har lasta opp eit bilete
2. Lastar ned biletet og lagar ein liten thumbnail-kopi av dette
3. Lastar opp thumbnail-biletet i brukaren si mappe, med ein postfix i namnet.

Ok, let's go.

Installer Functions-emulatoren:

```
firebase init
```

Velg både Emulators og Functions på det første spørsmålet.

Du kan godt svare JA til Typescript og NEI til ESLint.

Velg Functions-emulatoren på neste spørsmål.

No skal du ha fått ei heilt ny mappe som heiter `functions` med masse greier inni. Bytt ut innhaldet i `functions/src/index.ts` med dette:

```typescript
import * as functions from "firebase-functions";

exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    console.log("Oi oi! Her skjer det ting!");
    console.log(object);
  });
```

Det er nok for å teste litt i første omgang. Denne enkle funksjonen vil køyre når eit objekt er ferdig lasta opp til storage.

Gå inn i functions-mappa og bygg prosjektet ein gong:

```
cd functions
npm run build
```

No kan du restarte emulatorane i rot-mappa, og du skal sjå at du har emulatorar for både Authentication, Functions og Storage køyrande, på hhv. port 9099, 5001 og 9199.

Last opp eit bilete i appen din, og følg med i terminalen der emulatorane din køyrer. Du skal sjå at der skjer det ting!

Ok, no er det på tide å gjere noko fornuftig og begynne på thumbnail-genereringa.

Gå inn i functions og installer biblioteket `sharp`. Dette skal ta seg av resizinga for oss:

```
cd functions
npm install sharp @types/sharp
```

Legg også til `"esModuleInterop": true` i `functions/tsconfig.json` sine `"compilerOptions"` for å unngå klaging på import av sharp.

Bytt deretter ut innhaldet i `functions/src/index.ts` med dette:

```typescript
import { pipeline } from "stream/promises";

import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

initializeApp();

const storage = getStorage();

exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const { bucket, name } = object;

    // Dette unngår evig løkke. Functionen vil også trigge på opplasting av thumbnails!
    if (!name || name.endsWith(".thumbnail.jpg")) {
      return;
    }

    // Denne transformeren vil lage JPEGs som er maks 200 px høge eller breie av det me sender til den.
    const imageTransformer = sharp().jpeg().resize(200);

    const downloadStream = storage
      .bucket(bucket)
      .file(name)
      .createReadStream({ validation: !process.env.FUNCTIONS_EMULATOR });

    const uploadStream = storage
      .bucket(bucket)
      .file(name.replace(/\..+$/, ".thumbnail.jpg"))
      .createWriteStream({
        contentType: "image/jpeg",
        resumable: false,
      });

    // Me streamer alt og slepp å laste ned heile biletet i minne før me lastar opp igjen.
    // Minne-effektivt og raskt!
    return pipeline(downloadStream, imageTransformer, uploadStream);
  });
```

Bygg functions-prosjektet igjen og restart emulatorane.

```
cd functions
npm run build
cd ..
firebase emulators:start
```

Test å laste opp eit bilete i appen din, og sjekk filene i http://127.0.0.1:4000/storage. Der burde både hovudbiletet og thumbnailen ligge!

### Bonusoppgåver

- Bruk thumbnails på nettsida di, og vis original-biletet ved trykk på thumbnail.
- Lag ein function som slettar thumbnails når hovudbiletet vert sletta.
- Lag ein function som slettar alle bileta til ein brukar når ein brukar vert sletta (https://firebase.google.com/docs/functions/auth-events)
