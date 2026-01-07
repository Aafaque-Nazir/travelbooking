-- Check routes table structure and data sample
SELECT 
    id, 
    source_city, 
    destination_city, 
    jsonb_typeof(boarding_points) as bp_type,
    jsonb_typeof(dropping_points) as dp_type,
    boarding_points, 
    dropping_points 
FROM routes 
LIMIT 3;
