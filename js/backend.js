const semanarioBackend = (() => {
  const url = 'https://mgwrovpwoqzzgfcwisfu.supabase.co';
  const apiKey = 'sb_publishable_HSX0TcfcQJKfZ1eDowcvOw_tf9dRztB';
  let token = '';

  async function request(path, options = {}) {
    const response = await fetch(url + path, {
      ...options,
      headers: {
        apikey: apiKey,
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error('Solicitação recusada: ' + response.status);
    const body = await response.text();
    return body ? JSON.parse(body) : undefined;
  }

  function fromPlan({ start_date, end_date, semanario_notes, ...row }) {
    return { ...row, date: start_date, endDate: end_date, coordObservation: semanario_notes?.note || '' };
  }

  async function records() {
    const all = [];
    for (let offset = 0; ; offset += 500) {
      const page = await request('/rest/v1/semanario_plans?select=*,semanario_notes(note)&order=id&limit=500&offset=' + offset);
      all.push(...page.map(fromPlan));
      if (page.length < 500) return all;
    }
  }

  return {
    async login(email, password) {
      const session = await request('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      token = session.access_token;
      try {
        const [profile] = await request('/rest/v1/semanario_profiles?select=name,role');
        if (!profile) throw new Error('Perfil não cadastrado.');
        return { profile, records: await records() };
      } catch (error) {
        token = '';
        throw error;
      }
    },
    logout() { token = ''; },
    async save(id, { date, endDate, ...plan }) {
      const path = '/rest/v1/semanario_plans' + (id ? '?id=eq.' + encodeURIComponent(id) : '');
      const [row] = await request(path, {
        method: id ? 'PATCH' : 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ ...plan, start_date: date, end_date: endDate }),
      });
      if (!row) throw new Error('Semanário indisponível.');
      return fromPlan(row);
    },
    async saveNote(id, note) {
      const path = '/rest/v1/semanario_notes?plan_id=eq.' + encodeURIComponent(id);
      const [updated] = await request(path, {
        method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ note }),
      });
      if (updated) return;
      await request('/rest/v1/semanario_notes', {
        method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ plan_id: id, note }),
      });
    },
  };
})();
