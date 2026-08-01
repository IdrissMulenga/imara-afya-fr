// graphql/fragments.ts — shared field selections so every operation returns
// the same User shape (and one place to edit when the model changes).
export const USER_FIELDS = `
  id
  firstName
  lastName
  email
  agreedToTerms
  image
  height
  weight
  gender
  religion
  plan
  waterGoal
  cycleRegularity
  ramadanMode
  suhoorTime
  iftarTime
`;
