import { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const submit = async () => {
    await axios.post('/api/v1/auth/forgot-password', { email });
    alert('Reset link sent to email');
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <button onClick={submit}>Send Reset Link</button>
    </div>
  );
}
