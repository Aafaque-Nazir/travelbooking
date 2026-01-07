-- FIX SCRIPT: Unwrap double-nested JSON in boarding_points and dropping_points
-- This fixes data where name = '{"name": "actual_name", "price": 0}' instead of name = 'actual_name'

-- First, let's see the current state (run this SELECT first to verify the issue)
SELECT id, source_city, boarding_points FROM routes LIMIT 5;

-- Now fix the boarding_points column
UPDATE routes
SET boarding_points = (
    SELECT jsonb_agg(
        CASE 
            WHEN (elem->>'name')::text LIKE '{%'
            -- If name is a JSON string, parse it and extract the real name
            THEN jsonb_build_object(
                'name', (elem->>'name')::jsonb->>'name',
                'price', COALESCE(((elem->>'name')::jsonb->>'price')::numeric, (elem->>'price')::numeric, 0)
            )
            -- Otherwise keep as-is
            ELSE elem
        END
    )
    FROM jsonb_array_elements(boarding_points) AS elem
)
WHERE boarding_points IS NOT NULL 
  AND jsonb_typeof(boarding_points) = 'array'
  AND jsonb_array_length(boarding_points) > 0;

-- Fix the dropping_points column
UPDATE routes
SET dropping_points = (
    SELECT jsonb_agg(
        CASE 
            WHEN (elem->>'name')::text LIKE '{%'
            THEN jsonb_build_object(
                'name', (elem->>'name')::jsonb->>'name',
                'price', COALESCE(((elem->>'name')::jsonb->>'price')::numeric, (elem->>'price')::numeric, 0)
            )
            ELSE elem
        END
    )
    FROM jsonb_array_elements(dropping_points) AS elem
)
WHERE dropping_points IS NOT NULL 
  AND jsonb_typeof(dropping_points) = 'array'
  AND jsonb_array_length(dropping_points) > 0;

-- Verify the fix
SELECT id, source_city, boarding_points, dropping_points FROM routes LIMIT 5;
