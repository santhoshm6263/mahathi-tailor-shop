export const designers = [
  {
    id: 1,
    name: "Ananya Rao",
    specialization: "Custom Blouses & Lehenga Stitching",
    rating: 4.9,
    bio: "Experienced fashion designer specializing in modern cuts and custom wedding silhouettes.",
    contact: "9988776655",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    available_slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
  },
  {
    id: 2,
    name: "Priya Sen",
    specialization: "Traditional & Heavy Aari Work Embroidery",
    rating: 4.8,
    bio: "Craftsman with 12+ years of hand embroidery, specialising in custom beadwork and heavy zardozi detailing.",
    contact: "9988776656",
    image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    available_slots: ["10:00 AM", "12:00 PM", "03:00 PM", "05:00 PM"]
  },
  {
    id: 3,
    name: "Meera Nair",
    specialization: "Bridal Makeup & Beautician Services",
    rating: 4.9,
    bio: "Professional bridal makeup artist specializing in HD and Airbrush makeup, traditional hairstyles, and saree draping.",
    contact: "9988776657",
    image_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    available_slots: ["08:00 AM", "10:00 AM", "01:00 PM", "04:00 PM"]
  }
];

export const services = [
  {
    id: 1,
    title: "Bridal Silk Blouse Stitching",
    category: "Stitching",
    description: "Custom fit stitching for bridal silk blouses. Includes pads, lining, and designer neck outline.",
    price: 1500,
    rating: 4.9,
    designer_id: 1,
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    title: "Designer Lehenga Stitching",
    category: "Stitching",
    description: "Custom lehenga tailoring with heavy canvas lining, custom waist belt, and tassels.",
    price: 3500,
    rating: 4.8,
    designer_id: 1,
    image_url: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    title: "Heavy Bridal Aari Embroidery",
    category: "Aari Work",
    description: "Intricate full back-neck and sleeve embroidery using beads, stones, and zardozi work.",
    price: 4500,
    rating: 4.9,
    designer_id: 2,
    image_url: "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    title: "Classic Flower Pattern Aari Work",
    category: "Aari Work",
    description: "Simple flower motifs on sleeves and standard border embroidery for casual wear blouses.",
    price: 1800,
    rating: 4.6,
    designer_id: 2,
    image_url: "https://images.unsplash.com/photo-1590735205567-c25db74287f3?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 5,
    title: "Signature South Indian Bridal Makeup",
    category: "Makeup Booking",
    description: "Full HD makeup package including premium hair styling, real flower settings, and professional saree draping.",
    price: 12000,
    rating: 4.9,
    designer_id: 3,
    image_url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 6,
    title: "Premium Party / Reception Makeup",
    category: "Makeup Booking",
    description: "Elegant party makeup look with hair curls/updo, custom lash extension, and basic saree draping.",
    price: 5000,
    rating: 4.7,
    designer_id: 3,
    image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 7,
    title: "Premium Hair Spa & Styling",
    category: "Beautician Services",
    description: "Deep conditioning hair spa treatment, blow dry, and custom cut styling by beauticians.",
    price: 1200,
    rating: 4.5,
    designer_id: 3,
    image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 8,
    title: "Custom In-Home Measurement Booking",
    category: "Home Measurement",
    description: "Professional designer will visit your residence in Kuppam/Mallanur area to record exact customization measurements.",
    price: 250,
    rating: 4.8,
    designer_id: 1,
    image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60"
  }
];

export const products = [
  {
    id: 1,
    name: "Professional High-Speed Sewing Machine Motor",
    category: "Tailor Machine Products",
    description: "Heavy-duty 250W copper motor with speed controller, suitable for domestic and industrial sewing machines.",
    price: 2400,
    quantity: 15,
    image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    name: "Premium Stainless Steel Fabric Scissors (10-Inch)",
    category: "Tailor Machine Products",
    description: "Razor sharp professional shear for smooth cutting of multi-layer fabrics.",
    price: 650,
    quantity: 30,
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    name: "Pre-Cut Pure Kanchipuram Silk Fabric (1.2m)",
    category: "Blouse Stitching Materials",
    description: "Rich magenta pink silk material with heavy gold zari border, ideal for custom aari embroidery.",
    price: 950,
    quantity: 25,
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    name: "Complete Hand Embroidery Kit",
    category: "Blouse Stitching Materials",
    description: "Includes wooden embroidery hoop, 10 metal needle sets, 12 colorful silk thread spools, and a design template tracebook.",
    price: 499,
    quantity: 40,
    image_url: "https://images.unsplash.com/photo-1517594422871-1d7202340b15?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 5,
    name: "Floral Print Cotton Anarkali Dress for Girls",
    category: "Ready-to-Wear Dresses",
    description: "Ready-made comfortable cotton dress with rich floral patterns, matching dupatta, and soft lining.",
    price: 1800,
    quantity: 10,
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 6,
    name: "Festival Collection Banarasi Silk Gown",
    category: "Ready-to-Wear Dresses",
    description: "Stunning gold embroidered silk gown for young girls (age group 8-14 years) with flare and zipper back.",
    price: 2999,
    quantity: 8,
    image_url: "https://images.unsplash.com/photo-1518049360964-6a418e2b34b6?w=500&auto=format&fit=crop&q=60"
  }
];
