-- =====================================================================
-- ERP_Database – Bulk Insert: 100 Products + Inventory rows (idempotent!)
-- Run this directly in pgAdmin / psql against the ERP_Database.
--
-- GUARANTEES:
--   * Re-running this file is SAFE — no duplicate products/inventory rows
--   * Every PRD-0100 … PRD-0199 code eventually gets BOTH a product row
--     AND a matching inventory row, even if only one existed before
--   * Stock levels are deterministic (derived from the numeric suffix of
--     the product_code, NOT the auto id) so a rerun does not scramble
--   * CHECK (reserved + damaged <= physical) always satisfied
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Step 1 — Upsert the 100 product definitions.
--          If a code already exists -> skip (no overwrite).
-- ---------------------------------------------------------------------
INSERT INTO products (product_code, product_name, category, unit, base_price)
VALUES
  ('PRD-0100','Deep Groove Ball Bearing 608','Bearings','piece',125.00),
  ('PRD-0101','Deep Groove Ball Bearing 6201','Bearings','piece',240.00),
  ('PRD-0102','Deep Groove Ball Bearing 6205','Bearings','piece',485.00),
  ('PRD-0103','Angular Contact Bearing 7205','Bearings','piece',1320.00),
  ('PRD-0104','Tapered Roller Bearing 30205','Bearings','piece',890.00),
  ('PRD-0105','Spherical Roller Bearing 22210','Bearings','piece',2650.00),
  ('PRD-0106','Thrust Ball Bearing 51105','Bearings','piece',310.00),
  ('PRD-0107','Pillow Block Bearing UCP205','Bearings','piece',760.00),
  ('PRD-0108','Flanged Bearing UCFL204','Bearings','piece',640.00),
  ('PRD-0109','Linear Bearing LM12UU','Bearings','piece',185.00),

  ('PRD-0110','Ball Valve 1/2" Brass','Valves','piece',285.00),
  ('PRD-0111','Ball Valve 1" SS304','Valves','piece',1280.00),
  ('PRD-0112','Gate Valve 2" Cast Iron','Valves','piece',2450.00),
  ('PRD-0113','Globe Valve 1" Flanged','Valves','piece',1980.00),
  ('PRD-0114','Check Valve (NRV) 3/4"','Valves','piece',540.00),
  ('PRD-0115','Butterfly Valve 4"','Valves','piece',3950.00),
  ('PRD-0116','Diaphragm Valve 1.5"','Valves','piece',1690.00),
  ('PRD-0117','Pressure Relief Valve 10 bar','Valves','piece',2250.00),
  ('PRD-0118','Solenoid Valve 24V DC','Valves','piece',3850.00),
  ('PRD-0119','Control Valve Pneumatic','Valves','piece',12500.00),

  ('PRD-0120','Hex Bolt M6x20 – ISO 4017','Fasteners','box',120.00),
  ('PRD-0121','Hex Bolt M8x30 – ISO 4017','Fasteners','box',155.00),
  ('PRD-0122','Hex Bolt M10x40 – ISO 4017','Fasteners','box',210.00),
  ('PRD-0123','Hex Bolt M12x50 – ISO 4017','Fasteners','box',285.00),
  ('PRD-0124','Hex Bolt M16x70 – ISO 4017','Fasteners','box',520.00),
  ('PRD-0125','Hex Nut M6 (100 pcs)','Fasteners','pack',65.00),
  ('PRD-0126','Hex Nut M10 (100 pcs)','Fasteners','pack',145.00),
  ('PRD-0127','Flat Washer M8 (200 pcs)','Fasteners','pack',95.00),
  ('PRD-0128','Spring Washer M12 (100 pcs)','Fasteners','pack',180.00),
  ('PRD-0129','Socket Head Cap Screw M6x25','Fasteners','box',275.00),

  ('PRD-0130','Induction Motor 0.5 HP 3PH','Motors','piece',8950.00),
  ('PRD-0131','Induction Motor 1 HP 3PH','Motors','piece',11800.00),
  ('PRD-0132','Induction Motor 2 HP 3PH','Motors','piece',18500.00),
  ('PRD-0133','Induction Motor 5 HP 3PH','Motors','piece',28750.00),
  ('PRD-0134','Induction Motor 10 HP 3PH','Motors','piece',54500.00),
  ('PRD-0135','Single Phase Motor 0.5 HP','Motors','piece',7600.00),
  ('PRD-0136','Single Phase Motor 1 HP','Motors','piece',10200.00),
  ('PRD-0137','Brake Motor 3 HP 3PH','Motors','piece',32400.00),
  ('PRD-0138','Gear Motor 1/20 Ratio 0.5HP','Motors','piece',22900.00),
  ('PRD-0139','Servo Motor 1kW with Encoder','Motors','piece',68500.00),

  ('PRD-0140','Hydraulic Hose 1/2" 2SN','Hydraulics','meter',280.00),
  ('PRD-0141','Hydraulic Hose 3/4" 2SN','Hydraulics','meter',420.00),
  ('PRD-0142','Hydraulic Cylinder 40x200mm','Hydraulics','piece',9850.00),
  ('PRD-0143','Hydraulic Cylinder 63x300mm','Hydraulics','piece',16400.00),
  ('PRD-0144','Hydraulic Pump 10 cc/rev Gear','Hydraulics','piece',12500.00),
  ('PRD-0145','Hydraulic Pump 25 cc/rev Piston','Hydraulics','piece',32400.00),
  ('PRD-0146','Directional Control Valve 4/3','Hydraulics','piece',8650.00),
  ('PRD-0147','Pressure Relief Valve DBDS','Hydraulics','piece',3850.00),
  ('PRD-0148','Hydraulic Coupling 1/2" BSP','Hydraulics','piece',620.00),
  ('PRD-0149','Hydraulic Oil Filter 10µ','Hydraulics','piece',1850.00),

  ('PRD-0150','Timing Belt HTD 5M 500','Power Transmission','piece',380.00),
  ('PRD-0151','V-Belt A-48','Power Transmission','piece',180.00),
  ('PRD-0152','V-Belt B-65','Power Transmission','piece',295.00),
  ('PRD-0153','Roller Chain 08B-1 (10ft)','Power Transmission','piece',1580.00),
  ('PRD-0154','Roller Chain Sprocket 18T','Power Transmission','piece',490.00),
  ('PRD-0155','Timing Pulley 20T 5M','Power Transmission','piece',520.00),
  ('PRD-0156','Flexible Coupling Jaw Type L-075','Power Transmission','piece',890.00),
  ('PRD-0157','Disc Coupling 45mm','Power Transmission','piece',3650.00),
  ('PRD-0158','Bevel Gear Set 1:1 20T','Power Transmission','piece',2280.00),
  ('PRD-0159','Worm Gear Reducer 1:30','Power Transmission','piece',18900.00),

  ('PRD-0160','Ball Screw SFU1605 500mm','Linear Motion','piece',3250.00),
  ('PRD-0161','Ball Screw SFU2005 1000mm','Linear Motion','piece',6750.00),
  ('PRD-0162','Linear Guide HGH15 500mm','Linear Motion','piece',4150.00),
  ('PRD-0163','Linear Guide HGH20 1000mm','Linear Motion','piece',8900.00),
  ('PRD-0164','Lead Screw T12x300mm + Nut','Linear Motion','piece',850.00),
  ('PRD-0165','Linear Shaft 12mm x 500mm','Linear Motion','piece',340.00),
  ('PRD-0166','Shaft Support SK12','Linear Motion','piece',210.00),
  ('PRD-0167','Ball Screw Nut Housing','Linear Motion','piece',310.00),
  ('PRD-0168','Coupling for 8mm-6.35mm','Linear Motion','piece',180.00),
  ('PRD-0169','Linear Motion Module 200mm Travel','Linear Motion','piece',15900.00),

  ('PRD-0170','Proximity Sensor Inductive M18','Sensors','piece',980.00),
  ('PRD-0171','Photoelectric Sensor Retroreflective','Sensors','piece',1650.00),
  ('PRD-0172','Limit Switch Roller Plunger','Sensors','piece',420.00),
  ('PRD-0173','Pressure Transmitter 0-10 bar','Sensors','piece',5400.00),
  ('PRD-0174','Temperature Sensor PT100','Sensors','piece',780.00),
  ('PRD-0175','Ultrasonic Sensor 200-2000mm','Sensors','piece',6800.00),
  ('PRD-0176','Encoder Incremental 1000 PPR','Sensors','piece',3950.00),
  ('PRD-0177','Load Cell 50kg S-Type','Sensors','piece',4200.00),
  ('PRD-0178','Flow Sensor Turbine 1" NPT','Sensors','piece',7600.00),
  ('PRD-0179','Laser Distance Sensor 0.1-10m','Sensors','piece',18500.00),

  ('PRD-0180','PLC 16DI/16DO Relay Output','Electrical','piece',12900.00),
  ('PRD-0181','PLC 8AI / 4AO Module','Electrical','piece',9400.00),
  ('PRD-0182','VFD 1HP V/F Control','Electrical','piece',8750.00),
  ('PRD-0183','VFD 5HP Vector Control','Electrical','piece',24800.00),
  ('PRD-0184','SMC Junction Box 24-Way','Electrical','piece',320.00),
  ('PRD-0185','MPCB 10A Motor Protection','Electrical','piece',890.00),
  ('PRD-0186','Contactor 3P 25A 230V Coil','Electrical','piece',1150.00),
  ('PRD-0187','Contactor 3P 50A 230V Coil','Electrical','piece',2150.00),
  ('PRD-0188','Overload Relay 9-14A','Electrical','piece',850.00),
  ('PRD-0189','24V DC Power Supply 5A','Electrical','piece',2850.00),

  ('PRD-0190','SS Pipe 304 1" Sch40 (6m)','Raw Material','length',1280.00),
  ('PRD-0191','SS Pipe 304 2" Sch40 (6m)','Raw Material','length',4550.00),
  ('PRD-0192','MS Angle 50x50x5mm (6m)','Raw Material','length',890.00),
  ('PRD-0193','MS Channel 100x50 (6m)','Raw Material','length',1450.00),
  ('PRD-0194','MS Flat Bar 40x6mm (6m)','Raw Material','length',420.00),
  ('PRD-0195','Aluminium Sheet 2mm 4x8ft','Raw Material','sheet',4250.00),
  ('PRD-0196','Steel Sheet 1.2mm 4x8ft CR','Raw Material','sheet',2880.00),
  ('PRD-0197','Copper Wire 2.5sqmm (90m)','Raw Material','roll',3150.00),
  ('PRD-0198','Rubber Sheet 10mm (1x1m)','Raw Material','sheet',950.00),
  ('PRD-0199','GI Wire 16 Gauge (50kg)','Raw Material','bundle',4650.00)
ON CONFLICT (product_code) DO NOTHING;

-- ---------------------------------------------------------------------
-- Step 2 — Create inventory rows for ANY product with a PRD-01xx code
--          (PRD-0100 … PRD-0199) that still lacks one.
--
--          Stock is derived from RIGHT(product_code, 2) % 11 — which is
--          the numeric suffix modulo 11, so it:
--            * does NOT depend on auto-increment id
--            * is stable across reruns (same product -> same stock)
--            * gives 9 different stock tiers including true low-stock
--              (≤ 20 available) codes for the dashboard low-stock widget
-- ---------------------------------------------------------------------
INSERT INTO inventory (product_id, physical_qty, reserved_qty, damaged_qty)
SELECT
  p.id                                                                 AS product_id,
  CASE b.bucket
    WHEN 0 THEN 12    -- very low
    WHEN 1 THEN 5     -- very low  -> available 4 (Out/Low)
    WHEN 2 THEN 18    -- low
    WHEN 3 THEN 150   -- medium
    WHEN 4 THEN 320   -- high
    WHEN 5 THEN 40    -- normal
    WHEN 6 THEN 250   -- high
    WHEN 7 THEN 90    -- normal
    WHEN 8 THEN 8     -- low
    WHEN 9 THEN 120   -- normal
    ELSE        200   -- high
  END                                                                  AS physical_qty,
  CASE b.bucket
    WHEN 0 THEN 0
    WHEN 1 THEN 0
    WHEN 2 THEN 2
    WHEN 3 THEN 15
    WHEN 4 THEN 30
    WHEN 5 THEN 5
    WHEN 6 THEN 20
    WHEN 7 THEN 8
    WHEN 8 THEN 0
    WHEN 9 THEN 10
    ELSE        15
  END                                                                  AS reserved_qty,
  CASE b.bucket
    WHEN 0 THEN 2
    WHEN 1 THEN 1
    WHEN 2 THEN 1
    WHEN 3 THEN 4
    WHEN 4 THEN 6
    WHEN 5 THEN 1
    WHEN 6 THEN 5
    WHEN 7 THEN 2
    WHEN 8 THEN 0
    WHEN 9 THEN 3
    ELSE        3
  END                                                                  AS damaged_qty
FROM products p
CROSS JOIN LATERAL (
  SELECT CAST(RIGHT(p.product_code, 2) AS INTEGER) % 11
) AS b(bucket)
WHERE p.product_code ~ '^PRD-01\d{2}$'           -- codes PRD-0100 … PRD-0199 only
  AND NOT EXISTS (
        SELECT 1 FROM inventory i WHERE i.product_id = p.id
      );

COMMIT;

-- =====================================================================
-- Quick verification (uncomment to run after the script)
-- =====================================================================
-- SELECT p.product_code, p.product_name,
--        i.physical_qty, i.reserved_qty, i.damaged_qty,
--        (i.physical_qty - i.reserved_qty - i.damaged_qty) AS available
-- FROM products p
-- JOIN inventory i ON i.product_id = p.id
-- WHERE p.product_code ~ '^PRD-01\d{2}$'
-- ORDER BY p.product_code;
--
-- SELECT COUNT(*) AS prd01xx_products
-- FROM   products
-- WHERE  product_code ~ '^PRD-01\d{2}$';
--
-- SELECT COUNT(*) AS prd01xx_with_inventory
-- FROM   products p
-- JOIN   inventory i ON i.product_id = p.id
-- WHERE  p.product_code ~ '^PRD-01\d{2}$';
