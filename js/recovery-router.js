(() => {
 const hash = new URLSearchParams(location.hash.slice(1));
 if (hash.get('type') === 'recovery' || hash.has('error_code')) {
   location.replace('/redefinir-senha.html' + location.hash);
 }
})();