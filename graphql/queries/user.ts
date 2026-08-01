// graphql/queries/user.ts — user queries.
import { gql } from '@apollo/client';

import { USER_FIELDS } from '../fragments';

// Authed — the Apollo auth link attaches the Bearer token automatically.
export const ME = gql`
  query Me {
    me { ${USER_FIELDS} }
  }
`;
