# Forex4you Trading Platform – Passwortgeschütztes Terminal

Professionelle Simulationstrading- und Forex-Plattform mit Live-Marktdaten, Order-Execution-Engine und serverseitigem Passwortschutz für die gesamte Anwendung.

---

## 🔐 Passwortschutz & Sicherheit

Die gesamte Anwendung ist durch ein zentrales Passwort geschützt:
* **Kein Benutzername / Keine Registrierung**: Es wird nur ein einziges Zugangspasswort benötigt.
* **Serverseitige Authentifizierung**: Das Passwort wird niemals im Frontend-Bundle oder im Client-Code exponiert.
* **Timing-sichere Validierung**: Schützt vor Side-Channel- und Timing-Angriffen.
* **HttpOnly-Cookie-Session**: Der Login-Zustand wird über einen kryptographisch signierten `site_session`-Cookie mit `HttpOnly`, `SameSite=Lax` und `Secure` aufrechterhalten.
* **Zugriffsschutz**: Unauthentifizierte Anfragen erhalten keinen Zugriff auf geschützte Marktdaten oder Trading-Komponenten.
* **Logout-Funktion**: Sitzungen können jederzeit über das Benutzermenü (Desktop), das mobile Aktionsmenü oder die Einstellungen beendet werden.

---

## 🚀 Deployment auf Vercel (GitHub Integration)

Die Anwendung ist vollständig vorkonfiguriert für das direkte Deployment via **GitHub und Vercel**.

### 1. Repository auf GitHub pushen
Pushen Sie den Quellcode in Ihr GitHub-Repository.

### 2. Projekt in Vercel importieren
1. Melden Sie sich bei [Vercel](https://vercel.com) an.
2. Klicken Sie auf **"Add New..."** → **"Project"**.
3. Wählen Sie das importierte GitHub-Repository aus.
4. Framework-Voreinstellung: **Vite** (Build Command: `npm run build`, Output Directory: `dist`).

### 3. Vercel Environment Variables einrichten

Gehen Sie in Vercel vor dem ersten Deployment auf **"Environment Variables"** und hinterlegen Sie folgende Variable:

| Variable Name | Pflicht | Vorgabewert | Beschreibung |
|---|---|---|---|
| `SITE_PASSWORD` | **Ja** | `Demo123456!` | Das zentrale Passwort zum Entsperren der Website. Kann beliebig geändert werden. |
| `FINNHUB_API_KEY` | *Optional* | *(Ihr Finnhub Token)* | Für Live-Marktdaten-Streaming über Finnhub WebSocket. Falls leer, läuft der Simulator. |

> **Wichtig:** Verwenden Sie **kein** `VITE_`-Präfix für `SITE_PASSWORD`. Das Passwort verbleibt ausschließlich in der sicheren Serverless-Laufzeitumgebung und wird niemals in JavaScript-Bundles kompiliert.

### 4. Deployen
Klicken Sie auf **"Deploy"**. Vercel erstellt automatisch das Frontend-Build und die Serverless-Routen unter `/api/*`.

---

## 💻 Lokale Entwicklung

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Lokale `.env`-Datei anlegen:
   ```env
   SITE_PASSWORD="Demo123456!"
   # FINNHUB_API_KEY="YOUR_KEY" (optional)
   ```

3. Server starten:
   ```bash
   npm run dev
   ```
   Die App läuft standardmäßig unter `http://localhost:3000`.

---

## 🛡️ Verhalten bei der Authentifizierung

* **Erster Aufruf**: Die Website zeigt die Autorisierungsmaske an.
* **Korrektes Passwort**: Erzeugt eine 7-Tage-Session im HttpOnly-Cookie und schaltet das komplette Forex-Terminal frei.
* **Falsches Passwort**: Zeigt die neutrale Fehlermeldung „Falsches Passwort“.
* **Keine Secrets in Logs**: Weder Passwörter noch sensible Token werden in den Console-Logs ausgegeben.
