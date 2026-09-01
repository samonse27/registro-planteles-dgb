# Registro de planteles DGB

Versión compatible con Next.js y Vercel del formulario de registro de planteles.

## Desarrollo local

1. Instala Node.js 22.
2. Ejecuta `npm install`.
3. Copia `.env.example` como `.env.local`.
4. Coloca la URL privada de Power Automate en `POWER_AUTOMATE_URL`.
5. Ejecuta `npm run dev`.

## Publicación en Vercel

1. Sube este proyecto a un repositorio privado de GitHub.
2. En Vercel, selecciona **Add New → Project** e importa el repositorio.
3. En **Environment Variables**, crea `POWER_AUTOMATE_URL` y pega la URL completa del desencadenador HTTP.
4. Selecciona los entornos **Production**, **Preview** y **Development**.
5. Publica el proyecto.
6. Para usar un dominio propio, abre **Settings → Domains** y agrega el dominio o subdominio.

Nunca escribas la URL de Power Automate en archivos que se subirán a GitHub.
Desplegado en Vercel.
