-- Insert Dummy Bus
INSERT INTO public.buses (name, type, capacity, number_plate)
VALUES 
('Mumbai superfast', 'Volvo AC Multi-Axle', 40, 'MH-01-AB-1234'),
('Pune Express', 'Scania AC Sleeper', 30, 'MH-12-CD-5678')
ON CONFLICT DO NOTHING;

-- Insert Dummy Routes
INSERT INTO public.routes (source, destination, distance, duration)
VALUES 
('Mumbai', 'Pune', '150 km', '3h 30m'),
('Mumbai', 'Goa', '600 km', '12h 00m')
ON CONFLICT DO NOTHING;

-- Insert Dummy Trips (Today and Tomorrow)
INSERT INTO public.trips (bus_id, route_id, departure_time, arrival_time, price, status)
SELECT 
    b.id, 
    r.id, 
    NOW() + INTERVAL '2 hours', -- Departs in 2 hours
    NOW() + INTERVAL '5 hours', 
    1200, 
    'scheduled'
FROM public.buses b, public.routes r
WHERE b.name = 'Mumbai superfast' AND r.source = 'Mumbai' AND r.destination = 'Pune'
LIMIT 1;

INSERT INTO public.trips (bus_id, route_id, departure_time, arrival_time, price, status)
SELECT 
    b.id, 
    r.id, 
    NOW() + INTERVAL '1 day 5 hours', -- Departs tomorrow
    NOW() + INTERVAL '1 day 17 hours', 
    2500, 
    'scheduled'
FROM public.buses b, public.routes r
WHERE b.name = 'Pune Express' AND r.destination = 'Goa'
LIMIT 1;
