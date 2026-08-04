function assertIdentity(identity) {
  if (!identity || typeof identity.userId !== 'string' || !identity.userId) throw new Error('Invalid identity');
  return identity;
}

module.exports = { assertIdentity };
