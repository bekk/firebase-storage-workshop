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
