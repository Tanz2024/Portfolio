require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://tanzimportfolio.web.app",
  "https://portfolio-tfli.onrender.com",
  // "http://localhost:1234"
];

// ✅ FIX 1: CORS should be the VERY FIRST middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ✅ FIX 2: Handle preflight requests (important for cookies + CORS)
app.options("*", cors());
// ✅ Parse incoming JSON and cookies globally
app.use(express.json());
app.use(cookieParser());
// -----------------------------
// Health Check Endpoint
// -----------------------------
app.get('/', (req, res) => {
  res.status(200).send('Backend is up and running!');
});

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// -----------------------------
// Ensure the uploads directory exists BEFORE using it
// -----------------------------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads folder at ${uploadDir}`);
}

// -----------------------------
// Serve static files from the uploads folder
// -----------------------------
app.use("/uploads", express.static(uploadDir, {
  fallthrough: false,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") res.setHeader("Content-Type", "image/jpeg");
    else if (ext === ".png") res.setHeader("Content-Type", "image/png");
    else if (ext === ".pdf") res.setHeader("Content-Type", "application/pdf");
  }
}));

// Create PostgreSQL connection pool using PG_CONNECTION_STRING from .env
const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
});


// Optional: Log requests to the /uploads route for debugging
app.use("/uploads", (req, res, next) => {
  console.log("Static file requested:", req.path);
  next();
});

// -----------------------------
// JWT & Authentication Middlewares
// -----------------------------
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden" });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role_id !== 1) {
      return res.status(403).json({ error: "Admins only" });
    }
    next();
  });
};

// -----------------------------
// LOGIN ENDPOINTS
// -----------------------------
app.post('/login/admin', express.json(), async (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 1, role_id: 1, username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 3600000
    });

    return res.status(200).json({ message: "Admin login successful" });
  }

  res.status(400).json({ error: "Invalid admin credentials" });
});

app.post('/login/user', express.json(), async (req, res) => {
  const token = jwt.sign(
    { role_id: 2, username: "Viewer" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 3600000
  });

  res.status(200).json({ message: "User login successful" });
});

// -----------------------------
// File Upload Setup with multer
// -----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use a timestamp plus the original name to avoid overwrites.
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// -----------------------------
// BLOGS API
// -----------------------------
app.get('/api/blogs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blogs WHERE published = true ORDER BY date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/blogs', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blogs ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(
  '/api/blogs',
  verifyAdmin,
  upload.fields([{ name: 'image' }, { name: 'video' }]),
  async (req, res) => {
    try {
      console.log("Blog upload files:", req.files);
      const {
        title = "",
        date,
        tools, // e.g., "React, Node.js"
        summary = "",
        doc_url, // New field for document URL
        featured,
        published,
      } = req.body;
  
      const featuredValue = (featured === 'true' || featured === true);
      const publishedValue = published === undefined ? true : (published === 'true' || published === true);
      const imageUrl = req.files.image ? "/uploads/" + req.files.image[0].filename : null;
      const videoUrl = req.files.video ? "/uploads/" + req.files.video[0].filename : null;
  
      const insertQuery = `
        INSERT INTO blogs 
        (title, date, tools, summary, doc_url, image_url, video_url, featured, published)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        title,
        date || new Date(),
        tools || null,
        summary,
        doc_url || null,
        imageUrl,
        videoUrl,
        featuredValue,
        publishedValue,
      ];
      const result = await pool.query(insertQuery, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.put('/api/blogs/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      date,
      tools,
      summary,
      content,
      image_url,
      video_url,
      featured,
      published,
    } = req.body;

    const updateQuery = `
      UPDATE blogs 
      SET title = COALESCE($1, title),
          date = COALESCE($2, date),
          tools = COALESCE($3, tools),
          summary = COALESCE($4, summary),
          content = COALESCE($5, content),
          image_url = COALESCE($6, image_url),
          video_url = COALESCE($7, video_url),
          featured = COALESCE($8, featured),
          published = COALESCE($9, published)
      WHERE id = $10 RETURNING *
    `;
    const values = [
      title,
      date,
      tools,
      summary,
      content,
      image_url,
      video_url,
      featured,
      published,
      req.params.id
    ];
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog post not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/blogs/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM blogs WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog post not found." });
    }
    res.json({ message: "Blog deleted", blog: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// PROJECTS API
// -----------------------------
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', verifyAdmin, upload.array('screenshots', 5), async (req, res) => {
  try {
    console.log("Project upload files:", req.files);
    const { title, year, category, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }
    const screenshots = req.files && req.files.length > 0
      ? req.files.map(file => "/uploads/" + file.filename)
      : [];
    const insertQuery = `
      INSERT INTO projects (title, year, category, description, screenshots)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [title, year, category, description, JSON.stringify(screenshots)];
    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', verifyAdmin, upload.array('screenshots', 5), async (req, res) => {
  try {
    const { title, year, category, description } = req.body;
    let screenshots;
    if (req.files && req.files.length > 0) {
      screenshots = JSON.stringify(req.files.map(file => "/uploads/" + file.filename));
    }
    const updateQuery = `
      UPDATE projects
      SET title = COALESCE($1, title),
          year = COALESCE($2, year),
          category = COALESCE($3, category),
          description = COALESCE($4, description),
          screenshots = COALESCE($5, screenshots)
      WHERE id = $6
      RETURNING *
    `;
    const values = [title, year, category, description, screenshots, req.params.id];
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.json({ message: "Project deleted successfully.", project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET all achievements

// GET all achievements (alias certificate_pdf as certificateUrl for client convenience)
app.get('/api/achievements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        description, 
        certificate_pdf AS "certificateUrl", 
        category, 
        year, 
        image, 
        video, 
        tags 
      FROM achievements 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new achievement (Admin only)
app.post(
  '/api/achievements',
  verifyAdmin,
  // Expect certificate file under "certificatePDF", along with image and video.
  upload.fields([{ name: 'certificatePDF' }, { name: 'image' }, { name: 'video' }]),
  async (req, res) => {
    try {
      const { title, description, category, year, tags } = req.body;
      const certificatePDFUrl = req.files?.certificatePDF
        ? "/uploads/" + req.files.certificatePDF[0].filename
        : null;
      const imageUrl = req.files?.image ? "/uploads/" + req.files.image[0].filename : null;
      const videoUrl = req.files?.video ? "/uploads/" + req.files.video[0].filename : null;

      const insertQuery = `
        INSERT INTO achievements 
        (title, description, certificate_pdf, category, year, image, video, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [title, description, certificatePDFUrl, category, year, imageUrl, videoUrl, tags || null];
      const result = await pool.query(insertQuery, values);

      res.status(201).json({ success: true, achievement: result.rows[0] });
    } catch (err) {
      console.error("Error creating achievement:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/achievements/:id/react - Add a reaction (emoji) to an achievement
app.post('/api/achievements/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;
    if (!reaction) {
      return res.status(400).json({ error: 'Reaction not provided' });
    }
    // Update the JSONB reactions object: increment count for the provided emoji.
    const updateQuery = `
      UPDATE achievements
      SET reactions = jsonb_set(
        COALESCE(reactions, '{}'::jsonb),
        ARRAY[$1],
        to_jsonb(
          COALESCE((reactions->>$1)::int, 0) + 1
        ),
        true
      )
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [reaction, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.json({ success: true, achievement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/achievements/:id - Update an achievement (Admin only)
// Now accepts certificate update via file upload (certificatePDF) or via text input (certificateUrl).
app.put(
  '/api/achievements/:id',
  verifyAdmin,
  // Accept certificatePDF along with image and video.
  upload.fields([{ name: 'certificatePDF' }, { name: 'image' }, { name: 'video' }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, certificateUrl } = req.body;
      
      // Prefer the uploaded file (certificatePDF) over the text URL.
      const certificatePDFUrlFromFile = req.files?.certificatePDF
        ? "/uploads/" + req.files.certificatePDF[0].filename
        : null;
      const certificatePDFUrl = certificatePDFUrlFromFile || certificateUrl || null;
      
      const imageUrl = req.files?.image ? "/uploads/" + req.files.image[0].filename : null;
      const videoUrl = req.files?.video ? "/uploads/" + req.files.video[0].filename : null;

      // Build update parts dynamically.
      const updateFields = [`title = $1`, `description = $2`, `certificate_pdf = $3`];
      const values = [title, description, certificatePDFUrl];
      let paramIndex = 4;
      if (imageUrl) {
        updateFields.push(`image = $${paramIndex++}`);
        values.push(imageUrl);
      }
      if (videoUrl) {
        updateFields.push(`video = $${paramIndex++}`);
        values.push(videoUrl);
      }
      values.push(id);

      const updateQuery = `
        UPDATE achievements
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      const result = await pool.query(updateQuery, values);
      res.json({ success: true, achievement: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/achievements/:id - Delete an achievement (Admin only)
app.delete('/api/achievements/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleteQuery = `DELETE FROM achievements WHERE id = $1 RETURNING *`;
    const result = await pool.query(deleteQuery, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.json({ success: true, achievement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -----------------------------
// RESUME API
// -----------------------------
app.get('/authenticate', (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(200).json({ role_id: 2 }); // Viewer by default
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ role_id: decoded.role_id });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Setup multer storage for resume (overwrite existing file)
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, "resume" + path.extname(file.originalname));
  },
});
const resumeUpload = multer({ storage: resumeStorage });

app.post('/api/resume', verifyAdmin, resumeUpload.single("resume"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  res.status(200).json({ message: "Resume updated successfully." });
});

app.get('/api/resume/download', (req, res) => {
  const resumePath = path.join(uploadDir, "resume.pdf");
  if (fs.existsSync(resumePath)) {
    res.download(resumePath, "Tanzim_Bin_Zahir_Resume.pdf");
  } else {
    res.status(404).json({ error: "Resume not found." });
  }
});

// -----------------------------
// PROFILE IMAGE API
// -----------------------------
app.post('/api/profile-image', verifyAdmin, upload.single("profileImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  const newProfileImageURL = "/uploads/" + req.file.filename;
  
  try {
    const result = await pool.query(
      "UPDATE users SET profile_image_url = $1 WHERE id = $2 RETURNING *",
      [newProfileImageURL, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  
  res.status(200).json({
    profileImageURL: newProfileImageURL,
    message: "Profile image updated successfully!"
  });
});

// Public endpoint: fetches profile image without authentication
app.get('/api/public/profile-image', async (req, res) => {
  try {
    // Fetch the profile image for a specific user, e.g., admin (id=1)
    const result = await pool.query(
      "SELECT profile_image_url FROM users WHERE role_id = 1 LIMIT 1"
    );
    const profileImageURL = result.rows[0]?.profile_image_url || null;
    if (!profileImageURL) {
      return res.status(404).json({ error: "Profile image not found." });
    }
    res.status(200).json({ profileImageURL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// TESTIMONIALS API
// -----------------------------
app.get("/api/testimonials", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM testimonials ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/testimonials", async (req, res) => {
  const { name, comment, rating } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ error: "Name and comment are required." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO testimonials (name, comment, rating) VALUES ($1, $2, $3) RETURNING *",
      [name, comment, rating || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete a testimonial (admin only)
app.delete("/api/testimonials/:id", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM testimonials WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Testimonial not found." });
    }
    res.json({ message: "Testimonial deleted successfully.", testimonial: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET public profile info (for bio) – no authentication required
app.get('/api/public/profile', async (req, res) => {
  try {
    // Assuming the admin’s profile (with user_id = 1) is the one to be shown publicly.
    const result = await pool.query(
      'SELECT name, bio FROM profiles WHERE user_id = $1',
      [1]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user profile info (for admin editing; requires token)
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, bio FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found." });
    }
    res.json(result.rows[0]); // returns { name, bio }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user profile info (only admin can update, so use verifyToken here)
app.put('/api/user/profile', verifyToken, async (req, res) => {
  const { name, description } = req.body; // description will be stored as bio
  try {
    // Upsert profile: update if exists, or insert a new row if not.
    const result = await pool.query(
      `INSERT INTO profiles (user_id, name, bio)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, bio = EXCLUDED.bio, updated_at = CURRENT_TIMESTAMP
       RETURNING name, bio`,
      [req.user.id, name, description]
    );
    res.json({ message: "Profile updated successfully.", ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -----------------------------
// CONTACT API
// -----------------------------
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *",
      [name, email, message]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// -----------------------------
// Start the Server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
