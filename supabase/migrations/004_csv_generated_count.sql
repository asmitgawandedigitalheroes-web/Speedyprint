-- Add generated_count column to csv_jobs for tracking how many PDFs were successfully created
ALTER TABLE csv_jobs ADD COLUMN IF NOT EXISTS generated_count INT DEFAULT 0;
