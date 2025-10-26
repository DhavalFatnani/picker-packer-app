import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, setAuth } from '@/services/api';

type UserRole = 'PickerPacker' | 'ASM' | 'StoreManager' | 'Guard';

interface RoleConfig {
  phone: string;
  label: string;
  description: string;
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  PickerPacker: {
    phone: '+15550000001',
    label: 'PickerPacker',
    description: 'Warehouse Worker',
  },
  ASM: {
    phone: '+15552000001',
    label: 'ASM',
    description: 'Assistant Store Manager',
  },
  StoreManager: {
    phone: '+15552500001',
    label: 'Store Manager',
    description: 'Store Manager',
  },
  Guard: {
    phone: '+15553000001',
    label: 'Guard',
    description: 'Security Guard',
  },
};

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('PickerPacker'); // Default to PickerPacker
  const [phone, setPhone] = useState(ROLE_CONFIGS.PickerPacker.phone);
  const [pin, setPin] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Set default phone based on role
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPhone(ROLE_CONFIGS[newRole].phone);
    setPin('123456'); // Reset PIN when changing role
    // Don't clear error when switching roles - keep it persistent
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Don't clear error here - keep it until we know if login succeeds
    setLoading(true);

    try {
      const response = await authApi.login({ phone, pin });
      
      // Handle wrapped API response
      const data = (response as any).success ? (response as any).data : response;
      
      if (data && data.token && data.user) {
        setAuth(data.token, data.user);
        setError(''); // Clear error on success
        // Redirect based on role
        const userRole = data.user.role;
        if (userRole === 'PickerPacker') {
          navigate('/picker-dashboard');
        } else if (userRole === 'ASM') {
          navigate('/asm-dashboard');
        } else if (userRole === 'Guard') {
          navigate('/guard-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError((response as any).error?.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number first');
      return;
    }

    setError('');
    setOtpLoading(true);

    try {
      const response = await authApi.requestOTP(phone);
      if (response.success) {
        alert(`OTP Sent!\n\nYour OTP is: ${response.data.otp}\n\n(In production, this would be sent via SMS)\n\nValid for 5 minutes.`);
        setShowOTPModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setOtpLoading(true);

    try {
      const response = await authApi.verifyOTPAndResetPin(phone, otp);
      if (response.success) {
        alert(`PIN Reset Successfully!\n\nYour new PIN is: ${response.data.pin}\n\n⚠️ Please save this PIN securely!`);
        setShowOTPModal(false);
        setOtp('');
        setPin(''); // Clear PIN field
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            PickerPacker Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the dashboard
          </p>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Login as
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['PickerPacker', 'ASM', 'StoreManager', 'Guard'] as UserRole[]).map((roleOption) => (
              <button
                key={roleOption}
                type="button"
                onClick={() => handleRoleChange(roleOption)}
                className={`px-3 py-3 rounded-lg border-2 transition-all ${
                  role === roleOption
                    ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{ROLE_CONFIGS[roleOption].label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {ROLE_CONFIGS[roleOption].description}
                </div>
              </button>
            ))}
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="phone" className="sr-only">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pin" className="sr-only">
                PIN
              </label>
              <div className="flex items-center relative">
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pr-32"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={otpLoading}
                  className="absolute right-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400"
                >
                  Forgot PIN?
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="inline-flex rounded-md text-red-400 hover:text-red-500"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="font-semibold text-blue-900 mb-1">Test Credentials (Auto-filled):</p>
            <div className="flex items-center justify-center space-x-4 text-blue-700">
              <span className="font-mono">{phone}</span>
              <span>•</span>
              <span className="font-mono">PIN: {pin}</span>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/admin-login"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Operations Admin? Login here →
            </a>
          </div>
        </form>

        {/* OTP Modal */}
        {showOTPModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enter OTP</h3>
              <p className="text-sm text-gray-600 mb-6">
                We've sent a 6-digit code to verify your phone number
              </p>
              
              <div className="mb-6">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOTPModal(false);
                    setOtp('');
                  }}
                  disabled={otpLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otp.length !== 6}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
