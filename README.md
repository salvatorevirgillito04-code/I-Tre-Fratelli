# I Tre Fratelli · Lugo (RA)

Sito vetrina del ristorante I Tre Fratelli, Via di Giù 56, 48022 Lugo (RA).
Sito statico: HTML, CSS e JavaScript, nessuna dipendenza da installare.

## Aprirlo
Apri `index.html` nel browser, oppure pubblica la cartella così com'è su Netlify, GitHub Pages o qualsiasi hosting statico.

## Cosa contiene
- **Hero** con piatto che ruota allo scroll, vapore e braci animate (canvas).
- **La sfoglia**: animazione guidata dallo scroll, uova e farina → impasto → mattarello → taglio → tagliatelle.
- **Brace e arrosti** con braci che reagiscono al mouse.
- **Orari** con stato aperto/chiuso in tempo reale calcolato sull'ora italiana (`js/main.js`, costante `SLOTS`).
- **Prenotazione**: il modulo compone il messaggio e apre WhatsApp al 335 678 0073.
- SEO locale: dati strutturati `Restaurant` (schema.org), Open Graph, `robots.txt`, `sitemap.xml`.

## Da fare prima della pubblicazione
- Foto: in parte da Wikimedia Commons (licenze libere, crediti nel footer), in parte generate con Canva AI (`img/gen-*`). Vanno sostituite col tempo con foto vere del ristorante.
- Confermare i piatti del menù (sezione `#menu`, segnati con `data-assumed`) e i tempi di percorrenza.
- Indirizzo attuale: https://salvatorevirgillito04-code.github.io/I-Tre-Fratelli/ (GitHub Pages). Con un dominio proprio aggiornare canonical, og, `robots.txt` e `sitemap.xml`.
- Per cambiare gli orari: tabella in `index.html` + `SLOTS` e `slotsFor` in `js/main.js` + JSON-LD.
