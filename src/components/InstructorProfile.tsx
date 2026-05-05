import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, ShieldCheck 
} from 'lucide-react';
import { Course, UserData } from '../types';
import { getUserData } from '../lib/githubDatabase';

export function InstructorProfileView({ instructorEmail, courses, onSelectCourse, onBack }: { instructorEmail: string, courses: Course[], onSelectCourse: (c: Course) => void, onBack: () => void }) {
  const [instructor, setInstructor] = useState<UserData | null>(null);
  const instructorCourses = courses.filter(c => c.instructorEmail === instructorEmail);

  useEffect(() => {
    loadInstructor();
  }, [instructorEmail]);

  const loadInstructor = async () => {
    const data = await getUserData(instructorEmail);
    setInstructor(data);
  };

  if (!instructor) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-black">{instructor.name} এর প্রোফাইল</h2>
      {/* Profile details */}
    </div>
  );
}
