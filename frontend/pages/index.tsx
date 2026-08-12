import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type User = { username: string; role: 'ADMIN' | 'STUDENT' };

type AttendanceItem = { id: number; status: string; date: string; student?: { username: string } };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [message, setMessage] = useState('');
  const [maintenance, setMaintenance] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored) {
      setToken(stored);
      fetchProfile(stored);
    }
  }, []);

  const headers = { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' };

  const fetchProfile = async (jwt: string) => {
    const res = await fetch(`${apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      if (data.user.role === 'ADMIN') await loadMaintenance(jwt);
      if (data.user.role === 'ADMIN') await loadAttendance(jwt);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser({ username: data.username, role: data.role });
      setMessage('Logged in');
      if (data.role === 'ADMIN') await loadMaintenance(data.token);
      return;
    }
    setMessage(data.message);
  };

  const loadAttendance = async (jwt: string) => {
    const res = await fetch(`${apiUrl}/api/attendance`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (res.ok) {
      const data = await res.json();
      setAttendance(data.attendance);
    }
  };

  const loadMaintenance = async (jwt: string) => {
    const res = await fetch(`${apiUrl}/api/settings/maintenance`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (res.ok) {
      const data = await res.json();
      setMaintenance(data.enabled ? 'Offline' : 'Online');
    }
  };

  const toggleMaintenance = async () => {
    const res = await fetch(`${apiUrl}/api/settings/maintenance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled: maintenance === 'Online' }),
    });
    if (res.ok) {
      const data = await res.json();
      setMaintenance(data.enabled ? 'Offline' : 'Online');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken('');
    setUser(null);
    setAttendance([]);
  };

  return (
    <main>
      <h1>Attendance Platform</h1>
      {user ? (
        <section>
          <p>Welcome, {user.username} ({user.role})</p>
          <button onClick={logout}>Logout</button>
          {user.role === 'ADMIN' && (
            <div>
              <p>Site status: {maintenance}</p>
              <button onClick={toggleMaintenance}>Toggle Maintenance</button>
              <h2>Attendance</h2>
              <ul>
                {attendance.map((item) => (
                  <li key={item.id}>{item.student?.username || 'You'} - {item.status} on {new Date(item.date).toDateString()}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section>
          <p>{message}</p>
          <button onClick={() => login('admin', 'admin123')}>Login as Admin</button>
          <button onClick={() => login('student', 'student123')}>Login as Student</button>
        </section>
      )}
    </main>
  );
}
