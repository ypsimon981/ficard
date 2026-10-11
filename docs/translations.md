# Interface translations

The seven `locales/{it,en,fr,es,pt,nl,de}.js` files contain the interface messages, ScanDixit labels, dynamic message templates, sharing suggestions and analytics disclosures. Load them before theme, translation and content scripts. The web service worker, native builder and standalone ScanDixit builder include the same files.

`ficard-i18n.js` translates the canonical Italian interface and matches counted messages using named placeholders. The language picker reloads the canonical page when its selection changes. `scandixit-i18n.js` also observes text and attribute updates, normalizes whitespace and preserves source text for language refreshes. It follows the parent app language or the saved/device language when standalone.

Use `ScanDixitI18n.t(source, variables)` for scanner states, shelf actions, dialogs and constructed messages. Every new message must have the same key and placeholders in all seven files. Product names, ingredients, descriptions, codes, card aliases and other user data must remain unchanged; mark their DOM containers with `data-i18n-skip`.

Run `npm test` to verify language-file completeness, changing languages, dynamically updated labels, counted backup messages and offline packaging. Device rendering still needs a visual check on release builds.
