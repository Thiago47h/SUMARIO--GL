(() => {
  const api = 'https://mgwrovpwoqzzgfcwisfu.supabase.co/auth/v1';
  const apiKey = 'sb_publishable_HSX0TcfcQJKfZ1eDowcvOw_tf9dRztB';
  const message = document.getElementById('message');
  const requestForm = document.getElementById('request-form');
  const resetForm = document.getElementById('reset-form');
  const params = new URLSearchParams(location.hash.slice(1));
  let accessToken = params.get('type') === 'recovery' ? params.get('access_token') : null;
  history.replaceState(null, '', location.pathname);
  window.addEventListener('pagehide', () => { accessToken = null; });

  async function call(path, method, body, token) {
    const response = await fetch(api + path, {
      method,
      headers: { apikey: apiKey, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error('Falha na solicitação');
      error.status = response.status;
      error.code = result.error_code || result.code;
      throw error;
    }
    return result;
  }

  if (params.has('error') || params.has('error_code')) {
    message.textContent = 'O link expirou ou é inválido. Solicite um novo abaixo.';
  }

  if (accessToken) {
    requestForm.hidden = true;
    message.textContent = 'Validando o link…';
    call('/user', 'GET', null, accessToken).then(() => {
      document.getElementById('title').textContent = 'Redefinir senha';
      document.getElementById('intro').textContent = 'Escolha e confirme sua nova senha.';
      message.textContent = '';
      resetForm.hidden = false;
    }).catch(() => {
      accessToken = null;
      requestForm.hidden = false;
      message.textContent = 'Não foi possível validar o link. Solicite outro ou tente novamente quando a conexão voltar.';
    });
  }

  requestForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = requestForm.querySelector('button');
    if (button.disabled) return;
    button.disabled = true;
    message.textContent = 'Enviando solicitação…';
    try {
      const email = new FormData(requestForm).get('email').trim();
      await call('/recover', 'POST', { email });
      message.textContent = 'Se houver uma conta para esse e-mail, o link será enviado. Confira também o spam.';
    } catch (error) {
      message.textContent = error.status === 429 ? 'Aguarde alguns minutos antes de solicitar outro link.' : 'Não foi possível enviar o link. Tente novamente ou fale com a secretaria.';
    } finally { button.disabled = false; }
  });

  resetForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = resetForm.querySelector('button');
    if (button.disabled || !accessToken) return;
    const fields = new FormData(resetForm);
    const password = fields.get('password');
    if (password !== fields.get('confirmation')) {
      message.textContent = 'As senhas precisam ser iguais.';
      return;
    }
    button.disabled = true;
    message.textContent = 'Salvando…';
    try {
      await call('/user', 'PUT', { password }, accessToken);
      try { await call('/logout?scope=global', 'POST', null, accessToken); } catch {}
      accessToken = null;
      resetForm.reset();
      resetForm.hidden = true;
      message.textContent = 'Senha alterada. Volte ao login e entre com a nova senha.';
    } catch (error) {
      const expired = error.status === 401 || error.status === 403;
      message.textContent = expired ? 'O link expirou. Solicite um novo.' : error.code === 'same_password' ? 'Escolha uma senha diferente da atual.' : 'Não foi possível alterar a senha. Use uma senha mais forte ou solicite um novo link.';
      if (expired) { accessToken = null; resetForm.reset(); resetForm.hidden = true; requestForm.hidden = false; }
    } finally { button.disabled = false; }
  });
})();