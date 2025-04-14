import React, { useState, useEffect } from "react";
import "./Blogs.css";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Blog form state for new post (admin only)
  const [newBlog, setNewBlog] = useState({
    title: "",
    summary: "",
    tools: "",
    docUrl: "",
    featured: false,
  });

  // File inputs for optional image/PDF/video uploads
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  // Check admin authentication via the backend
  useEffect(() => {
    fetch("https://portfolio-tfli.onrender.com/authenticate", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.role_id === 1) {
          setIsAdmin(true);
        }
      })
      .catch((err) => console.error("Authentication check failed:", err));
  }, []);

  // Fetch published blogs from the public endpoint
  useEffect(() => {
    fetch("https://portfolio-tfli.onrender.com/api/blogs")
      .then((res) => res.json())
      .then((data) => {
        setBlogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error fetching blogs");
        setLoading(false);
      });
  }, []);

  // Separate featured and recent blogs
  const featuredBlogs = blogs.filter((blog) => blog.featured);
  const recentBlogs = blogs
    .filter((blog) => !blog.featured)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Handlers for form inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBlog((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleVideoChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  // Submit new blog post (admin only)
  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", newBlog.title);
    formData.append("summary", newBlog.summary);
    formData.append("tools", newBlog.tools);
    formData.append("doc_url", newBlog.docUrl);
    formData.append("featured", newBlog.featured);
    if (imageFile) formData.append("image", imageFile);
    if (videoFile) formData.append("video", videoFile);

    try {
      const res = await fetch("https://portfolio-tfli.onrender.com/api/blogs", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add blog");
      }
      const addedBlog = await res.json();
      setBlogs((prev) => [addedBlog, ...prev]);
      // Reset form
      setNewBlog({
        title: "",
        summary: "",
        tools: "",
        docUrl: "",
        featured: false,
      });
      setImageFile(null);
      setVideoFile(null);
    } catch (err) {
      alert("Failed to add blog: " + err.message);
    }
  };

  // Handler to delete a blog post (admin only)
  const handleDeleteBlog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog post?"))
      return;

    try {
      const res = await fetch(`https://portfolio-tfli.onrender.com/api/blogs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete blog");
      }
      setBlogs((prev) => prev.filter((blog) => blog.id !== id));
    } catch (err) {
      alert("Failed to delete blog: " + err.message);
    }
  };

  return (
    <div className="blogs-container">
      <div className="blogs-page">
        <header className="blogs-header">
          <h1>Blogs</h1>
        </header>

        {isAdmin && (
          <form className="blog-form" onSubmit={handleBlogSubmit}>
            <h2>Create New Blog Post</h2>
            <input
              type="text"
              name="title"
              value={newBlog.title}
              onChange={handleInputChange}
              placeholder="Title (optional)"
            />
            <input
              type="text"
              name="tools"
              value={newBlog.tools}
              onChange={handleInputChange}
              placeholder="Tools (e.g. React, Node.js)"
            />
            <textarea
              name="summary"
              value={newBlog.summary}
              onChange={handleInputChange}
              placeholder="Short Summary (optional)"
            />
            <input
              type="url"
              name="docUrl"
              value={newBlog.docUrl}
              onChange={handleInputChange}
              placeholder="Document URL to verify validity"
            />
            <div className="file-input-group">
              <label htmlFor="blog-image">Upload Image/PDF:</label>
              <input
                type="file"
                name="image"
                id="blog-image"
                accept="image/*,application/pdf"
                onChange={handleImageChange}
              />
            </div>
            <div className="file-input-group">
              <label htmlFor="blog-video">Upload Video:</label>
              <input
                type="file"
                name="video"
                id="blog-video"
                accept="video/*"
                onChange={handleVideoChange}
              />
            </div>
            <label>
              <input
                type="checkbox"
                name="featured"
                checked={newBlog.featured}
                onChange={handleInputChange}
              />
              Featured Post?
            </label>
            <button type="submit">Post Blog</button>
          </form>
        )}

        {loading ? (
          <p className="loading">Loading blogs...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : (
          <main className="blogs-main">
            {featuredBlogs.length > 0 && (
              <section className="featured-blogs">
                <h2>Featured Works</h2>
                {featuredBlogs.map((blog) => (
                  <article key={blog.id} className="blog-post featured">
                    <div className="blog-post-content">
                      <h3>
                        {blog.title || "Untitled Post"}
                        {isAdmin && (
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteBlog(blog.id)}
                          >
                            Delete
                          </button>
                        )}
                      </h3>
                      <div className="blog-meta">
                        <span>
                          {blog.date
                            ? new Date(blog.date).toLocaleDateString()
                            : "No date"}
                        </span>
                        {blog.tools && (
                          <>
                            <span>|</span>
                            <span>{blog.tools}</span>
                          </>
                        )}
                      </div>
                      <p>{blog.summary || "No summary provided."}</p>
                      {blog.doc_url && (
                        <a
                          href={blog.doc_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verify Document
                        </a>
                      )}
                    </div>
                    <div className="blog-post-media">
                      {blog.image_url && !blog.image_url.endsWith(".pdf") && (
                        <img
                          src={`https://portfolio-tfli.onrender.com${blog.image_url}`}
                          alt="Blog Visual"
                          className="blog-image"
                        />
                      )}
                      {blog.image_url && blog.image_url.endsWith(".pdf") && (
                        <iframe
                          src={`https://portfolio-tfli.onrender.com${blog.image_url}`}
                          width="100%"
                          height="600px"
                          style={{ border: "none" }}
                          title="PDF Preview"
                        >
                          <p>Your browser does not support inline PDFs.</p>
                        </iframe>
                      )}
                      {blog.video_url && (
                        <video controls className="blog-video">
                          <source
                            src={`https://portfolio-tfli.onrender.com${blog.video_url}`}
                            type="video/mp4"
                          />
                          Your browser does not support video playback.
                        </video>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {recentBlogs.length > 0 && (
              <section className="recent-blogs">
                <h2>Recent Posts</h2>
                {recentBlogs.map((blog) => (
                  <article key={blog.id} className="blog-post">
                    <div className="blog-post-content">
                      <h3>
                        {blog.title || "Untitled Post"}
                        {isAdmin && (
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteBlog(blog.id)}
                          >
                            Delete
                          </button>
                        )}
                      </h3>
                      <div className="blog-meta">
                        <span>
                          {blog.date
                            ? new Date(blog.date).toLocaleDateString()
                            : "No date"}
                        </span>
                        {blog.tools && (
                          <>
                            <span>|</span>
                            <span>{blog.tools}</span>
                          </>
                        )}
                      </div>
                      <p>{blog.summary || "No summary provided."}</p>
                      {blog.doc_url && (
                        <a
                          href={blog.doc_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verify Document
                        </a>
                      )}
                    </div>
                    <div className="blog-post-media">
                      {blog.image_url && !blog.image_url.endsWith(".pdf") && (
                        <img
                          src={`https://portfolio-tfli.onrender.com${blog.image_url}`}
                          alt="Blog Visual"
                          className="blog-image"
                        />
                      )}
                      {blog.image_url && blog.image_url.endsWith(".pdf") && (
                        <iframe
                          src={`https://portfolio-tfli.onrender.com${blog.image_url}`}
                          width="100%"
                          height="600px"
                          style={{ border: "none" }}
                          title="PDF Preview"
                        >
                          <p>Your browser does not support inline PDFs.</p>
                        </iframe>
                      )}
                      {blog.video_url && (
                        <video controls className="blog-video">
                          <source
                            src={`https://portfolio-tfli.onrender.com${blog.video_url}`}
                            type="video/mp4"
                          />
                          Your browser does not support video playback.
                        </video>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {blogs.length === 0 && (
              <p className="no-blogs">No blogs found.</p>
            )}
          </main>
        )}
      </div>

   
    </div>
  );
};

export default Blogs;
