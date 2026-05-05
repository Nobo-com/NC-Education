export type UserRole = 'student' | 'instructor' | 'admin';

export interface Mentor {
  id: string;
  name: string;
  education: string;
  photoUrl: string;
  subject?: string;
  experience?: string;
}

export interface UserData {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  role?: string;
  lastProfileUpdate?: string;
  enrolled: string[];
  enrollments?: Enrollment[];
  selectedCourseId?: string;
  isInstructorVerified?: boolean;
  isBanned?: boolean;
  instructorDetails?: {
    institutionName: string;
    tradeLicense?: string;
    officeAddress: string;
    nomineePhoto?: string;
    nidPhoto?: string;
    website?: string;
    contactNumber: string;
  };
  institution?: {
    name: string;
    logo?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  mentors?: Mentor[];
}

export interface Enrollment {
  courseId: string;
  type: 'full' | 'quarter';
  quarterId?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  instructorEmail: string;
  instructorAvatar?: string;
  thumbnail: string;
  price: string | number;
  category: string;
  rating?: number;
  students?: number;
  useQuarters?: boolean;
  quarters?: Quarter[];
  subjects?: Subject[];
  chapters?: Chapter[];
  archiveLink?: string;
  createdAt?: string;
  updatedAt?: string;
  repoName?: string;
  startDate?: string;
  endDate?: string;
}

export interface Quarter {
  id: string;
  title: string;
  price: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'locked';
  subjects?: Subject[];
  startDate?: string;
  endDate?: string;
}

export interface ScheduledClass {
  id: string;
  courseId: string;
  subjectName: string;
  chapterName: string;
  topic: string;
  date: string;
  time: string;
  meetingUrl?: string;
  recordedUrl?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'canceled';
  instructorName?: string;
  mentorId?: string;
  mentorName?: string;
  mentorPhoto?: string;
}

export interface Subject {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  modules: Module[];
}

export interface Module {
  id: string;
  title: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: string;
  isLocked?: boolean;
}

export interface InstructorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  institutionName: string;
  tradeLicense?: string;
  officeAddress: string;
  contactNumber: string;
  website?: string;
  nomineePhotoUrl: string;
  nidPhotoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  agreedToTerms: boolean;
}
