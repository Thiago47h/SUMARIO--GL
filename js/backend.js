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
    return { ...row, date: start_date, endDate: end_date, coordObservation: semanario_notes?.note || '', reviewStatus: semanario_notes?.reviewed_revision === row.revision ? semanario_notes.review_status : 'enviado', reviewedAt: semanario_notes?.reviewed_at || null };
  }

  async function records() {
    const all = [];
    for (let offset = 0; ; offset += 500) {
      const page = await request('/rest/v1/semanario_plans?select=*,semanario_notes(note,review_status,reviewed_revision,reviewed_at)&deleted_at=is.null&order=id&limit=500&offset=' + offset);
      all.push(...page.map(fromPlan));
      if (page.length < 500) return all;
    }
  }

  return {
    records,
    async login(email, password) {
      const session = await request('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      token = session.access_token;
      try {
        let [profile] = await request('/rest/v1/semanario_profiles?select=name,role');
        const details = session.user.user_metadata || {};
        if (!profile && details.signup_source === 'semanario') {
          const name = String(details.name || '').trim();
          await request('/rest/v1/semanario_profiles', {
            method: 'POST',
            body: JSON.stringify({ user_id: session.user.id, name, role: 'teacher' }),
          });
          [profile] = await request('/rest/v1/semanario_profiles?select=name,role');
        }
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
    async saveMany(plans) {
      if (!plans.length) throw new Error('Selecione ao menos uma turma.');
      // One bulk insert: all classroom records are saved in the same transaction.
      const rows = await request('/rest/v1/semanario_plans', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(plans.map(({ date, endDate, ...plan }) => ({
          ...plan, start_date: date, end_date: endDate,
        }))),
      });
      if (!rows || rows.length !== plans.length) throw new Error('Resposta de gravação incompleta.');
      return rows.map(fromPlan);
    },
    async remove(id) {
      const [record] = await request('/rest/v1/semanario_plans?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      });
      if (!record) throw new Error('Semanário indisponível.');
    },
    async review(record, status, note) {
      if (!['aprovado','ajustes'].includes(status) || (status === 'ajustes' && !note.trim())) throw new Error('Revisão inválida.');
      const body = { note, review_status: status, reviewed_revision: record.revision };
      const path = '/rest/v1/semanario_notes?plan_id=eq.' + encodeURIComponent(record.id);
      const update = () => request(path, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) });
      const updated = await update();
      if (!updated.length) {
        try {
          await request('/rest/v1/semanario_notes', { method: 'POST', body: JSON.stringify({ plan_id: record.id, ...body }) });
        } catch (error) {
          if (!(await update()).length) throw error;
        }
      }
      return records();
    },
  };
})();
