import type { H3Event } from 'h3';

export function requireIntParam(event: H3Event, name: string): number {
  const value = Number(getRouterParam(event, name));
  if (isNaN(value)) {
    throw createError({ statusCode: 400, message: 'ID non valido' });
  }
  return value;
}
