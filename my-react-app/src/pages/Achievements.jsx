import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext"; // Custom hook providing isAdmin flag
import "./Achievements.css";

// Central API URL for calls and asset loading.
const API_BASE_URL = "https://tanzimportfolio.web.app";

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",         // This field now represents "What I Learned"
    certificateUrl: "",      // Text input for certificate URL (optional)
    certificatePDF: null,    // File upload for PDF certificate
    category: "",
    tags: "",                // Skills/Technologies (comma-separated)
    date: "",                // Calendar input (optional)
    image: null,
    video: null,
  });
  const [status, setStatus] = useState("");
  const { isAdmin } = useAuth();

  // Helper function to fetch achievements.
  const fetchAchievements = () => {
    fetch(`${API_BASE_URL}/api/achievements`, { credentials: "include" })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await res.text();
          console.error("Expected JSON but got HTML:", text.slice(0, 100));
          throw new Error("Server returned HTML instead of JSON.");
        }
        return res.json();
      })
      .then((data) => {
        const achData = Array.isArray(data) ? data : data.achievements || [];
        setAchievements(achData);
      })
      .catch((err) => {
        console.error("Error fetching achievements:", err);
      });
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);

      // If a file was uploaded for the certificate, append it under "certificatePDF"
      if (formData.certificatePDF && typeof formData.certificatePDF === "object") {
        data.append("certificatePDF", formData.certificatePDF);
      } else if (formData.certificateUrl) {
        // Otherwise, send the certificate URL as text
        data.append("certificateUrl", formData.certificateUrl);
      }
      
      // Optional fields.
      data.append("category", formData.category);
      data.append("tags", formData.tags);
      data.append("year", formData.date);
      if (formData.image) data.append("image", formData.image);
      if (formData.video) data.append("video", formData.video);

      const res = await fetch(`${API_BASE_URL}/api/achievements`, {
        method: "POST",
        credentials: "include",
        body: data,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got HTML:", text.slice(0, 100));
        throw new Error("Server returned HTML instead of JSON.");
      }
      const result = await res.json();
      if (res.ok && result.success) {
        setStatus("success");
        setFormData({
          title: "",
          description: "",
          certificateUrl: "",
          certificatePDF: null,
          category: "",
          tags: "",
          date: "",
          image: null,
          video: null,
        });
        fetchAchievements();
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  // Handle deletion of an achievement (Admin only).
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this achievement?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/achievements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        fetchAchievements();
      } else {
        console.error("Delete error:", result.error);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Extract unique categories for filter dropdown.
  const uniqueCategories = Array.from(
    new Set(achievements.map((ach) => ach.category).filter(Boolean))
  );

  // Filter achievements based on selected category.
  const filteredAchievements = filterCategory
    ? achievements.filter((ach) => ach.category === filterCategory)
    : achievements;

  return (
    <div className="achievements">
      <header className="achievements-header">
        <h1>Achievements</h1>
        <p>
          {isAdmin
            ? "Manage and showcase your professional accomplishments."
            : "Explore professional accomplishments and insights into what I learned."}
        </p>
      </header>

      {/* Filter Section */}
      <section className="filter-section">
        <label htmlFor="categoryFilter">Filter by Category:</label>
        <select
          id="categoryFilter"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </section>

      {/* Achievements List */}
      <section className="achievements-list">
        {filteredAchievements.map((ach) => (
          <div key={ach.id || ach._id} className="achievement-item">
            {ach.image && (
              <img
                src={`${API_BASE_URL}${ach.image}`}
                alt={ach.title}
                className="achievement-image"
              />
            )}
            <div className="achievement-content">
              <h2>{ach.title}</h2>
              {/* What I Learned */}
              <div className="achievement-learning">
                <h3>What I Learned</h3>
                <p>{ach.description}</p>
              </div>
              {/* Skills / Technologies */}
              {ach.tags && (
                <div className="achievement-skills">
                  <h3>Skills / Technologies</h3>
                  <div className="tags">
                    {ach.tags.split(",").map((tag, index) => (
                      <span key={index} className="tag">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {ach.certificateUrl && (
                <a
                  href={`${API_BASE_URL}${ach.certificateUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="certificate-link"
                >
                  View Certificate
                </a>
              )}
              {ach.video && (
                <video
                  controls
                  src={`${API_BASE_URL}${ach.video}`}
                  className="achievement-video"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {ach.category && <p className="achievement-category">Category: {ach.category}</p>}
              {ach.year && <p className="achievement-year">Date: {ach.year}</p>}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(ach.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Achievement Submission Form (Admin only) */}
      {isAdmin && (
        <section className="achievement-form-section">
          <h2>Add New Achievement</h2>
          <form onSubmit={handleSubmit} className="achievement-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">What I Learned</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe what you learned or achieved..."
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            {/* Certificate Upload */}
            <div className="form-group">
              <label htmlFor="certificatePDF">Certificate (PDF upload)</label>
              <input
                type="file"
                id="certificatePDF"
                name="certificatePDF"
                accept="application/pdf"
                onChange={handleChange}
              />
              <input
                type="text"
                placeholder="Or enter a certificate URL"
                name="certificateUrl"
                value={formData.certificateUrl}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                placeholder="E.g., Web Development, Data Science, etc."
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Skills/Technologies (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                placeholder="E.g., React, Node.js, SQL"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">Upload Image</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="video">Upload Video</label>
              <input
                type="file"
                id="video"
                name="video"
                accept="video/*"
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="submit-button">
              {status === "sending" ? "Submitting..." : "Submit"}
            </button>
            {status === "success" && (
              <p className="form-success">Achievement submitted successfully!</p>
            )}
            {status === "error" && (
              <p className="form-error">
                There was an error submitting the achievement. Please try again.
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
};

export default Achievements;
