# Local brand assets

These assets are bundled locally for SVG skill icons and raster email exports;
rendering does not fetch external logos. Image artwork uses an alpha mask so all
skill icons inherit the same single-color fill, including raster email exports.

- jQuery Mobile: https://jquerymobile.com/wp-content/themes/jquery/images/logo-jquery-mobile@2x.png (official site logo).
- GWT: https://www.gwtproject.org/assets/build/img/navLogoBig.png (official site navigation logo).
- Parcel: https://parceljs.org/avatar.0b65227e.png (linked as the logo on https://parceljs.org/).
- DocuSign: https://www.docusign.com/assets/images/favicon-96x96.png (official site favicon).
- Visual Studio Code: https://github.com/devicons/devicon/blob/master/icons/vscode/vscode-original.svg (Devicon artwork, MIT project license).

Other technology marks use the installed Simple Icons and Font Awesome brand
packages. Conceptual practices use the shared text tag component instead of
generic icon placeholders. Run `node scripts/build-mail-icons.mjs` after changing
the current technology list or artwork; it also updates the résumé icon manifest.
