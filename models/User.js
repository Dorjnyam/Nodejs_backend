import db from '../db/index.js';  

const User = {
  create: async ({ username, email, password }) => {
    try {
      const result = await db.one(
        'INSERT INTO user_profile(username, email, password) VALUES($1, $2, $3) RETURNING id, username, email',
        [username, email, password]
      );
      return result;
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  },
  
  findByEmail: async (email) => {
    try {
      const user = await db.oneOrNone('SELECT * FROM user_profile WHERE email = $1', [email]);
      return user;
    } catch (error) {
      throw new Error('Error fetching user: ' + error.message);
    }
  }
};

export default User;
