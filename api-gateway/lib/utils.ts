import * as jose from "jose";

type Payload = {
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  email: string;
  id: string;
  name: string;
  role: "USER" | "ADMIN";
  verified: boolean;
};

export async function verifyJWT(jwt: string) {
  const JWKS = jose.createRemoteJWKSet(
    new URL("http://localhost:4003/.well-known/jwks.json")
  );

  try {
    const { payload } = await jose.jwtVerify(jwt, JWKS, {
      issuer: "http://localhost:4003",
    });

    return payload as Payload;
  } catch (error) {
    console.log(error);

    return null;
  }
}
