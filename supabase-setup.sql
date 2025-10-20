-- Supabase setup script for RAG Assistant
-- Run this in your Supabase SQL editor to create the required table

-- Create the n8n_metadata table (matching your existing structure)
CREATE TABLE IF NOT EXISTS n8n_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  size TEXT,
  type TEXT,
  content TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the title field for faster searches
CREATE INDEX IF NOT EXISTS idx_n8n_metadata_title ON n8n_metadata(title);

-- Create an index on last_modified_date for sorting
CREATE INDEX IF NOT EXISTS idx_n8n_metadata_last_modified ON n8n_metadata(last_modified_date);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_n8n_metadata_updated_at 
    BEFORE UPDATE ON n8n_metadata 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO n8n_metadata (title, url, size, type, content, summary) VALUES
(
  'constitution.pdf',
  'https://example.com/documents/constitution.pdf',
  '404.2KB',
  'pdf',
  'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America...',
  'The Constitution of the United States establishes the fundamental framework of government, defining the structure, powers, and limits of federal authority while protecting individual rights through the Bill of Rights.'
),
(
  'Bill of Rights.pdf',
  'https://example.com/documents/bill-of-rights.pdf',
  '70.5KB',
  'pdf',
  'Amendment I: Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press...',
  'The Bill of Rights comprises the first ten amendments to the U.S. Constitution, guaranteeing essential civil liberties and individual rights against government overreach.'
),
(
  'Legal Framework.doc',
  'https://example.com/documents/legal-framework.doc',
  '1.2MB',
  'doc',
  'This document outlines the legal framework for constitutional interpretation and judicial review...',
  'Comprehensive guide to legal principles and constitutional interpretation methods used in judicial proceedings.'
);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE n8n_metadata ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow read access to all users (adjust as needed for your security requirements)
-- CREATE POLICY "Allow read access to n8n_metadata" ON n8n_metadata FOR SELECT USING (true);
