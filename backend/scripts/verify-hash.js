const bcrypt = require('bcrypt');

const hash = '$2b$10$rKwLEZVXJGj3HJmF8H9fLOrYNjlvGzJ0tXvFZqN8fPJvKhBLCGXqW';
const password = 'qwerty';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Erreur:', err);
    return;
  }
  console.log('Hash actuel valide pour "qwerty":', result);

  // Générer un nouveau hash pour être sûr
  bcrypt.hash(password, 10, (err, newHash) => {
    if (err) {
      console.error('Erreur:', err);
      return;
    }
    console.log('Nouveau hash pour "qwerty":', newHash);
  });
});
