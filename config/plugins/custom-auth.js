const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");

function verify() {
  return new Promise((resolve, reject) => {
    resolve(`30303030303030303030==========`);
  });
}

class CustomAuth {
  constructor(config) {
    this.config = config;
  }

  async access(kong) {
    try {
      kong.log.notice(`🚆🚆🚆🚆🚆🚆 Hello Custom Auth`);
      const header = await kong.request.getHeader("authorization");

      if (!header) {
        await kong.response.setHeader("content-type", "application/json");
        return await kong.response.exit(
          401,
          Buffer.from(JSON.stringify({ message: "No Token" }))
        );
      }

      const token = header.split(" ")[1];
      kong.log.notice(`🚆🚆🚆🚆🚆🚆 token Response: ${token}`);

      const val = await verify();
      kong.log.notice(val);

      const client = jwksClient({
        jwksUri: "http://localhost:4003/.well-known/jwks.json",
      });

      function getKey(header, callback) {
        client.getSigningKey(header.kid, function (err, key) {
          var signingKey = key.publicKey || key.rsaPublicKey;
          callback(null, signingKey);
        });
      }

      jwt.verify(token, getKey, async (err, decoded) => {
        kong.log.notice("inside verify");

        if (err) {
          await kong.response.setHeader("content-type", "application/json");
          return await kong.response.exit(
            401,
            Buffer.from(JSON.stringify({ message: "No User" }))
          );
        }

        kong.log.notice("************************************************************");
        kong.log.notice({ err: err || "**", decoded: decoded || "**" });

        await kong.response.setHeader("x-user-info", JSON.stringify(decoded));
      });
    } catch (error) {
      const message = error.message || "Unauthorized";

      return await kong.response.exit(500, JSON.stringify({ message }));
    }
  }
}

module.exports = {
  Plugin: CustomAuth,
  Schema: [
    {
      jwksUri: {
        type: "string",
        required: true,
      },
    },
    {
      issuer: {
        type: "string",
        required: false,
        default: "http://localhost:4003",
      },
    },
    {
      authHeader: {
        type: "string",
        required: false,
        default: "Authorization",
      },
    },
  ],
  Version: "1.0.0",
  Priority: 0,
};
