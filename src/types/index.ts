export interface User {
  id: string;
  email: string;
  name: string;
  role: 'WORKER' | 'CONTRACTOR' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  user: User;
  phoneNumber?: string;
  location?: string;
  skills: string[];
  certifications: Certification[];
  experience: number; // years
  profileCompleted: boolean;
  totalPoints: number;
  currentLevel: number;
  currentStreak: number;
  lastCheckIn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  verified: boolean;
}

export interface ProductivityEntry {
  id: string;
  workerId: string;
  date: Date;
  tasksCompleted: number;
  hoursWorked: number;
  supervisorApproved: boolean;
  supervisorId?: string;
  points: number;
  notes?: string;
  photoProof?: string[];
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: 'PRODUCTIVITY' | 'CONSISTENCY' | 'SKILL' | 'TEAMWORK';
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'GIFT_CARD' | 'MERCHANDISE' | 'CASH' | 'TRAINING' | 'TOOLS';
  available: boolean;
  imageUrl?: string;
}