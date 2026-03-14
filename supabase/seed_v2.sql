-- V2 Seed Data: Blog Posts & Testimonials
-- Run this in Supabase SQL Editor after migration 002

-- Blog Posts
INSERT INTO blog_posts (title, slug, excerpt, content, author, published, published_at) VALUES
(
  'The Complete Guide to Custom Stickers in South Africa',
  'complete-guide-custom-stickers-south-africa',
  'Everything you need to know about ordering custom stickers, from choosing the right material to designing your artwork.',
  '<h2>Why Custom Stickers?</h2><p>Custom stickers are one of the most versatile marketing tools available. Whether you''re branding products, promoting events, or adding personality to your packaging, stickers deliver high impact at a low cost.</p><h2>Choosing the Right Material</h2><p>The material you choose depends on where your stickers will be used. For indoor applications, standard white vinyl works perfectly. For outdoor use, consider our UV-resistant clear vinyl or reflective options.</p><h2>Design Tips</h2><p>Keep your design simple and bold. Use high-contrast colors and ensure text is readable at the size you''re printing. Always provide artwork at 300 DPI for the best results.</p><h2>Ordering Process</h2><p>At SpeedyPrint, ordering is simple: choose your size, select your material, upload your artwork, and we''ll handle the rest. Most orders ship within 3-5 business days.</p>',
  'SpeedyPrint Team',
  true,
  now() - interval '14 days'
),
(
  'How to Choose the Right Vinyl for Your Stickers',
  'how-to-choose-right-vinyl-stickers',
  'Not all vinyl is created equal. Learn about the different types and when to use each one.',
  '<h2>White Vinyl</h2><p>The most popular choice for custom stickers. White vinyl provides a solid, opaque background that makes colors pop. Ideal for logos, product labels, and general-purpose stickers.</p><h2>Clear Vinyl</h2><p>Perfect for a premium, no-background look. Clear vinyl lets your design appear to float on the surface. Great for window applications and glass containers.</p><h2>Chrome/Metallic</h2><p>Add a premium touch with our metallic vinyl options. The reflective surface catches light and creates an eye-catching effect. Popular for luxury brand labels and special edition products.</p><h2>Reflective Vinyl</h2><p>Essential for safety applications and vehicles. Reflective vinyl shines brightly when hit by light, making it perfect for fleet decals and safety signage.</p>',
  'SpeedyPrint Team',
  true,
  now() - interval '10 days'
),
(
  '3D Domed Stickers: Premium Branding That Stands Out',
  '3d-domed-stickers-premium-branding',
  'Discover how 3D domed stickers can elevate your brand with a professional, tactile finish.',
  '<h2>What Are 3D Domed Stickers?</h2><p>3D domed stickers feature a layer of clear polyurethane resin applied over the printed sticker, creating a raised, dome-shaped surface. This gives them a premium, three-dimensional appearance that stands out.</p><h2>Applications</h2><p>3D domed stickers are perfect for product branding, automotive badges, electronics labeling, and promotional items. Their durability and professional look make them ideal for high-end applications.</p><h2>The Process</h2><p>We print your design on high-quality vinyl, then carefully apply a measured amount of crystal-clear resin. The resin self-levels to create a perfect dome shape, and cures to a hard, scratch-resistant finish.</p>',
  'SpeedyPrint Team',
  true,
  now() - interval '7 days'
),
(
  'Vehicle Decals: Transform Your Fleet into Moving Billboards',
  'vehicle-decals-transform-fleet-moving-billboards',
  'Turn every vehicle in your fleet into a powerful marketing asset with custom decals.',
  '<h2>The Power of Vehicle Advertising</h2><p>Vehicle wraps and decals generate thousands of impressions daily. Studies show that a single vehicle wrap can generate between 30,000 to 70,000 views per day, making it one of the most cost-effective advertising methods available.</p><h2>Materials for Vehicles</h2><p>We use premium cast vinyl specifically designed for vehicle applications. Our materials conform to curves, resist UV damage, and can withstand harsh weather conditions for years.</p><h2>Design Considerations</h2><p>Vehicle decals need to be readable at speed. Use large, bold text and simple graphics. Include your contact details and make sure your brand colors are consistent with your other marketing materials.</p>',
  'SpeedyPrint Team',
  true,
  now() - interval '5 days'
),
(
  'Product Labeling Best Practices for South African Businesses',
  'product-labeling-best-practices-south-african-businesses',
  'Essential tips for creating compliant, attractive product labels that sell.',
  '<h2>Legal Requirements</h2><p>South African product labels must comply with regulations including the Consumer Protection Act. Ensure your labels include all required information such as ingredients, batch numbers, and contact details.</p><h2>Design for Shelf Appeal</h2><p>Your label has seconds to grab attention on the shelf. Use vibrant colors, clear typography, and professional design. Consider how your label will look next to competitors.</p><h2>Material Selection</h2><p>Consider the environment your product will face. Refrigerated products need moisture-resistant labels, while products exposed to sunlight need UV-resistant materials.</p>',
  'SpeedyPrint Team',
  true,
  now() - interval '3 days'
),
(
  'SpeedyPrint Design Tips: Getting the Best Print Results',
  'speedyprint-design-tips-best-print-results',
  'Professional design tips to ensure your stickers and labels look perfect every time.',
  '<h2>Resolution Matters</h2><p>Always design at 300 DPI (dots per inch) at the final print size. Low-resolution images will appear blurry or pixelated when printed. If you''re unsure, our design team can check your artwork before printing.</p><h2>Color Mode</h2><p>Design in CMYK color mode for print. RGB colors can look different when converted to CMYK. If specific colors are critical, provide Pantone color references.</p><h2>Bleed and Safe Zone</h2><p>Include a 2mm bleed on all edges and keep important content within the safe zone. This ensures nothing important gets trimmed during the cutting process.</p><h2>File Formats</h2><p>We accept PDF, PNG, SVG, and AI files. PDF is preferred for print-ready artwork. For logos and vector graphics, SVG provides the best quality at any size.</p>',
  'SpeedyPrint Team',
  true,
  now() - interval '1 day'
);

-- Testimonials
INSERT INTO testimonials (customer_name, company_name, location, rating, review_text, featured) VALUES
(
  'Sarah van der Merwe',
  'Bloom Botanicals',
  'Cape Town',
  5,
  'SpeedyPrint transformed our product labels completely. The quality is outstanding and our products now look premium on the shelf. The turnaround time was incredibly fast too!',
  true
),
(
  'Thabo Molefe',
  'Molefe Fleet Services',
  'Johannesburg',
  5,
  'We had our entire fleet of 12 vehicles branded with custom decals. The quality is superb and they''ve held up perfectly even after 2 years in the Joburg sun. Highly recommend!',
  true
),
(
  'Lisa Naidoo',
  'Coastal Crafts',
  'Durban',
  5,
  'As a small business owner, I was worried about the cost of custom stickers. SpeedyPrint offered amazing quality at a price I could afford. The 3D domed stickers are absolutely stunning!',
  true
),
(
  'Johan Pretorius',
  'JP Wines',
  'Stellenbosch',
  5,
  'The wine labels SpeedyPrint created for us are beautiful. They withstand the cold room environment and still look pristine. Our customers always comment on how professional they look.',
  true
),
(
  'Amahle Dlamini',
  'Ubuntu Events',
  'Pretoria',
  4,
  'We use SpeedyPrint for all our event branding needs. The window graphics and wall decals always make a huge impact at our corporate events. Great service every time.',
  true
),
(
  'Mike Stevens',
  'Stevens Brewing Co.',
  'Port Elizabeth',
  5,
  'Finding a reliable label printer was crucial for our craft beer brand. SpeedyPrint delivers consistent quality batch after batch. The waterproof labels are perfect for our bottles.',
  true
),
(
  'Fatima Osman',
  'Osman Organics',
  'Bloemfontein',
  5,
  'I love how easy the ordering process is. Upload my design, choose the material, and the stickers arrive within days. The quality speaks for itself - my customers love the packaging!',
  false
),
(
  'David Botha',
  'Botha Construction',
  'East London',
  4,
  'The reflective safety stickers and vehicle decals have been perfect for our construction fleet. They meet all safety requirements and look professional. Very happy with the service.',
  false
);
