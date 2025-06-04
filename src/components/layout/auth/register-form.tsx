'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { Loader2, CheckCircle, User, Mail, Eye, EyeOff } from 'lucide-react';

// Hooks and utilities
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
import type { RegisterRequest, UserProfile } from '@/types/auth';

// Registration schema with nested profile validation
const createRegistrationSchema = (loginAttribute: string) => {
  const baseSchema = {
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  };

  // Add username field if system uses username for login
  if (loginAttribute === 'username') {
    return z.object({
      ...baseSchema,
      username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be no more than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    }).refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }

  return z.object(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
};

type RegistrationFormData = z.infer<ReturnType<typeof createRegistrationSchema>>;

interface RegisterFormProps {
  className?: string;
  onComplete?: () => void;
}

export function RegisterForm({ className, onComplete }: RegisterFormProps) {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const { data: systemConfig, isLoading: configLoading } = useSystemConfig();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Determine login attribute from system configuration
  const loginAttribute = systemConfig?.authentication?.login_attribute || 'email';
  const allowRegistration = systemConfig?.authentication?.allow_open_registration ?? false;

  // Create schema based on system configuration
  const registrationSchema = createRegistrationSchema(loginAttribute);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      ...(loginAttribute === 'username' && { username: '' }),
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Handle form submission
  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setRegistrationError(null);

      // Prepare registration request based on system configuration
      const registrationRequest: RegisterRequest = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(loginAttribute === 'username' && { username: data.username }),
      };

      // Attempt registration
      await register(registrationRequest);
      
      // Mark as successfully registered
      setIsRegistered(true);
      
      // Call completion callback if provided
      onComplete?.();

      // Redirect to login page after brief success display
      setTimeout(() => {
        router.push('/login?message=registration-complete');
      }, 2000);

    } catch (error) {
      console.error('Registration failed:', error);
      
      // Set user-friendly error message
      if (error instanceof Error) {
        setRegistrationError(error.message);
      } else {
        setRegistrationError('Registration failed. Please try again.');
      }

      // Clear form errors and allow retry
      form.clearErrors();
    }
  };

  // Show loading state while system config loads
  if (configLoading) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading registration form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if registration is not allowed
  if (!allowRegistration) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">Registration Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Self-registration is currently disabled. Please contact your administrator for account creation.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Return to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show registration success state
  if (isRegistered) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold flex items-center justify-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Registration Complete!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your account has been successfully created. You can now sign in with your credentials.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Redirecting to login...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Create Account</CardTitle>
        <p className="text-center text-muted-foreground">
          Enter your details to create a new account
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Display registration errors */}
            {registrationError && (
              <Alert variant="destructive">
                <AlertDescription>{registrationError}</AlertDescription>
              </Alert>
            )}

            {/* Profile Details Group */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          disabled={authLoading}
                          autoComplete="given-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          disabled={authLoading}
                          autoComplete="family-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Username (if required by system) */}
              {loginAttribute === 'username' && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="Enter username"
                            disabled={authLoading}
                            autoComplete="username"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          disabled={authLoading}
                          autoComplete="email"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a secure password"
                          disabled={authLoading}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={authLoading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          disabled={authLoading}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={authLoading}
                          aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>At least 8 characters long</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={authLoading}
              aria-label="Create your account"
            >
              {authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link 
                href="/login" 
                className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;