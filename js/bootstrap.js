(async () => {
  const response = await fetch('js/app.js');
  if (!response.ok) throw new Error('Falha ao carregar js/app.js');
  document.querySelector('[data-dc-script]').textContent = await response.text();

  window.__resources = {
    'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js': 'js/vendor/react.js',
    'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js': 'js/vendor/react-dom.js',
  };

  const runtime = document.createElement('script');
  runtime.src = 'js/vendor/design-runtime.js';
  runtime.onerror = () => showError(new Error('Falha ao carregar o runtime'));
  document.head.appendChild(runtime);
})().catch(showError);

function showError(error) {
  console.error(error);
  const message = document.createElement('p');
  message.textContent = 'Não foi possível abrir o protótipo. Acesse a página por um servidor HTTP ou pelo GitHub Pages.';
  document.body.replaceChildren(message);
}
