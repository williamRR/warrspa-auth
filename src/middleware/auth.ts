import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/auth';

declare module 'fastify' {
  interface FastifyRequest {
    jwtPayload?: JwtPayload;
  }
}

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const decoded = request.user as JwtPayload;
    request.jwtPayload = decoded;
  } catch (err) {
    return reply.status(401).send({
      error: 'invalid_token',
      message: 'Invalid or expired access token',
    });
  }
}
