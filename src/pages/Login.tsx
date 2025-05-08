import { Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['doctor', 'patient']),
});

type LoginForm = z.infer<typeof loginSchema>;

// LoginFormData interface removed as it was unused

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'patient'
    }
  });

  // We still need watch() for the form to work properly, but we don't need the selectedRole variable
  watch('role');

  const onSubmit = async (data: LoginForm) => {
    try {
      logger.info('Login attempt', { email: data.email, role: data.role });
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: {email: string; password: string; role: string}) => 
        u.email === data.email && 
        u.password === data.password && 
        u.role === data.role
      );

      if (user) {
        logger.info('Login successful', { userId: user.id, role: user.role });
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast.success('Login successful!');
        navigate(data.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
      } else {
        logger.warn('Login failed - invalid credentials', { email: data.email });
        toast.error('Invalid credentials');
      }
    } catch (error) {
      logger.error('Login error', { error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">HealthAxis</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your HealthAxis account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...register('role')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                {...register('password')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}