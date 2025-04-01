import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const recentPostsRef = useRef(null);

  // -----------------------------
  // State: Fetched Data & Loading
  // -----------------------------
  const [blogs, setBlogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // -----------------------------
  // State: Authentication / Admin Role
  // -----------------------------
  const [isAdmin, setIsAdmin] = useState(false);

  // -----------------------------
  // State: Resume Upload (Admin)
  // -----------------------------
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  // -----------------------------
  // State: Testimonial Submission
  // -----------------------------
  const [testimonialName, setTestimonialName] = useState("");
  const [testimonialComment, setTestimonialComment] = useState("");
  const [testimonialRating, setTestimonialRating] = useState(5);

  // -----------------------------
  // State: Dynamic Profile Image & Bio Data
  // -----------------------------
  const [profileImageURL, setProfileImageURL] = useState("");
  const [showProfileImageForm, setShowProfileImageForm] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUploadMessage, setProfileImageUploadMessage] = useState("");
  const [profileImageUploadError, setProfileImageUploadError] = useState("");

  // Editable bio info (name and description)
  const [bioData, setBioData] = useState({ name: "", description: "" });
  const [editingBio, setEditingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState("");
  const [bioError, setBioError] = useState("");

  // -----------------------------
  // State: Modal for Preview
  // -----------------------------
  const [modalItem, setModalItem] = useState(null);
  const [zoom, setZoom] = useState(1);

  // -----------------------------
  // Helper: Check if item is recent (< 1 day old)
  // -----------------------------
  const isRecent = (dateString) => {
    const itemDate = new Date(dateString);
    const now = new Date();
    const diffInMs = now - itemDate;
    return diffInMs < 24 * 60 * 60 * 1000; // less than one day
  };

  // -----------------------------
  // Fetch Data & Authenticate User
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Blogs
        const blogsRes = await fetch("http://localhost:5000/api/blogs");
        if (blogsRes.ok) {
          setBlogs(await blogsRes.json());
        }
        setLoadingBlogs(false);

        // Fetch Projects
        const projectsRes = await fetch("http://localhost:5000/api/projects");
        if (projectsRes.ok) {
          setProjects(await projectsRes.json());
        }
        setLoadingProjects(false);

        // Fetch Testimonials
        const testimonialsRes = await fetch("http://localhost:5000/api/testimonials");
        if (testimonialsRes.ok) {
          setTestimonials(await testimonialsRes.json());
        }

        // Authenticate User (to know if current viewer is admin)
        const authRes = await fetch("http://localhost:5000/authenticate", { credentials: "include" });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData) {
            if (!sessionStorage.getItem("welcomeShown")) {
              toast.info("Welcome back! Enjoy exploring my portfolio.", { autoClose: 3000 });
              sessionStorage.setItem("welcomeShown", "true");
            }
            if (authData.role_id === 1) setIsAdmin(true);
          }
        }

        // Fetch Profile Image
        const profileRes = await fetch("http://localhost:5000/api/public/profile-image");
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.profileImageURL) {
            setProfileImageURL("http://localhost:5000" + data.profileImageURL);
          }
        }
        
        // Fetch Bio Data from public endpoint so all users see the updated info
        const bioRes = await fetch("http://localhost:5000/api/public/profile");
        if (bioRes.ok) {
          const bioInfo = await bioRes.json();
          // Map backend field "bio" to "description" for your state
          setBioData({ name: bioInfo.name, description: bioInfo.bio });
        }
      } catch (err) {
        console.warn("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // -----------------------------
  // Handle Esc Key (Close Modal & Reset Zoom)
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setModalItem(null);
        setZoom(1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // -----------------------------
  // Scroll to "Recent Posts"
  // -----------------------------
  const scrollToRecentPosts = () => {
    if (recentPostsRef.current) {
      recentPostsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // -----------------------------
  // Resume Download
  // -----------------------------
  const handleResumeDownload = () => {
    window.open("http://localhost:5000/api/resume/download", "_blank");
  };

  // -----------------------------
  // Toggle Resume Upload Form
  // -----------------------------
  const toggleUploadForm = () => {
    setShowUploadForm((prev) => !prev);
    setUploadMessage("");
    setUploadError("");
    setResumeFile(null);
  };

  // -----------------------------
  // Handle Resume File Change
  // -----------------------------
  const handleResumeChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  // -----------------------------
  // Upload Resume to Backend
  // -----------------------------
  const handleUpload = async () => {
    if (!resumeFile) {
      setUploadError("Please select a resume file to upload.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const res = await fetch("http://localhost:5000/api/resume", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadMessage(data.message || "Uploaded successfully!");
        setUploadError("");
        toast.success("Resume uploaded successfully!");
      } else {
        const errData = await res.json();
        setUploadError(errData.error || "Upload failed.");
        toast.error(errData.error || "Upload failed.");
      }
    } catch (err) {
      setUploadError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
      console.error("Error during resume upload:", err);
    }
  };

  // -----------------------------
  // Toggle Profile Image Upload Form
  // -----------------------------
  const toggleProfileImageForm = () => {
    setShowProfileImageForm((prev) => !prev);
    setProfileImageUploadMessage("");
    setProfileImageUploadError("");
    setProfileImageFile(null);
  };

  // -----------------------------
  // Upload Profile Image
  // -----------------------------
  const handleProfileImageUpload = async () => {
    if (!profileImageFile) {
      setProfileImageUploadError("Please select a profile image file to upload.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("profileImage", profileImageFile);
      const res = await fetch("http://localhost:5000/api/profile-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProfileImageUploadMessage(data.message || "Profile image updated successfully!");
        setProfileImageUploadError("");
        setProfileImageURL("http://localhost:5000" + data.profileImageURL);
        toast.success("Profile image updated!");
      } else {
        const errData = await res.json();
        setProfileImageUploadError(errData.error || "Profile image upload failed.");
        toast.error(errData.error || "Profile image upload failed.");
      }
    } catch (err) {
      setProfileImageUploadError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
      console.error("Error during profile image upload:", err);
    }
  };

  // -----------------------------
  // Editable Bio Handlers (only admin can edit)
  // -----------------------------
  const toggleEditBio = () => {
    setEditingBio((prev) => !prev);
    setBioMessage("");
    setBioError("");
  };

  const handleBioChange = (e) => {
    const { name, value } = e.target;
    setBioData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only admin (authenticated via token) can submit the update.
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bioData),
      });
      if (res.ok) {
        const data = await res.json();
        setBioMessage(data.message || "Bio updated successfully.");
        setBioError("");
        toast.success("Bio updated successfully.");
        setEditingBio(false);
      } else {
        const errData = await res.json();
        setBioError(errData.error || "Failed to update bio.");
        toast.error(errData.error || "Failed to update bio.");
      }
    } catch (err) {
      setBioError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
      console.error("Error updating bio:", err);
    }
  };

  // -----------------------------
  // Delete Testimonial (Admin)
  // -----------------------------
  const handleDeleteTestimonial = async (testimonialId) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/testimonials/${testimonialId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== testimonialId));
        toast.success("Testimonial deleted.");
      } else {
        const errData = await res.json();
        console.error("Delete testimonial error:", errData.error);
      }
    } catch (err) {
      console.error("Error deleting testimonial:", err);
    }
  };

  // -----------------------------
  // Delete Project (Admin)
  // -----------------------------
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        toast.success("Project deleted.");
      } else {
        const errData = await res.json();
        console.error("Delete project error:", errData.error);
      }
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  // -----------------------------
  // Intersection Observer for Fade-In Animation
  // -----------------------------
  useEffect(() => {
    const elements = document.querySelectorAll(".animate-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // -----------------------------
  // Submit Testimonial
  // -----------------------------
  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    const newTestimonial = {
      name: testimonialName,
      comment: testimonialComment,
      rating: testimonialRating,
    };
    try {
      const res = await fetch("http://localhost:5000/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTestimonial),
      });
      if (res.ok) {
        const createdTestimonial = await res.json();
        setTestimonials((prev) => [createdTestimonial, ...prev]);
        setTestimonialName("");
        setTestimonialComment("");
        setTestimonialRating(5);
        toast.success("Testimonial submitted!");
      } else {
        console.warn("Error creating testimonial:", res.status);
        toast.error("Error submitting testimonial.");
      }
    } catch (err) {
      console.warn("Error submitting testimonial:", err);
      toast.error("Error submitting testimonial.");
    }
  };

  // -----------------------------
  // Render Star Rating
  // -----------------------------
  const renderStars = (rating) => (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          style={{ color: rating >= star ? "gold" : "gray" }}
        >
          {rating >= star ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
  
  // -----------------------------
  // Slider Settings for Blogs Carousel
  // -----------------------------
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: blogs.length < 3 ? blogs.length : 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: blogs.length < 2 ? blogs.length : 2,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  // -----------------------------
  // Render a Screenshot (Image/PDF) with Click-to-Preview
  // -----------------------------
  const renderScreenshot = (fileUrl, index) => {
    const fullUrl = `http://localhost:5000${fileUrl}`;
    const isPdf = fileUrl.toLowerCase().endsWith(".pdf");
    return (
      <div key={index} className="file-preview" style={{ flex: "1 0 auto" }}>
        {isPdf ? (
          <iframe
            src={fullUrl}
            title={`PDF-${index}`}
            width="100%"
            height="250px"
            className="pdf-frame"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setModalItem({ url: fullUrl, isPdf: true });
              setZoom(1);
            }}
          />
        ) : (
          <img
            src={fullUrl}
            alt={`Screenshot ${index + 1}`}
            className="project-image"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setModalItem({ url: fullUrl, isPdf: false });
            }}
          />
        )}
      </div>
    );
  };

  // -----------------------------
  // JSX Return
  // -----------------------------
  return (
    <div className="home-page">
      <ToastContainer />

      {/* HERO SECTION */}
      <header className="hero-section">
        <div className="hero-content animate-on-scroll">
          {editingBio ? (
            <form onSubmit={handleBioSubmit} className="bio-edit-form">
              <input 
                type="text"
                name="name"
                value={bioData.name}
                onChange={handleBioChange}
                placeholder="Your Name"
                required
              />
              <textarea 
                name="description"
                value={bioData.description}
                onChange={handleBioChange}
                placeholder="Describe yourself and your work..."
                required
              ></textarea>
              <button type="submit" className="resume-button">Save Bio</button>
              <button type="button" className="resume-button" onClick={toggleEditBio} style={{ backgroundColor: "#ccc" }}>Cancel</button>
              {bioMessage && <p style={{ color: "green" }}>{bioMessage}</p>}
              {bioError && <p style={{ color: "red" }}>{bioError}</p>}
            </form>
          ) : (
            <>
              <h1>{bioData.name || "Hi, I am Tanzim Bin Zahir, AI Engineer"}</h1>
              <p>
                {bioData.description ||
                  "I help brands stand out with modern digital experiences. My work is focused on building visually engaging, user-friendly solutions."}
              </p>
              {/* Only admin can see the Edit button */}
              {isAdmin && (
                <button className="resume-button" onClick={toggleEditBio}>
                  Edit Bio
                </button>
              )}
            </>
          )}
          <div className="resume-buttons" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button className="resume-button" onClick={handleResumeDownload}>
              Download Resume
            </button>
            {isAdmin && (
              <>
                <button className="resume-button" onClick={toggleUploadForm}>
                  Upload Resume
                </button>
                <button className="profile-image-button" onClick={toggleProfileImageForm}>
                  Change Profile Image
                </button>
              </>
            )}
          </div>
          {/* Admin Resume Upload Form */}
          {isAdmin && showUploadForm && (
            <div className="upload-form" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <label htmlFor="resume-file" style={{ marginRight: "0.5rem" }}>Resume (PDF):</label>
                  <input type="file" id="resume-file" accept=".pdf" onChange={handleResumeChange} />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <button className="resume-button" onClick={handleUpload}>Confirm Upload</button>
                  <button className="resume-button" style={{ backgroundColor: "#ccc" }} onClick={toggleUploadForm}>Cancel</button>
                </div>
                {uploadMessage && <p style={{ color: "green", marginTop: "0.5rem" }}>{uploadMessage}</p>}
                {uploadError && <p style={{ color: "red", marginTop: "0.5rem" }}>{uploadError}</p>}
              </div>
            </div>
          )}
          {/* Admin Profile Image Upload Form */}
          {isAdmin && showProfileImageForm && (
            <div className="upload-form profile-image-form" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <label htmlFor="profile-image-file" style={{ marginRight: "0.5rem" }}>Profile Image (JPG/PNG):</label>
                  <input type="file" id="profile-image-file" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files[0])} />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <button className="profile-image-button" onClick={handleProfileImageUpload}>Upload Image</button>
                  <button className="profile-image-button" style={{ backgroundColor: "#ccc" }} onClick={toggleProfileImageForm}>Cancel</button>
                </div>
                {profileImageUploadMessage && <p style={{ color: "green", marginTop: "0.5rem" }}>{profileImageUploadMessage}</p>}
                {profileImageUploadError && <p style={{ color: "red", marginTop: "0.5rem" }}>{profileImageUploadError}</p>}
              </div>
            </div>
          )}
        </div>
        {/* HERO IMAGE */}
        <div className="hero-image animate-on-scroll">
          {profileImageURL && (
            <img src={profileImageURL} alt="Profile of Tanzim Bin Zahir" loading="lazy" />
          )}
        </div>
      </header>

      {/* RECENT POSTS SECTION with Carousel */}
      <section className="recent-posts animate-on-scroll" ref={recentPostsRef}>
        <h2>Recent Posts</h2>
        {loadingBlogs ? (
          <div className="skeleton-container">
            <div className="skeleton skeleton-post"></div>
            <div className="skeleton skeleton-post"></div>
            <div className="skeleton skeleton-post"></div>
          </div>
        ) : (
          blogs.length > 0 ? (
            <Slider {...sliderSettings}>
              {blogs.map((blog, index) => (
                <div key={blog.id} className={`post-card ${isRecent(blog.date) ? "latest-post" : ""}`}>
                  {isRecent(blog.date) && <span className="new-badge">New</span>}
                  <h3>{blog.title}</h3>
                  <div className="post-meta">
                    <span>{new Date(blog.date).toLocaleDateString()}</span>
                    <span>|</span>
                    <span>{blog.category}</span>
                  </div>
                  <p>{blog.summary}</p>
                </div>
              ))}
            </Slider>
          ) : (
            <p>No recent posts available.</p>
          )
        )}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button className="resume-button" onClick={() => navigate("/blogs")}>View All Blogs</button>
        </div>
      </section>

      {/* FEATURED WORKS SECTION */}
      <section className="featured-works animate-on-scroll">
        <h2>Featured Works</h2>
        {loadingProjects ? (
          <div className="skeleton-container">
            <div className="skeleton skeleton-project"></div>
            <div className="skeleton skeleton-project"></div>
          </div>
        ) : (
          projects.length > 0 ? (
            <div className="works-grid">
              {projects.slice(0, 3).map((project, index) => {
                let screenshots = [];
                try {
                  screenshots = project.screenshots ? JSON.parse(project.screenshots) : [];
                } catch (e) {
                  console.warn("Invalid screenshots JSON for project", project.id, e);
                }
                return (
                  <article key={project.id} className={`work-card ${project.date && isRecent(project.date) ? "latest-project" : ""}`}>
                    {project.date && isRecent(project.date) && <span className="new-badge">New</span>}
                    <div className="screenshots-row" style={{ display: "flex", gap: "0.5rem" }}>
                      {screenshots.length > 0 &&
                        screenshots.map((screenshot, index) => {
                          const fullUrl = `http://localhost:5000${screenshot}`;
                          const isPdf = screenshot.toLowerCase().endsWith(".pdf");
                          return (
                            <div key={index} className="file-preview">
                              {isPdf ? (
                                <iframe
                                  src={fullUrl}
                                  title={`PDF-${index}`}
                                  className="pdf-frame"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setModalItem({ url: fullUrl, isPdf: true })}
                                />
                              ) : (
                                <img
                                  src={fullUrl}
                                  alt={`Screenshot ${index + 1}`}
                                  className="project-image"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setModalItem({ url: fullUrl, isPdf: false })}
                                />
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
                    <div className="work-info">
                      <h3 className="work-title">{project.title}</h3>
                      <div className="work-meta">
                        {project.year && <span className="work-year">{project.year}</span>}
                        {project.category && <span className="work-category">{project.category}</span>}
                      </div>
                      <p className="work-description">{project.description}</p>
                      {isAdmin && (
                        <button className="btn delete-btn" onClick={() => handleDeleteProject(project.id)}>
                          Delete Project
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>No featured works available.</p>
          )
        )}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button className="resume-button" onClick={() => navigate("/work")}>View All Projects</button>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials animate-on-scroll">
        <h2>Testimonials</h2>
        <div className="testimonial-slider">
          {testimonials.length > 0 ? (
            testimonials.map((t) => (
              <blockquote key={t.id} className="testimonial">
                <p>"{t.comment}"</p>
                <footer>
                  - {t.name} {t.rating ? renderStars(t.rating) : ""}
                  {isAdmin && (
                    <button className="btn delete-btn" onClick={() => handleDeleteTestimonial(t.id)} style={{ marginLeft: "1rem" }}>
                      Delete
                    </button>
                  )}
                </footer>
              </blockquote>
            ))
          ) : (
            <p>No testimonials yet.</p>
          )}
        </div>
        <div className="testimonial-form-container" style={{ marginTop: "2rem" }}>
          <h3>Leave a Comment</h3>
          <form onSubmit={handleTestimonialSubmit} className="testimonial-form">
            <div>
              <label htmlFor="testimonialName">Your Name:</label>
              <input
                id="testimonialName"
                type="text"
                value={testimonialName}
                onChange={(e) => setTestimonialName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="testimonialComment">Comment:</label>
              <textarea
                id="testimonialComment"
                value={testimonialComment}
                onChange={(e) => setTestimonialComment(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Star Rating:</label>
              <div className="star-rating" style={{ fontSize: "1.5rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setTestimonialRating(star)}
                    style={{ cursor: "pointer", color: testimonialRating >= star ? "gold" : "gray" }}
                  >
                    {testimonialRating >= star ? "★" : "☆"}
                  </span>
                ))}
              </div>
            </div>
            <button type="submit" style={{ marginTop: "1rem" }}>Submit</button>
          </form>
        </div>
      </section>

      {/* MODAL FOR PREVIEW */}
      {modalItem && !modalItem.isPdf && (
        <Lightbox mainSrc={modalItem.url} onCloseRequest={() => setModalItem(null)} />
      )}
      {modalItem && modalItem.isPdf && (
        <div className="modal-overlay" onClick={() => { setModalItem(null); setZoom(1); }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "90vw", height: "90vh", maxWidth: "1000px", maxHeight: "90vh", backgroundColor: "#000", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRadius: "8px", overflow: "hidden" }}
          >
            <iframe 
              src={modalItem.url} 
              title="Full PDF Preview" 
              className="pdf-frame" 
              style={{ width: "100%", height: "100%", border: "none", overflow: "hidden", scrollbarWidth: "none" }}
            />
            <div className="modal-controls" style={{ padding: "0.5rem", background: "#f0f0f0", textAlign: "center", width: "100%" }}>
              <button onClick={() => { setModalItem(null); setZoom(1); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
