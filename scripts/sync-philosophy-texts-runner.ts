/**
 * @file sync-philosophy-texts-runner.ts
 * Übernimmt aktualisierte Philosophie-Defaults aus der Registry in die DB.
 */

import "dotenv/config";

import {
  ensurePlatformTextDefaults,
  syncPlatformTextRegistryDefaults,
} from "../lib/platform-text/platform-text-service";

async function main() {
  const created = await ensurePlatformTextDefaults();
  const philosophy = await syncPlatformTextRegistryDefaults({
    keyPrefix: "philosophy.",
  });
  const forcedImages = await syncPlatformTextRegistryDefaults({
    forceUpdate: true,
    keys: [
      "philosophy.header.title",
      "philosophy.header.image",
      "philosophy.header.image_alt",
      "philosophy.card1.image",
      "philosophy.card1.image_alt",
      "philosophy.card2.image",
      "philosophy.card2.image_alt",
      "philosophy.card3.image",
      "philosophy.card3.image_alt",
      "philosophy.card4.image",
      "philosophy.card4.image_alt",
      "philosophy.card5.image",
      "philosophy.card5.image_alt",
      "philosophy.card6.image",
      "philosophy.card6.image_alt",
    ],
  });
  const homePhilosophy = await syncPlatformTextRegistryDefaults({
    keyPrefix: "home.philosophy.",
  });

  console.log(`Neu angelegt: ${created}`);
  console.log(`Philosophie aktualisiert: ${philosophy.updated} (übersprungen: ${philosophy.skipped})`);
  console.log(`Bilder erzwungen: ${forcedImages.updated}`);
  console.log(
    `Startseite-Philosophie aktualisiert: ${homePhilosophy.updated} (übersprungen: ${homePhilosophy.skipped})`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
