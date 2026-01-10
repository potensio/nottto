import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation
interface TokenPayload {
  sub: string;
  email: string;
}

export async function generateAccessToken(
  payload: TokenPayload
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

export async function generateRefreshToken(
  payload: TokenPayload
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);
}

export async function generateTokens(
  payload: TokenPayload
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);

  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
  const { payload } = await jwtVerify(token, secret);

  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}
