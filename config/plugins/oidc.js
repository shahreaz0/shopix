const axios = require("axios");
const qs = require("qs");

class CustomAuth {
  constructor(config) {
    this.config = config;
  }

  async access(kong) {
    try {
      kong.log.notice(`🚆🚆🚆🚆🚆🚆 Hello from OIDC`);
      const authHeader = await kong.request.getHeader("authorization");

      kong.log.notice(`🚆🚆🚆🚆🚆🚆 auth`, authHeader);

      if (!authHeader) {
        await kong.response.setHeader("content-type", "application/json");
        return await kong.response.exit(
          401,
          Buffer.from(JSON.stringify({ message: "No Token" }))
        );
      }

      const [bearer, token] = authHeader.split(" ");

      if (bearer !== "Bearer") {
        await kong.response.setHeader("content-type", "application/json");
        return await kong.response.exit(
          401,
          Buffer.from(JSON.stringify({ message: "Only bearer token allowed" }))
        );
      }

      const payload = qs.stringify({
        client_id: this.config.kc_client_id,
        client_secret: this.config.kc_client_secret,
        token: token,
      });

      const { data } = await axios.post(this.config.kc_introspect_url, payload);

      if (!data.active) {
        await kong.response.setHeader("content-type", "application/json");
        return await kong.response.exit(
          401,
          Buffer.from(JSON.stringify({ message: "Unauthorized" }))
        );
      }

      await kong.response.setHeader("x-user-email", data.email);
      await kong.response.setHeader("x-user-id", data.sid);
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
      kc_client_id: {
        type: "string",
        required: true,
      },
    },
    {
      kc_client_secret: {
        type: "string",
        required: true,
      },
    },
    {
      kc_introspect_url: {
        type: "string",
        required: true,
        default: "Authorization",
      },
    },
  ],
  Version: "1.0.0",
  Priority: 0,
};
