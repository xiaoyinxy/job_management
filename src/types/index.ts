export interface User {
  id: string;
  email: string;
  password: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  company: string;
  position: string;
  city: string;
  salary: string;
  status: 'Wishlist' | 'Applied' | 'Testing' | 'Interviewing' | 'Offer' | 'Closed';
  deadline: string | null;
  resume_version: string | null;
  notes: string | null;
  interviewer: string | null;
  interview_questions: string | null;
  reflection: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}
