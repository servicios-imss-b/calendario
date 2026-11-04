# Mi Calendario

Calendario compartido de cumpleaños y vacaciones. No usa cuentas ni contraseñas; las personas se agregan por nombre y reciben 10 días de vacaciones por semestre.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Ejecuta `npm run dev`.
3. Sin `VITE_APPS_SCRIPT_URL`, los datos se guardan en el navegador.

## Google Sheets y GitHub Pages

La hoja compartida usa cuatro pestañas: `PERSONAS`, `CUMPLEAÑOS`, `VACACIONES` y `SALDOS`. El proyecto Apps Script de la hoja debe contener el código de [simpleAppsScriptCode.ts](src/services/simpleAppsScriptCode.ts); ejecuta `setupSheets` para crear las pestañas faltantes sin borrar datos.

Implementa el script como aplicación web, ejecutada como tu cuenta y accesible para cualquiera. La lectura y las escrituras son públicas; cualquier visitante puede consultar los datos y registrar personas, cumpleaños y vacaciones.

En GitHub, define la variable de repositorio `VITE_APPS_SCRIPT_URL` con la URL `/exec` del despliegue. Habilita GitHub Pages con GitHub Actions; el workflow de `.github/workflows/pages.yml` compila y publica el sitio. La URL debe ser pública porque se incluye en el JavaScript del navegador.
