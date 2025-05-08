import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { SPECIALIZATIONS } from '../types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['doctor', 'patient']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  bloodGroup: z.string().optional(),
  hospitalName: z.string().optional(),
  doctorCode: z.string().optional(),
  specialization: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  (data) => {
    if (data.role === 'doctor') {
      return data.doctorCode === '123';
    }
    return true;
  },
  {
    message: "Invalid doctor authentication code",
    path: ["doctorCode"],
  }
).refine(
  (data) => {
    if (data.role === 'doctor') {
      return !!data.specialization;
    }
    return true;
  },
  {
    message: "Specialization is required for doctors",
    path: ["specialization"],
  }
);

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { register, watch, setValue, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'patient'
    }
  });

  const selectedRole = watch('role');
  
  const filteredSpecializations = SPECIALIZATIONS.filter(spec =>
    spec.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: RegisterForm) => {
    try {
      // Check if email already exists
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const emailExists = users.some((user: { email: string }) => user.email === data.email);
      
      if (emailExists) {
        toast.error('Email already exists');
        return;
      }

      const userData = {
        ...data,
        id: crypto.randomUUID(),
        availableTimes: data.role === 'doctor' ? [] : undefined,
        bloodGroup: data.role === 'patient' ? data.bloodGroup : undefined,
        hospitalName: data.role === 'doctor' ? data.hospitalName : undefined,
      };
      
      // Save user data to localStorage
      users.push(userData);
      localStorage.setItem('users', JSON.stringify(users));
      
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (_error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleSpecializationSelect = (specialization: string) => {
    setValue('specialization', specialization);
    setSearchTerm(specialization);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Stethoscope className="h-12 w-12 text-blue-600 mb-2" />
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600">Join our healthcare platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              {...register('dateOfBirth')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              {...register('gender')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              {...register('role')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          {selectedRole === 'patient' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
              <select
                {...register('bloodGroup')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && (
                <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
              )}
            </div>
          )}

          {selectedRole === 'doctor' && (
            <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Currently Working In</label>
                  <input
                    type="text"
                    {...register('hospitalName')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter hospital name"
                  />
                  {errors.hospitalName && (
                    <p className="mt-1 text-sm text-red-600">{errors.hospitalName.message}</p>
                  )}
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor Authentication Code</label>
                <input
                  type="text"
                  {...register('doctorCode')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter authentication code"
                />
                {errors.doctorCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.doctorCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Search specialization..."
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {searchTerm && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredSpecializations.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleSpecializationSelect(spec)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="hidden" {...register('specialization')} value={searchTerm} />
                {errors.specialization && (
                  <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Account
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}