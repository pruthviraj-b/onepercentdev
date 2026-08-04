const identitySchema = Object.freeze({
  userId: 'string',
  email: 'string',
  roles: 'string[]',
  permissions: 'string[]',
});

module.exports = { identitySchema };
