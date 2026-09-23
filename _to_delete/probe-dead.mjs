import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import { GraphQLError } from 'graphql';

const DEAD = new Set(['TOKEN_REVOKED', 'SESSION_EXPIRED', 'UNAUTHENTICATED']);
const isDeadSession = (error) => {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some((e) => DEAD.has(e.extensions?.code));
};

const combined = (code) =>
  new CombinedGraphQLErrors({ errors: [new GraphQLError('x', { extensions: { code } })] });
const http = (status, body) =>
  new ServerError('http', { response: new Response('', { status }), bodyText: body });

const cases = [
  ['server: SESSION_EXPIRED', combined('SESSION_EXPIRED'), true],
  ['server: UNAUTHENTICATED', combined('UNAUTHENTICATED'), true],
  ['server: TOKEN_REVOKED', combined('TOKEN_REVOKED'), true],
  ['server: RATE_LIMITED', combined('RATE_LIMITED'), false],
  ['server: INTERNAL', combined('INTERNAL'), false],
  ['server: EMAIL_NOT_VERIFIED', combined('EMAIL_NOT_VERIFIED'), false],
  ['no signal at all', new TypeError('Network request failed'), false],
  ['request timed out', new Error('Aborted'), false],
  ['HTTP 502, backend restarting', http(502, '<html>502</html>'), false],
  ['HTTP 429 from rate limiter', http(429, 'Too many requests'), false],
  ['HTTP 401 with no GraphQL body', http(401, 'Unauthorized'), false],
  ['captive portal HTML', new ServerParseError('parse', { response: new Response('', { status: 200 }), bodyText: '<html>login</html>' }), false],
];

let bad = 0;
for (const [label, err, expected] of cases) {
  const dead = isDeadSession(err);
  const ok = dead === expected;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label.padEnd(30)} -> ${dead ? 'SIGN OUT' : 'stay signed in'}`);
}
console.log(bad === 0 ? '\nall 12 cases correct' : `\n${bad} WRONG`);
