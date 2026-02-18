const bcrypt = require('bcrypt');

const hash = '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y';
const password = 'qwerty';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('❌ Erreur:', err);
    return;
  }

  if (result) {
    console.log('✅ Le mot de passe "qwerty" fonctionne correctement!');
  } else {
    console.log('❌ Le mot de passe "qwerty" ne correspond PAS au hash');
  }
});
