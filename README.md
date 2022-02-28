# Bellamar
web obra Bellamar

La web es bilingue, en catalán (por definición) y en castellano. Usamos el framework de internacionalización https://www.i18next.com/. Las traducciones vienen del archivo blob/main/public/translations.json

Guardamos 2 cookies en el ordenador del visitante usando https://github.com/js-cookie/js-cookie: Uno para recordar si ya ha sido visitada la web, y la otra para guardar el idioma seleccionado.

## Install and run

To install dependencies:

	npm install

Start a development server (available at http://localhost:3000):

    npm start

To generate a build ready for production:

    npm run build

Then deploy the contents of the `dist` directory to your server.  You can also run `npm run serve` to serve the results of the `dist` directory for preview.
