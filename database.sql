-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  salary VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'Wishlist',
  deadline DATE,
  resume_version VARCHAR(255),
  notes TEXT,
  interviewer VARCHAR(255),
  interview_questions TEXT,
  reflection TEXT,
  rating INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for tasks table
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Create index on status for tasks table
CREATE INDEX idx_tasks_status ON tasks(status);
