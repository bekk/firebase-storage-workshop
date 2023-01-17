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
