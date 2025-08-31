-- Step 1: Drop all existing policies first
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on jobs table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'jobs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop all policies on question_bank table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'question_bank') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop all policies on job_questions table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'job_questions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop all policies on invites table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'invites') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop all policies on sessions table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'sessions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop all policies on responses table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'responses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop all policies on audit_log table
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'audit_log') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;
