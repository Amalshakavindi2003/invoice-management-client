import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Full name is required');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    try {
      const url = isRegister
        ? 'http://localhost:8080/api/auth/register'
        : 'http://localhost:8080/api/auth/login';

      const body = isRegister
        ? { fullName, email, password }
        : { email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(
          data.error ||
          data.message ||
          `Request failed (${res.status}). Please try again.`
        );
        return;
      }

      localStorage.setItem('ei_token', data.token);
      localStorage.setItem('ei_user', JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        role: data.role
      }));

      if (onLoginSuccess) onLoginSuccess(data);
    } catch (err) {
      setError(
        'Cannot connect to server. ' +
        'Make sure Spring Boot is running on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px'
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: '10px',
            background: '#6d28d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            fontWeight: '800'
          }}>E</div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              EasyInvoice
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9ca3af'
            }}>
              Invoice Management System
            </div>
          </div>
        </div>

        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 6px'
        }}>
          {isRegister ? 'Create account' : 'Welcome back'}
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: '0 0 24px'
        }}>
          {isRegister
            ? 'Set up your admin account'
            : 'Sign in to your admin dashboard'}
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {isRegister && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              display: 'block',
              marginBottom: '6px'
            }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            display: 'block',
            marginBottom: '6px'
          }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{
              width: '100%',
              padding: '11px 14px',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            display: 'block',
            marginBottom: '6px'
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                width: '100%',
                padding: '11px 44px 11px 14px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#9ca3af'
              }}
            >
              {showPass ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>

        {isRegister && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              display: 'block',
              marginBottom: '6px'
            }}>
              Confirm Password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#a78bfa' : '#6d28d9',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '13px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px'
          }}
        >
          {loading
            ? 'Please wait...'
            : isRegister ? 'Create Account' : 'Sign In'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          {isRegister
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6d28d9',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {isRegister ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #f3f4f6',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Are you a customer?{' '}
          <a
            href="/my-invoices"
            style={{
              color: '#6d28d9',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            View your invoices
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;