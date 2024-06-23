import React from 'react';

const login = () => {
  return (
    <form>
      <label> Email </label>
      <input type="email" id="email" required />

      <label> Password</label>
      <input type="password" id="password" required />

      <button type="submit">Login</button>
    </form>
  );
};

export default login;
