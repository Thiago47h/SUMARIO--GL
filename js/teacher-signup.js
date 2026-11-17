(() => {
  const api = 'https://mgwrovpwoqzzgfcwisfu.supabase.co';
  const apiKey = 'sb_publishable_HSX0TcfcQJKfZ1eDowcvOw_tf9dRztB';
  const form = document.getElementById('signup-form');
  const message = document.getElementById('message');
  async function request(path, body, token) {
    const response = await fetch(api + path, {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify(body),
    });
    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error('Não foi possível concluir o cadastro.');
      error.code = result.error_code || result.code;
      error.status = response.status;
      throw error;
    }
    return result;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    if (button.disabled) return;
    const fields = new FormData(form);
    const name = fields.get('name').trim();
    const email = fields.get('email').trim();
    const password = fields.get('password');
    if (name.length < 2) {
      message.textContent = 'Informe seu nome completo.';
      return;
    }
    if (password.length < 8 || password !== fields.get('confirmation')) {
      message.textContent = 'Use pelo menos 8 caracteres e confirme a mesma senha nos dois campos.';
      return;
    }
    button.disabled = true;
    message.textContent = 'Criando sua conta…';
    let created = false;
    try {
      const session = await request('/auth/v1/signup', {
        email, password, data: { name, signup_source: 'semanario' },
      });
      if (!session.access_token) {
        message.textContent = 'Se o cadastro foi aceito, confira seu e-mail para concluir. Se já possui uma conta, use o login ou recupere sua senha.';
        return;
      }
      created = true;
      await request('/rest/v1/semanario_profiles', {
        user_id: session.user.id, name, role: 'teacher',
      }, session.access_token);
      message.textContent = 'Conta de professor criada. Volte ao login para entrar.';
      form.reset();
      form.hidden = true;
    } catch (error) {
      if (created) {
        message.textContent = 'A conta foi criada. Volte ao login para concluir o acesso de professor.';
      } else if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        message.textContent = 'Este e-mail já possui uma conta. Entre pelo login ou recupere sua senha.';
      } else if (error.status === 429) {
        message.textContent = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      } else if (error.code === 'signup_disabled') {
        message.textContent = 'O cadastro está temporariamente fechado. Fale com a secretaria.';
      } else {
        message.textContent = 'Não foi possível criar a conta. Confira os dados e sua conexão ou fale com a secretaria.';
      }
    } finally {
      button.disabled = false;
    }
  });
})();