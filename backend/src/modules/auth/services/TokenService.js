class TokenService {
  constructor({ supabase }) { this.supabase = supabase; }

  async verifyAccessToken(token) {
    if (!token || !this.supabase) return null;
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return {
      userId: data.user.id,
      email: data.user.email || '',
      provider: data.user.app_metadata?.provider || 'supabase',
      claims: data.user.app_metadata || {},
    };
  }
}

module.exports = TokenService;
