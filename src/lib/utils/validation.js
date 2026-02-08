import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers')
});

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long'),
  context: z.object({
    subjectId: z.string().optional(),
    branchId: z.string().optional(),
    semester: z.number().min(1).max(8).optional(),
    mode: z.enum(['general', 'subject-specific']).default('general')
  }).optional()
});

export const documentUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['book', 'notes', 'pyq', 'syllabus', 'reference']),
  subjectId: z.string(),
  branchId: z.string(),
  semester: z.number().min(1).max(8),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Invalid academic year format'),
  metadata: z.object({
    author: z.string().optional(),
    publisher: z.string().optional(),
    edition: z.string().optional(),
    year: z.string().optional()
  }).optional()
});