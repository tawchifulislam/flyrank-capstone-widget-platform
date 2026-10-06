const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../config');
const userRepository = require('../repositories/userRepository');

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(100),
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseCredentials(body) {
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid email or password format');
  }
  return parsed.data;
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function signup(body) {
  const { email, password } = parseCredentials(body);
  const existing = await userRepository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
  });
  return { user: { id: user.id, email: user.email }, token: signToken(user) };
}

async function login(body) {
  const { email, password } = parseCredentials(body);
  const user = await userRepository.findByEmail(email.toLowerCase());
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    throw new HttpError(401, 'Invalid credentials');
  }
  return { user: { id: user.id, email: user.email }, token: signToken(user) };
}

module.exports = { signup, login, HttpError };
