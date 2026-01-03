import { useParams } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');

  const submit = async () => {
    await axios.post(`/api/v1/auth/reset-password/${token}`, { password });
    alert('Password reset successful');
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="New Password"
      />
      <button onClick={submit}>Reset</button>
    </div>
  );
}
