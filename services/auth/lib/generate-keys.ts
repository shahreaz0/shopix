import * as jose from "jose";
import fs from "node:fs";

export async function generateKeys() {
  try {
    const { publicKey, privateKey } = await jose.generateKeyPair("RS256", {
      extractable: true,
    });

    const privatePem = await jose.exportPKCS8(privateKey);
    const publicPem = await jose.exportSPKI(publicKey);

    const publicJwk = await jose.exportJWK(publicKey);

    publicJwk.use = "sig";
    publicJwk.kid = crypto.randomUUID();

    const jwks = {
      keys: [publicJwk],
    };

    if (!fs.existsSync("certs")) {
      fs.mkdirSync("certs");
    }

    if (!fs.existsSync("public/.well-known")) {
      fs.mkdirSync("public/.well-known", {
        recursive: true,
      });
    }

    fs.writeFileSync("public/.well-known/jwks.json", JSON.stringify(jwks));

    fs.writeFileSync("certs/private.pem", privatePem);
    fs.writeFileSync("certs/public.pem", publicPem);

    console.log("=============================");
    console.log("Keys generated");
    console.log("=============================");
  } catch (error) {
    console.log(error);
  }
}

generateKeys();
