document.addEventListener('change', event => {
  const toggle = event.target;
  if (!(toggle instanceof HTMLInputElement) || !toggle.hasAttribute('data-password-toggle')) return;
  const form = toggle.closest('form');
  if (!form) return;
  for (const field of form.querySelectorAll('input[data-password-field]')) {
    field.type = toggle.checked ? 'text' : 'password';
  }
});
